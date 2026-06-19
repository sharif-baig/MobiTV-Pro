/* ═══════════════════════════════════════════════════════════
   MOBITV — MEDIA CARD COMPONENT
   Renders individual content tiles for movies, series,
   anime, cartoons, documentaries, live TV, games.
   Handles hover effects, badges, watchlist toggle,
   play button, and modal trigger.
═══════════════════════════════════════════════════════════ */

const MediaCard = (() => {

  /* ─────────────────────────────────────────
     BUILD PORTRAIT CARD (movies, series, anime)
     160×240px vertical card
  ───────────────────────────────────────── */
  function buildPortrait(item, index = 0) {
    if (!item) return null;

    const card        = document.createElement('div');
    card.className    = 'media-card media-card--portrait';
    card.dataset.id   = item.id;
    card.dataset.type = item.type;

    const poster      = item.poster || Helpers.placeholderImg(item.title, index);
    const rating      = item.rating || 0;
    const badge       = Helpers.getMediaBadge(item);
    const inWatchlist = typeof StorageModule !== 'undefined'
      ? StorageModule.Watchlist.has(item.id, item.type)
      : false;

    card.innerHTML = `
      <div class="media-card__inner">

        <!-- Poster Image -->
        <img
          class="media-card__poster"
          src="${poster}"
          alt="${Helpers.truncate(item.title, 40)}"
          loading="lazy"
          onerror="Helpers.onImgError(this, '${item.title?.replace(/'/g, '')}', ${index})"
        />

        <!-- Badge (NEW, HOT, LIVE, TRENDING) -->
        ${badge ? `<span class="badge badge-${badge.type} media-card__badge">${badge.text}</span>` : ''}

        <!-- Watchlist Button -->
        <button
          class="media-card__wl-btn ${inWatchlist ? 'active' : ''}"
          title="${inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}"
          data-id="${item.id}"
          data-type="${item.type}"
        >${inWatchlist ? '✅' : '＋'}</button>

        <!-- Hover Overlay -->
        <div class="media-card__overlay">

          <!-- Play Button -->
          <button class="media-card__play-btn" data-id="${item.id}" data-type="${item.type}">
            ▶
          </button>

          <!-- Info -->
          <div class="media-card__info">
            <div class="media-card__title">${Helpers.truncate(item.title, 30)}</div>
            <div class="media-card__meta">
              ${rating > 0 ? `<span class="media-card__rating" style="color:${Helpers.ratingColor(rating)}">⭐ ${rating}</span>` : ''}
              ${item.year ? `<span class="media-card__year">${item.year}</span>` : ''}
              ${item.seasons ? `<span class="media-card__seasons">${item.seasons}S</span>` : ''}
            </div>
            <button class="media-card__more-btn" data-id="${item.id}" data-type="${item.type}">
              More Info
            </button>
          </div>

        </div>

        <!-- Progress Bar (continue watching) -->
        ${_buildProgressBar(item)}

      </div>
    `;

    _attachCardEvents(card, item);
    return card;
  }

  /* ─────────────────────────────────────────
     BUILD LANDSCAPE CARD
     280×158px horizontal card (docs, games, YouTube)
  ───────────────────────────────────────── */
  function buildLandscape(item, index = 0) {
    if (!item) return null;

    const card        = document.createElement('div');
    card.className    = 'media-card media-card--landscape';
    card.dataset.id   = item.id;
    card.dataset.type = item.type;

    const thumb   = item.backdrop || item.poster || item.thumbnail
                  || Helpers.placeholderImg(item.title, index);
    const badge   = Helpers.getMediaBadge(item);

    card.innerHTML = `
      <div class="media-card__inner">

        <img
          class="media-card__poster"
          src="${thumb}"
          alt="${Helpers.truncate(item.title || '', 40)}"
          loading="lazy"
          onerror="Helpers.onImgError(this, '${(item.title || '').replace(/'/g, '')}', ${index})"
        />

        ${badge ? `<span class="badge badge-${badge.type} media-card__badge">${badge.text}</span>` : ''}

        <!-- Duration badge (YouTube) -->
        ${item.duration ? `<span class="media-card__duration">${item.duration}</span>` : ''}

        <div class="media-card__overlay">
          <button class="media-card__play-btn" data-id="${item.id}" data-type="${item.type}">▶</button>
          <div class="media-card__info">
            <div class="media-card__title">${Helpers.truncate(item.title || '', 40)}</div>
            <div class="media-card__meta">
              ${item.rating > 0 ? `<span class="media-card__rating" style="color:${Helpers.ratingColor(item.rating)}">⭐ ${item.rating}</span>` : ''}
              ${item.year ? `<span class="media-card__year">${item.year}</span>` : ''}
              ${item.channelTitle ? `<span class="media-card__channel">${Helpers.truncate(item.channelTitle, 20)}</span>` : ''}
            </div>
          </div>
        </div>

        ${_buildProgressBar(item)}
      </div>
    `;

    _attachCardEvents(card, item);
    return card;
  }

  /* ─────────────────────────────────────────
     BUILD LIVE CHANNEL CARD
     For live TV grid
  ───────────────────────────────────────── */
  function buildChannel(channel, index = 0) {
    if (!channel) return null;

    const card        = document.createElement('div');
    card.className    = 'live-channel-card';
    card.dataset.id   = channel.id;
    card.dataset.type = 'channel';

    const logo = channel.logo || Helpers.placeholderImg(channel.name, index);

    card.innerHTML = `
      <span class="badge badge-live">LIVE</span>
      <img
        class="live-channel-card__logo"
        src="${logo}"
        alt="${channel.name}"
        loading="lazy"
        onerror="this.style.display='none'"
      />
      <div class="live-channel-card__name">${Helpers.truncate(channel.name, 24)}</div>
      <div class="live-channel-card__country">${channel.country || ''}</div>
    `;

    card.addEventListener('click', () => {
      if (typeof TrialManager !== 'undefined') {
        TrialManager.enforcePlayback(() => {
          window.location.href = `${Router?.getBasePath() || ''}pages/watch.html?type=channel&id=${encodeURIComponent(channel.id)}&url=${encodeURIComponent(channel.url || '')}`;
        });
      }
    });

    return card;
  }

  /* ─────────────────────────────────────────
     BUILD GAME CARD
  ───────────────────────────────────────── */
  function buildGame(game, index = 0) {
    if (!game) return null;

    const card        = document.createElement('div');
    card.className    = 'media-card media-card--landscape media-card--game';
    card.dataset.id   = game.id;
    card.dataset.type = 'game';

    card.innerHTML = `
      <div class="media-card__inner">
        <div class="game-card__thumb" style="background: ${game.color || 'linear-gradient(135deg,#1a1a2e,#16213e)'}">
          <span class="game-card__icon">${game.icon || '🎮'}</span>
          <span class="game-card__system">${game.system || 'NES'}</span>
        </div>
        <div class="media-card__overlay">
          <button class="media-card__play-btn">▶ Play</button>
          <div class="media-card__info">
            <div class="media-card__title">${Helpers.truncate(game.title, 28)}</div>
            <div class="media-card__meta">
              <span class="media-card__year">${game.system || ''}</span>
              ${game.genre ? `<span class="media-card__genre">${game.genre}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      window.location.href = `${Router?.getBasePath() || ''}pages/games.html?id=${game.id}`;
    });

    return card;
  }

  /* ─────────────────────────────────────────
     PROGRESS BAR (continue watching)
  ───────────────────────────────────────── */
  function _buildProgressBar(item) {
    if (typeof StorageModule === 'undefined') return '';
    const progress = StorageModule.ContinueWatching.getProgress(item.id, item.type);
    if (!progress) return '';

    return `
      <div class="media-card__progress">
        <div class="media-card__progress-fill" style="width:${progress}%"></div>
      </div>
    `;
  }

  /* ─────────────────────────────────────────
     ATTACH EVENTS
  ───────────────────────────────────────── */
  function _attachCardEvents(card, item) {

    /* Play button */
    const playBtn = card.querySelector('.media-card__play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        _handlePlay(item);
      });
    }

    /* More Info button */
    const moreBtn = card.querySelector('.media-card__more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        _handleMoreInfo(item);
      });
    }

    /* Watchlist button */
    const wlBtn = card.querySelector('.media-card__wl-btn');
    if (wlBtn) {
      wlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        _handleWatchlistToggle(wlBtn, item);
      });
    }

    /* Card click → More Info (only if not clicking a button) */
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) _handleMoreInfo(item);
    });
  }

  /* ─────────────────────────────────────────
     EVENT HANDLERS
  ───────────────────────────────────────── */
  function _handlePlay(item) {
    const isSubPage = window.location.pathname.includes('/pages/');
    const base      = isSubPage ? '../' : '';
    const watchUrl  = `${base}pages/watch.html?type=${item.type}&id=${item.id}`;

    /* Only block if user is explicitly on expired free tier */
    try {
      const plan = (typeof TrialManager !== 'undefined' && TrialManager.getCurrentPlan)
        ? TrialManager.getCurrentPlan()
        : null;

      if (plan === 'free') {
        const overlay = document.getElementById('paywallOverlay');
        if (overlay) { overlay.classList.add('active'); return; }
      }
    } catch(e) {
      /* TrialManager not ready — allow play */
    }

    window.location.href = watchUrl;
  }

  function _handleMoreInfo(item) {
    if (typeof ModalModule !== 'undefined') {
      ModalModule.open(item);
    } else {
      _handlePlay(item);
    }
  }

  function _handleWatchlistToggle(btn, item) {
    if (typeof StorageModule === 'undefined') return;

    const added = StorageModule.Watchlist.toggle(item);
    btn.textContent = added ? '✅' : '＋';
    btn.classList.toggle('active', added);
    btn.title = added ? 'Remove from Watchlist' : 'Add to Watchlist';

    if (typeof showToast === 'function') {
      showToast(
        added ? `✅ "${Helpers.truncate(item.title, 25)}" added to Watchlist`
               : `Removed from Watchlist`,
        added ? 'success' : 'info'
      );
    }
  }

  /* ─────────────────────────────────────────
     SKELETON ROW BUILDER
  ───────────────────────────────────────── */
  function buildSkeletonRow(count = 6, type = 'portrait') {
    const cls = type === 'portrait' ? 'skeleton-card' : 'skeleton-card-landscape';
    return Array.from({ length: count }, () => {
      const el = document.createElement('div');
      el.className = `skeleton ${cls}`;
      return el;
    });
  }

  /* Public API */
  return {
    buildPortrait,
    buildLandscape,
    buildChannel,
    buildGame,
    buildSkeletonRow,
  };

})();