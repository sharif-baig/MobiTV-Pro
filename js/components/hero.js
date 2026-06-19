/* ═══════════════════════════════════════════════════════════
   MOBITV — HERO MODULE
   Personalized hero section:
   - Shows last watched item if user has history
   - Otherwise shows trending content
   - Auto-rotates every 6 seconds
   - Smooth background crossfade
   - Slide indicators + arrow navigation
═══════════════════════════════════════════════════════════ */

const HeroModule = (() => {

  let _items       = [];
  let _current     = 0;
  let _timer       = null;
  let _paused      = false;

  /* ─────────────────────────────────────────
     INIT
     Called by mediaRow.js after trending loads
  ───────────────────────────────────────── */
  function init(trendingItems = []) {
    /* Personalize: put last watched item first */
    _items = _buildPersonalizedList(trendingItems);
    if (!_items.length) return;

    _current = 0;
    _render(_current);
    _buildIndicators();
    _startAutoRotate();
    _bindControls();
  }

  /* ─────────────────────────────────────────
     PERSONALIZATION
     If user has continue-watching items,
     show the most recent one first in hero
  ───────────────────────────────────────── */
  function _buildPersonalizedList(trending) {
    const list = [...trending.slice(0, 8)];

    if (typeof StorageModule === 'undefined') return list;

    const continueItems = StorageModule.ContinueWatching.getAll();
    if (!continueItems.length) return list;

    /* Find last watched item in trending or use it directly */
    const lastWatched = continueItems[0];

    /* Check if it's already in our list */
    const existingIdx = list.findIndex(i => i.id === lastWatched.id);

    if (existingIdx > 0) {
      /* Move it to front */
      const [item] = list.splice(existingIdx, 1);
      list.unshift(item);
    } else if (lastWatched.backdrop || lastWatched.poster) {
      /* Inject it at front with available data */
      list.unshift({
        id:       lastWatched.id,
        type:     lastWatched.type,
        title:    lastWatched.title,
        overview: '',
        backdrop: lastWatched.backdrop || lastWatched.poster,
        poster:   lastWatched.poster,
        rating:   lastWatched.rating || 0,
        year:     lastWatched.year || '',
        progress: lastWatched.progress || 0,
      });
    }

    return list;
  }

  /* ─────────────────────────────────────────
     RENDER SLIDE
  ───────────────────────────────────────── */
  function _render(index) {
    const item = _items[index];
    if (!item) return;

    const bgEl       = document.getElementById('heroBgImage');
    const titleEl    = document.getElementById('heroTitle');
    const descEl     = document.getElementById('heroDesc');
    const badgeEl    = document.getElementById('heroBadge');
    const ratingEl   = document.getElementById('heroRating');
    const yearEl     = document.getElementById('heroYear');
    const genreEl    = document.getElementById('heroGenre');
    const playBtn    = document.getElementById('heroPlayBtn');
    const infoBtn    = document.getElementById('heroInfoBtn');
    const wlBtn      = document.getElementById('heroWatchlistBtn');
    const progressEl = document.getElementById('heroProgress');
    const fillEl     = document.getElementById('heroProgressFill');

    /* Background image crossfade */
    if (bgEl && item.backdrop) {
      bgEl.style.transition = 'opacity 0.6s ease';
      bgEl.style.opacity    = '0';
      setTimeout(() => {
        bgEl.style.backgroundImage = `url(${item.backdrop})`;
        bgEl.style.opacity         = '1';
      }, 300);
    }

    /* Text content */
    if (titleEl)  titleEl.textContent  = item.title || 'MobiTv';
    if (descEl)   descEl.textContent   = Helpers.truncate(item.overview || 'Watch now on MobiTv — free global streaming.', 180);
    if (ratingEl) ratingEl.textContent = item.rating > 0 ? `⭐ ${item.rating}` : '';
    if (yearEl)   yearEl.textContent   = item.year || '';
    if (genreEl)  genreEl.textContent  = _genreLabel(item);

    /* Badge */
    if (badgeEl) {
      const badge = Helpers.getMediaBadge(item);
      if (badge) {
        badgeEl.textContent  = badge.text;
        badgeEl.className    = `badge badge-${badge.type}`;
        badgeEl.style.display = 'inline-flex';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    /* Continue watching progress */
    if (progressEl && fillEl) {
      const progress = item.progress ||
        (typeof StorageModule !== 'undefined'
          ? StorageModule.ContinueWatching.getProgress(item.id, item.type)
          : 0);

      if (progress > 0) {
        progressEl.style.display  = 'block';
        fillEl.style.width        = `${progress}%`;
        if (playBtn) playBtn.innerHTML = '▶ &nbsp;Continue Watching';
      } else {
        progressEl.style.display = 'none';
        if (playBtn) playBtn.innerHTML = '▶ &nbsp;Play Now';
      }
    }

    /* Wire play button */
    if (playBtn) {
      playBtn.onclick = () => {
        if (typeof TrialManager !== 'undefined') {
          TrialManager.enforcePlayback(() => _navigateToWatch(item));
        } else {
          _navigateToWatch(item);
        }
      };
    }

    /* Wire info button */
    if (infoBtn) {
      infoBtn.onclick = () => {
        if (typeof ModalModule !== 'undefined') {
          ModalModule.open(item);
        } else {
          _navigateToWatch(item);
        }
      };
    }

    /* Wire watchlist button */
    if (wlBtn) {
      const inList = typeof StorageModule !== 'undefined'
        ? StorageModule.Watchlist.has(item.id, item.type)
        : false;
      wlBtn.textContent = inList ? '✅' : '＋';

      wlBtn.onclick = () => {
        if (typeof StorageModule === 'undefined') return;
        const added = StorageModule.Watchlist.toggle(item);
        wlBtn.textContent = added ? '✅' : '＋';
        if (typeof showToast === 'function') {
          showToast(
            added ? `✅ "${Helpers.truncate(item.title, 25)}" added to Watchlist` : 'Removed from Watchlist',
            added ? 'success' : 'info'
          );
        }
      };
    }

    /* Update indicators */
    _updateIndicators(index);
  }

  /* ─────────────────────────────────────────
     GENRE LABEL from genre IDs
  ───────────────────────────────────────── */
  function _genreLabel(item) {
    if (!item.genres?.length) {
      return item.type === 'tv' ? 'TV Series' : 'Movie';
    }

    /* item.genres can be IDs (number) or names (string) */
    if (typeof item.genres[0] === 'string') {
      return item.genres.slice(0, 2).join(' · ');
    }

    /* Look up genre names from constants */
    const map   = MobiConstants.genres[item.type === 'movie' ? 'movie' : 'tv'];
    const names = Object.entries(map)
      .filter(([, id]) => item.genres.includes(id))
      .map(([name]) => Helpers.capitalize(name))
      .slice(0, 2);

    return names.join(' · ') || (item.type === 'tv' ? 'TV Series' : 'Movie');
  }

  /* ─────────────────────────────────────────
     NAVIGATE TO WATCH PAGE
  ───────────────────────────────────────── */
  function _navigateToWatch(item) {
    const isSubPage = window.location.pathname.includes('/pages/');
    const base      = isSubPage ? '../' : '';
    window.location.href = `${base}pages/watch.html?type=${item.type}&id=${item.id}`;
  }

  /* ─────────────────────────────────────────
     SLIDE INDICATORS
  ───────────────────────────────────────── */
  function _buildIndicators() {
    const container = document.getElementById('heroIndicators');
    if (!container) return;

    container.innerHTML = _items.map((_, i) => `
      <span class="hero__dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
    `).join('');

    container.querySelectorAll('.hero__dot').forEach(dot => {
      dot.addEventListener('click', () => {
        goTo(parseInt(dot.dataset.index));
      });
    });
  }

  function _updateIndicators(index) {
    document.querySelectorAll('.hero__dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  /* ─────────────────────────────────────────
     AUTO ROTATION
  ───────────────────────────────────────── */
  function _startAutoRotate() {
    _timer = setInterval(() => {
      if (!_paused) next();
    }, 6000);
  }

  function _stopAutoRotate() {
    if (_timer) {
      clearInterval(_timer);
      _timer = null;
    }
  }

  /* ─────────────────────────────────────────
     NAVIGATION
  ───────────────────────────────────────── */
  function next() {
    _current = (_current + 1) % _items.length;
    _render(_current);
  }

  function prev() {
    _current = (_current - 1 + _items.length) % _items.length;
    _render(_current);
  }

  function goTo(index) {
    _current = index;
    _render(_current);
    /* Reset timer on manual nav */
    _stopAutoRotate();
    _startAutoRotate();
  }

  /* ─────────────────────────────────────────
     BIND CONTROLS
  ───────────────────────────────────────── */
  function _bindControls() {
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    const hero    = document.getElementById('heroSection');

    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); _resetTimer(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); _resetTimer(); });

    /* Pause on hover */
    if (hero) {
      hero.addEventListener('mouseenter', () => { _paused = true;  });
      hero.addEventListener('mouseleave', () => { _paused = false; });
    }

    /* Touch swipe support */
    let touchStartX = 0;
    if (hero) {
      hero.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      hero.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          diff > 0 ? next() : prev();
          _resetTimer();
        }
      }, { passive: true });
    }
  }

  function _resetTimer() {
    _stopAutoRotate();
    _startAutoRotate();
  }

  /* Public API */
  return { init, next, prev, goTo };

})();