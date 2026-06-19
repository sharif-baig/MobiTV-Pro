/* ═══════════════════════════════════════════════════════════
   MOBITV — PLAYER MODULE
   Handles all video playback via Vidsrc embeds.
   Supports: Movies, TV Series, Anime, YouTube videos.
   Also manages: progress tracking, continue watching sync,
   fullscreen, keyboard shortcuts, server switching.

   FREE streaming sources used (no API key needed):
   - vidsrc.to  (primary)
   - vidsrc.me  (fallback)
   - vidsrc.in  (fallback 2)
═══════════════════════════════════════════════════════════ */

const PlayerModule = (() => {

  /* ── Streaming server list ──
     Servers confirmed working. vidsrc.cc = best quality, no ads.
     vidlink.pro = backup, has pause ads.
  ── */
  /* ── Streaming servers — best ones for production domains ── */
  const SERVERS = [
    {
      name:  '⭐ Server 1',
      movie: (id)       => `https://vidsrc.cc/v2/embed/movie/${id}`,
      tv:    (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    },
    {
      name:  'Server 2',
      movie: (id)       => `https://vidlink.pro/movie/${id}`,
      tv:    (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
    },
    {
      name:  'Server 3',
      movie: (id)       => `https://vidbinge.dev/embed/movie/${id}`,
      tv:    (id, s, e) => `https://vidbinge.dev/embed/tv/${id}/${s}/${e}`,
    },
    {
      name:  'Server 4',
      movie: (id)       => `https://player.smashy.stream/movie/${id}`,
      tv:    (id, s, e) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
    },
    {
      name:  'Server 5',
      movie: (id)       => `https://autoembed.co/movie/tmdb/${id}`,
      tv:    (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
    },
    {
      name:  'Server 6',
      movie: (id)       => `https://www.2embed.cc/embed/${id}`,
      tv:    (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
    },
  ];

  /* ── State ── */
  let _currentServer  = 0;
  let _currentItem    = null;
  let _progressTimer  = null;
  let _progressSaved  = 0;

  /* ─────────────────────────────────────────
     BUILD EMBED URL
  ───────────────────────────────────────── */
  function buildUrl(type, id, season = 1, episode = 1, serverIndex = 0) {
    const server = SERVERS[serverIndex] || SERVERS[0];
    if (type === 'movie') return server.movie(id);
    if (type === 'tv'   ) return server.tv(id, season, episode);
    if (type === 'anime') return server.tv(id, season, episode);
    return server.movie(id);
  }

  /* ─────────────────────────────────────────
     LOAD PLAYER
     Main entry point — call this to start playback
  ───────────────────────────────────────── */
  function load(item, season = 1, episode = 1) {
    if (!item) return;

    /* Enforce trial / plan check */
    if (typeof TrialManager !== 'undefined') {
      TrialManager.enforcePlayback(() => _startPlayback(item, season, episode));
    } else {
      _startPlayback(item, season, episode);
    }
  }

  function _startPlayback(item, season, episode) {
    _currentItem   = { ...item, season, episode };
    _currentServer = 0;

    console.log('[MobiTv Player] Playing:', {
      id:     item.id,
      type:   item.type,
      title:  item.title,
      season, episode
    });

    const url = buildUrl(item.type, item.id, season, episode, _currentServer);
    console.log('[MobiTv Player] Embed URL:', url);
    _embedPlayer(url);
    _updatePlayerUI(item, season, episode);
    _startProgressTracking();

    /* Log to history */
    if (typeof StorageModule !== 'undefined') {
      StorageModule.History.add({ ...item, season, episode });
    }
  }

  /* ─────────────────────────────────────────
     EMBED PLAYER
  ───────────────────────────────────────── */
  function _embedPlayer(url) {
    const wrap     = document.getElementById('playerWrap');
    const iframe   = document.getElementById('playerIframe');
    const skeleton = document.getElementById('playerSkeleton');

    if (!wrap) return;

    /* Update iframe src */
    if (iframe) {
      iframe.src = 'about:blank';
      setTimeout(() => { iframe.src = url; }, 100);
    }

    /* Always show the watch button — works regardless of iframe policy */
    if (skeleton) {
      skeleton.innerHTML = `
        <div class="player-launch">
          <div class="player-launch__icon">🎬</div>
          <div class="player-launch__title">Ready to Watch</div>
          <div class="player-launch__hint">Click to open the stream player</div>
          <button
            class="player-launch__btn"
            id="launchBtn"
            onclick="PlayerModule.openStream()"
          >▶ &nbsp; Watch Now</button>
          <div class="player-launch__sub">
            If one server doesn't work, use the server tabs below
          </div>
        </div>
      `;
      skeleton.style.display = 'flex';
    }
  }

  /* ─────────────────────────────────────────
     UPDATE PLAYER UI
     Updates title, episode selector, server tabs
  ───────────────────────────────────────── */
  function _updatePlayerUI(item, season, episode) {
    /* Title */
    const titleEl = document.getElementById('playerTitle');
    if (titleEl) {
      titleEl.textContent = item.type === 'movie'
        ? item.title
        : `${item.title} — S${season} E${episode}`;
    }

    /* Server tabs */
    const serverTabs = document.getElementById('serverTabs');
    if (serverTabs) {
      serverTabs.innerHTML = SERVERS.map((s, i) => `
        <button
          class="server-tab ${i === _currentServer ? 'active' : ''}"
          onclick="PlayerModule.switchToServer(${i})"
        >${s.name}</button>
      `).join('');
    }

    /* Add to continue watching */
    const progress = typeof StorageModule !== 'undefined'
      ? StorageModule.ContinueWatching.getProgress(item.id, item.type)
      : 0;

    /* Watchlist button state */
    const wlBtn = document.getElementById('playerWatchlistBtn');
    if (wlBtn && typeof StorageModule !== 'undefined') {
      const inList = StorageModule.Watchlist.has(item.id, item.type);
      wlBtn.textContent = inList ? '✅ In Watchlist' : '＋ Add to Watchlist';
    }
  }

  /* ─────────────────────────────────────────
     SWITCH SERVER
  ───────────────────────────────────────── */
  function switchToServer(index) {
    if (!_currentItem) return;
    _currentServer = index;

    const url = buildUrl(
      _currentItem.type,
      _currentItem.id,
      _currentItem.season  || 1,
      _currentItem.episode || 1,
      _currentServer
    );

    _embedPlayer(url);
    _updatePlayerUI(_currentItem, _currentItem.season || 1, _currentItem.episode || 1);

    if (typeof showToast === 'function') {
      showToast(`Switched to ${SERVERS[index].name}`, 'info');
    }
  }

  /* Auto switch on error */
  function _switchServer() {
    const next = (_currentServer + 1) % SERVERS.length;
    if (next === 0) {
      /* All servers tried */
      _showPlayerError();
      return;
    }
    if (typeof showToast === 'function') {
      showToast(`Server ${_currentServer + 1} unavailable, trying next...`, 'warning');
    }
    switchToServer(next);
  }

  /* ─────────────────────────────────────────
     PLAYER ERROR STATE
  ───────────────────────────────────────── */
  function _showPlayerError() {
    const container = document.getElementById('playerContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="player-error">
        <div class="player-error__icon">😔</div>
        <h3 class="player-error__title">Stream Unavailable</h3>
        <p class="player-error__text">
          This title isn't available right now. Try again later or
          browse something else.
        </p>
        <button class="btn btn-primary" onclick="history.back()">
          ← Go Back
        </button>
      </div>
    `;
  }

  /* ─────────────────────────────────────────
     PROGRESS TRACKING
     Simulates progress tracking since we can't
     access iframe internals cross-origin.
     Uses elapsed time as a proxy.
  ───────────────────────────────────────── */
  function _startProgressTracking() {
    if (_progressTimer) clearInterval(_progressTimer);

    const startTime    = Date.now();
    const MOVIE_DURATION = 110 * 60 * 1000;  // assume 110 min average
    const TV_DURATION    = 45  * 60 * 1000;  // assume 45 min average

    const duration = _currentItem?.type === 'movie' ? MOVIE_DURATION : TV_DURATION;

    _progressTimer = setInterval(() => {
      if (!_currentItem) return;

      const elapsed  = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 99);

      if (Math.abs(progress - _progressSaved) >= 2) {
        _progressSaved = progress;
        if (typeof StorageModule !== 'undefined') {
          StorageModule.ContinueWatching.save(_currentItem, progress);
        }
      }
    }, 30000); // save every 30 seconds
  }

  function stopProgressTracking() {
    if (_progressTimer) {
      clearInterval(_progressTimer);
      _progressTimer = null;
    }
  }

  /* ─────────────────────────────────────────
     EPISODE NAVIGATION (TV/Anime)
  ───────────────────────────────────────── */
  function nextEpisode() {
    if (!_currentItem || _currentItem.type === 'movie') return;
    load(_currentItem, _currentItem.season, _currentItem.episode + 1);
    if (typeof showToast === 'function') {
      showToast(`▶ S${_currentItem.season} E${_currentItem.episode} — Loading...`, 'info');
    }
  }

  function prevEpisode() {
    if (!_currentItem || _currentItem.type === 'movie') return;
    if (_currentItem.episode <= 1) return;
    load(_currentItem, _currentItem.season, _currentItem.episode - 1);
  }

  function goToEpisode(season, episode) {
    if (!_currentItem) return;
    load(_currentItem, season, episode);
  }

  /* ─────────────────────────────────────────
     WATCHLIST TOGGLE (from player page)
  ───────────────────────────────────────── */
  function toggleWatchlist() {
    if (!_currentItem || typeof StorageModule === 'undefined') return;

    const added = StorageModule.Watchlist.toggle(_currentItem);
    const btn   = document.getElementById('playerWatchlistBtn');

    if (btn) btn.textContent = added ? '✅ In Watchlist' : '＋ Add to Watchlist';
    if (typeof showToast === 'function') {
      showToast(added ? '✅ Added to Watchlist' : 'Removed from Watchlist', added ? 'success' : 'info');
    }
  }

  /* ─────────────────────────────────────────
     KEYBOARD SHORTCUTS (player page)
  ───────────────────────────────────────── */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextEpisode();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevEpisode();
          break;
        case 'Escape':
          stopProgressTracking();
          break;
      }
    });
  }

  /* ─────────────────────────────────────────
     YOUTUBE PLAYER
     For YouTube trending tab
  ───────────────────────────────────────── */
  function loadYoutube(videoId) {
    const url = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    _embedPlayer(url);

    const titleEl = document.getElementById('playerTitle');
    if (titleEl) titleEl.textContent = 'YouTube Video';
  }

  /* ─────────────────────────────────────────
     GET CURRENT ITEM
  ───────────────────────────────────────── */
  function getCurrentItem() {
    return _currentItem;
  }

  /* ─────────────────────────────────────────
     INIT (called on watch.html page load)
  ───────────────────────────────────────── */
  function init() {
    const params = typeof Router !== 'undefined'
      ? Router.getQueryParams()
      : Object.fromEntries(new URLSearchParams(window.location.search));

    const { type, id, s, e, yt } = params;

    /* YouTube video */
    if (yt) {
      loadYoutube(yt);
      return;
    }

    /* Regular media */
    if (type && id) {
      const season  = parseInt(s)  || 1;
      const episode = parseInt(e)  || 1;

      /* Fetch full item details from TMDB then play */
      _loadAndPlay(type, id, season, episode);
    }

    initKeyboardShortcuts();
  }

  async function _loadAndPlay(type, id, season, episode) {
    try {
      let details;
      if (type === 'movie') {
        const raw = await TMDB.Movies.details(id);
        details   = TMDB.Normalize.details(raw);
      } else {
        const raw = await TMDB.TV.details(id);
        details   = TMDB.Normalize.details(raw);
        details.type = type; // preserve 'anime' type if set
      }

      if (details) {
        _populateMediaInfo(details);
        load(details, season, episode);
      }
    } catch (err) {
      console.error('[Player] Failed to load details:', err);
      /* Play anyway with minimal info */
      load({ id: parseInt(id), type, title: 'Loading...' }, season, episode);
    }
  }

  /* Populate media info panel next to player */
  function _populateMediaInfo(item) {
    const els = {
      poster:   document.getElementById('mediaPoster'),
      title:    document.getElementById('mediaTitle'),
      meta:     document.getElementById('mediaMeta'),
      overview: document.getElementById('mediaOverview'),
      genres:   document.getElementById('mediaGenres'),
      cast:     document.getElementById('mediaCast'),
    };

    if (els.poster && item.poster) {
      els.poster.src = item.poster;
      els.poster.alt = item.title;
    }
    if (els.title)    els.title.textContent   = item.title;
    if (els.meta)     els.meta.innerHTML = `
      <span class="meta-rating">⭐ ${item.rating}</span>
      <span class="meta-year">${item.year}</span>
      ${item.runtime ? `<span class="meta-runtime">${item.runtime}</span>` : ''}
      ${item.seasons ? `<span class="meta-seasons">${item.seasons} Seasons</span>` : ''}
    `;
    if (els.overview) els.overview.textContent = item.overview;
    if (els.genres && item.genres?.length) {
      els.genres.innerHTML = item.genres
        .map(g => `<span class="genre-chip">${g}</span>`)
        .join('');
    }
    if (els.cast && item.cast?.length) {
      els.cast.innerHTML = item.cast.slice(0, 6).map(c => `
        <div class="cast-item">
          <img
            src="${c.photo || Helpers.placeholderImg(c.name, 0)}"
            alt="${c.name}"
            onerror="this.src='${Helpers.placeholderImg(c.name, 0)}'"
          />
          <span class="cast-name">${c.name}</span>
          <span class="cast-char">${Helpers.truncate(c.character, 20)}</span>
        </div>
      `).join('');
    }
  }

  /* ─────────────────────────────────────────
     OPEN STREAM
     Opens current stream URL in a new tab
  ───────────────────────────────────────── */
  function openStream() {
    if (!_currentItem) return;
    const url = buildUrl(
      _currentItem.type,
      _currentItem.id,
      _currentItem.season  || 1,
      _currentItem.episode || 1,
      _currentServer
    );
    window.open(url, '_blank');
  }

  /* Public API */
  return {
    load,
    loadYoutube,
    openStream,
    switchToServer,
    nextEpisode,
    prevEpisode,
    goToEpisode,
    toggleWatchlist,
    getCurrentItem,
    stopProgressTracking,
    initKeyboardShortcuts,
    init,
    buildUrl,
    SERVERS,
  };

})();

/* Auto-init on watch page */
if (document.getElementById('playerContainer')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PlayerModule.init);
  } else {
    PlayerModule.init();
  }
}