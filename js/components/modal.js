/* ═══════════════════════════════════════════════════════════
   MOBITV — MODAL MODULE
   Shows media details in a popup overlay.
   Triggered by "More Info" button on cards and hero.
═══════════════════════════════════════════════════════════ */

const ModalModule = (() => {

  let _overlay = null;
  let _current = null;

  /* ─────────────────────────────────────────
     INIT — inject modal HTML into page
  ───────────────────────────────────────── */
  function _injectModal() {
    if (document.getElementById('mediaModal')) return;

    const modal = document.createElement('div');
    modal.id        = 'mediaModal';
    modal.className = 'media-modal';
    modal.innerHTML = `
      <div class="media-modal__backdrop" id="modalBackdrop"></div>
      <div class="media-modal__box" id="modalBox">

        <!-- Hero backdrop -->
        <div class="media-modal__hero" id="modalHero">
          <div class="media-modal__hero-grad"></div>
          <button class="media-modal__close" id="modalClose">✕</button>
        </div>

        <!-- Body -->
        <div class="media-modal__body">

          <div class="media-modal__left">
            <img class="media-modal__poster" id="modalPoster" src="" alt="" />
          </div>

          <div class="media-modal__right">
            <h2 class="media-modal__title"  id="modalTitle"></h2>
            <div class="media-modal__meta"  id="modalMeta"></div>
            <p  class="media-modal__overview" id="modalOverview"></p>
            <div class="media-modal__genres"  id="modalGenres"></div>

            <div class="media-modal__actions">
              <button class="btn btn-primary btn-lg" id="modalPlayBtn">▶ Play Now</button>
              <button class="btn btn-secondary"      id="modalWlBtn">＋ Watchlist</button>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(modal);
    _injectStyles();

    /* Close handlers */
    document.getElementById('modalBackdrop').addEventListener('click', close);
    document.getElementById('modalClose').addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    _overlay = modal;
  }

  /* ─────────────────────────────────────────
     OPEN
  ───────────────────────────────────────── */
  async function open(item) {
    _injectModal();
    _current = item;

    /* Show modal immediately with basic info */
    _populate(item);
    document.getElementById('mediaModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    /* Then fetch full details from TMDB */
    try {
      let full;
      if (item.type === 'movie') {
        full = await TMDB.Movies.details(item.id);
      } else {
        full = await TMDB.TV.details(item.id);
      }
      if (full) {
        const details = TMDB.Normalize.details(full);
        _current = { ...item, ...details };
        _populate(_current);
      }
    } catch (err) {
      console.warn('[Modal] Could not fetch full details:', err);
    }
  }

  /* ─────────────────────────────────────────
     POPULATE
  ───────────────────────────────────────── */
  function _populate(item) {
    /* Hero backdrop */
    const heroEl = document.getElementById('modalHero');
    if (heroEl && item.backdrop) {
      heroEl.style.backgroundImage = `url(${item.backdrop})`;
      heroEl.style.backgroundSize  = 'cover';
      heroEl.style.backgroundPosition = 'center';
    }

    /* Poster */
    const posterEl = document.getElementById('modalPoster');
    if (posterEl) {
      posterEl.src = item.poster || Helpers.placeholderImg(item.title, 0);
      posterEl.alt = item.title;
      posterEl.onerror = () => {
        posterEl.src = Helpers.placeholderImg(item.title, 0);
      };
    }

    /* Title */
    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.textContent = item.title || 'Unknown';

    /* Meta */
    const metaEl = document.getElementById('modalMeta');
    if (metaEl) {
      metaEl.innerHTML = `
        ${item.rating > 0 ? `<span class="modal-meta-chip" style="color:#ffd700">⭐ ${item.rating}</span>` : ''}
        ${item.year     ? `<span class="modal-meta-chip">${item.year}</span>` : ''}
        ${item.runtime  ? `<span class="modal-meta-chip">⏱ ${item.runtime}</span>` : ''}
        ${item.seasons  ? `<span class="modal-meta-chip">📺 ${item.seasons} Season${item.seasons > 1 ? 's' : ''}</span>` : ''}
        ${item.language ? `<span class="modal-meta-chip">${item.language.toUpperCase()}</span>` : ''}
      `;
    }

    /* Overview */
    const overviewEl = document.getElementById('modalOverview');
    if (overviewEl) {
      overviewEl.textContent = item.overview
        ? Helpers.truncate(item.overview, 300)
        : 'No description available.';
    }

    /* Genres */
    const genresEl = document.getElementById('modalGenres');
    if (genresEl && item.genres?.length) {
      const names = typeof item.genres[0] === 'string'
        ? item.genres
        : Object.entries(MobiConstants.genres[item.type === 'movie' ? 'movie' : 'tv'] || {})
            .filter(([, id]) => item.genres.includes(id))
            .map(([name]) => Helpers.capitalize(name));

      genresEl.innerHTML = names.slice(0, 4)
        .map(g => `<span class="genre-chip">${g}</span>`)
        .join('');
    }

    /* Play button */
    const playBtn = document.getElementById('modalPlayBtn');
    if (playBtn) {
      /* Show continue watching label if applicable */
      const progress = typeof StorageModule !== 'undefined'
        ? StorageModule.ContinueWatching.getProgress(item.id, item.type)
        : 0;
      playBtn.innerHTML = progress > 0 ? '▶ Continue Watching' : '▶ Play Now';

      playBtn.onclick = () => {
        close();
        if (typeof TrialManager !== 'undefined') {
          TrialManager.enforcePlayback(() => _navigateToWatch(item));
        } else {
          _navigateToWatch(item);
        }
      };
    }

    /* Watchlist button */
    const wlBtn = document.getElementById('modalWlBtn');
    if (wlBtn) {
      const inList = typeof StorageModule !== 'undefined'
        ? StorageModule.Watchlist.has(item.id, item.type)
        : false;

      wlBtn.textContent = inList ? '✅ In Watchlist' : '＋ Watchlist';

      wlBtn.onclick = () => {
        if (typeof StorageModule === 'undefined') return;
        const added = StorageModule.Watchlist.toggle(item);
        wlBtn.textContent = added ? '✅ In Watchlist' : '＋ Watchlist';
        if (typeof showToast === 'function') {
          showToast(
            added ? `✅ Added to Watchlist` : 'Removed from Watchlist',
            added ? 'success' : 'info'
          );
        }
      };
    }
  }

  /* ─────────────────────────────────────────
     NAVIGATE TO WATCH
  ───────────────────────────────────────── */
  function _navigateToWatch(item) {
    const base = typeof Router !== 'undefined' ? Router.getBasePath() : '';
    window.location.href = `${base}pages/watch.html?type=${item.type}&id=${item.id}`;
  }

  /* ─────────────────────────────────────────
     CLOSE
  ───────────────────────────────────────── */
  function close() {
    const modal = document.getElementById('mediaModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    _current = null;
  }

  /* ─────────────────────────────────────────
     INJECT STYLES
  ───────────────────────────────────────── */
  function _injectStyles() {
    if (document.getElementById('modalStyles')) return;
    const style = document.createElement('style');
    style.id = 'modalStyles';
    style.textContent = `
      .media-modal {
        position: fixed;
        inset: 0;
        z-index: var(--z-modal);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-5);
        opacity: 0;
        visibility: hidden;
        transition: all var(--transition);
      }
      .media-modal.active {
        opacity: 1;
        visibility: visible;
      }
      .media-modal__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(6px);
      }
      .media-modal__box {
        position: relative;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        width: 100%;
        max-width: 860px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: var(--shadow-xl);
        animation: modal-in 0.3s var(--transition-spring);
        scrollbar-width: none;
      }
      .media-modal__box::-webkit-scrollbar { display: none; }
      .media-modal__hero {
        height: 280px;
        background: var(--bg-surface);
        border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        position: relative;
        overflow: hidden;
      }
      .media-modal__hero-grad {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, var(--bg-elevated) 0%, transparent 60%);
      }
      .media-modal__close {
        position: absolute;
        top: var(--space-4);
        right: var(--space-4);
        width: 36px;
        height: 36px;
        border-radius: var(--radius-full);
        background: rgba(0,0,0,0.6);
        border: 1px solid rgba(255,255,255,0.2);
        color: var(--text-primary);
        font-size: 16px;
        cursor: pointer;
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--transition-fast);
        z-index: 2;
      }
      .media-modal__close:hover {
        background: var(--accent);
        border-color: var(--accent);
      }
      .media-modal__body {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: var(--space-6);
        padding: var(--space-6);
        margin-top: -60px;
        position: relative;
        z-index: 1;
      }
      .media-modal__poster {
        width: 160px;
        aspect-ratio: 2/3;
        object-fit: cover;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        border: 2px solid var(--border);
      }
      .media-modal__right {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding-top: var(--space-10);
      }
      .media-modal__title {
        font-family: var(--font-display);
        font-size: var(--text-2xl);
        letter-spacing: 1px;
        color: var(--text-primary);
      }
      .media-modal__meta {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .modal-meta-chip {
        background: var(--bg-hover);
        border: 1px solid var(--border);
        border-radius: var(--radius-full);
        padding: 3px 10px;
        font-size: var(--text-xs);
        font-weight: var(--weight-semibold);
        color: var(--text-secondary);
      }
      .media-modal__overview {
        font-size: var(--text-sm);
        color: var(--text-secondary);
        line-height: var(--leading-relaxed);
      }
      .media-modal__genres {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .media-modal__actions {
        display: flex;
        gap: var(--space-3);
        flex-wrap: wrap;
        margin-top: var(--space-2);
      }
    `;
    document.head.appendChild(style);
  }

  /* Public API */
  return { open, close };

})();