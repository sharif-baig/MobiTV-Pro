/* ═══════════════════════════════════════════════════════════
   MOBITV — GAMES MODULE
   Retro ROM games via Archive.org built-in emulator.
   Cover images via RAWG API.
   Games open in maximized popup window.
═══════════════════════════════════════════════════════════ */

const GamesModule = (() => {

  const RAWG_KEY  = (typeof MobiConfig !== 'undefined' && MobiConfig.rawg?.apiKey !== 'YOUR_RAWG_API_KEY')
    ? MobiConfig.rawg.apiKey
    : '';

  const RAWG_BASE = 'https://api.rawg.io/api';
  const _coverCache = {};

  /* ─────────────────────────────────────────
     LOAD GAMES
  ───────────────────────────────────────── */
  async function loadGames() {
    try {
      const isSubPage = window.location.pathname.includes('/pages/');
      const base      = isSubPage ? '../' : '';
      const res       = await fetch(`${base}data/games.json`);
      const games     = await res.json();
      /* Fetch covers in background */
      _fetchAllCovers(games);
      return games;
    } catch (err) {
      console.error('[Games] Failed to load:', err);
      return [];
    }
  }

  /* ─────────────────────────────────────────
     FETCH ALL COVERS FROM RAWG
  ───────────────────────────────────────── */
  async function _fetchAllCovers(games) {
    for (const game of games) {
      await _fetchCover(game);
      /* Small delay to respect API rate limits */
      await new Promise(r => setTimeout(r, 150));
    }
  }

  async function _fetchCover(game) {
    if (_coverCache[game.id]) return _coverCache[game.id];

    try {
      const slug  = game.rawgSlug || game.title;
      const url   = `${RAWG_BASE}/games?key=${RAWG_KEY}&search=${encodeURIComponent(slug)}&page_size=1&search_exact=false`;
      const res   = await fetch(url);
      const data  = await res.json();
      const img   = data.results?.[0]?.background_image || null;

      if (img) {
        _coverCache[game.id] = img;
        _updateCardCover(game.id, img);
      }
      return img;
    } catch {
      return null;
    }
  }

  /* Update card cover image after RAWG responds */
  function _updateCardCover(gameId, imgUrl) {
    const card    = document.querySelector(`[data-game-id="${gameId}"]`);
    if (!card) return;

    const thumb   = card.querySelector('.game-card__thumb');
    const iconEl  = card.querySelector('.game-card__icon');
    if (!thumb) return;

    /* Insert cover image */
    const existing = thumb.querySelector('.game-card__cover');
    if (existing) {
      existing.src = imgUrl;
      existing.style.display = 'block';
    } else {
      const img = document.createElement('img');
      img.className   = 'game-card__cover';
      img.src         = imgUrl;
      img.alt         = gameId;
      img.style.display = 'block';
      img.onerror     = () => { img.style.display = 'none'; };
      thumb.insertBefore(img, thumb.firstChild);
    }

    /* Hide emoji icon when cover loads */
    if (iconEl) iconEl.style.opacity = '0';
  }

  /* ─────────────────────────────────────────
     OPEN GAME
     Opens Archive.org game page in popup
  ───────────────────────────────────────── */
  function openGame(id, url) {
    if (!url) return;

    const w     = screen.width;
    const h     = screen.height;
    const popup = window.open(
      url,
      'MobiTv_Game',
      `width=${w},height=${h},top=0,left=0,scrollbars=yes,toolbar=no,menubar=no,location=no`
    );

    if (!popup) {
      window.open(url, '_blank');
      if (typeof showToast === 'function') {
        showToast('Allow popups for the best gaming experience', 'info');
      }
    } else {
      if (typeof showToast === 'function') {
        showToast('🎮 Game opening... Use the emulator controls on Archive.org', 'info');
      }
    }
  }

  /* ─────────────────────────────────────────
     BUILD GAME CARD
  ───────────────────────────────────────── */
  function buildCard(game) {
    const cover = _coverCache[game.id] || '';
    return `
      <div class="game-card" data-game-id="${game.id}"
        onclick="GamesModule.openGame('${game.id}', '${game.url}')">
        <div class="game-card__thumb" style="background:${game.color}">
          ${cover
            ? `<img class="game-card__cover" src="${cover}" alt="${game.title}" />`
            : ''
          }
          <span class="game-card__icon" style="${cover ? 'opacity:0' : ''}">${game.icon}</span>
          <span class="game-card__system-badge">${game.system}</span>
          <div class="game-card__play-overlay">▶ Play</div>
        </div>
        <div class="game-card__info">
          <div class="game-card__title">${game.title}</div>
          <div class="game-card__meta">
            <span class="game-badge-sm">${game.genre}</span>
            <span class="game-badge-sm">${game.year}</span>
          </div>
        </div>
      </div>
    `;
  }

  /* Public API */
  return { loadGames, openGame, buildCard };

})();