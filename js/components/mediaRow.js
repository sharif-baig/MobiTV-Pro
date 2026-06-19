/* ═══════════════════════════════════════════════════════════
   MOBITV — MEDIA ROW COMPONENT
   Fetches data from TMDB and renders horizontal
   scrollable rows of media cards on the home page.
   Also handles the hero section population.
═══════════════════════════════════════════════════════════ */

const MediaRow = (() => {

  /* ─────────────────────────────────────────
     RENDER ROW
     Fills a container with media cards.
     Shows skeletons first, then replaces with real cards.
  ───────────────────────────────────────── */
  function render(containerId, items = [], cardType = 'portrait') {
    const container = document.getElementById(containerId);
    if (!container) return;

    /* Clear skeletons */
    Helpers.clearElement(container);

    if (!items.length) {
      container.innerHTML = `
        <div class="row-empty">
          <span>No content available right now</span>
        </div>`;
      return;
    }

    /* Build and append cards */
    items.forEach((item, i) => {
      let card;
      if (cardType === 'portrait')  card = MediaCard.buildPortrait(item, i);
      if (cardType === 'landscape') card = MediaCard.buildLandscape(item, i);
      if (cardType === 'channel')   card = MediaCard.buildChannel(item, i);
      if (cardType === 'game')      card = MediaCard.buildGame(item, i);
      if (card) container.appendChild(card);
    });
  }

  /* ─────────────────────────────────────────
     RENDER CONTINUE WATCHING ROW
  ───────────────────────────────────────── */
  function renderContinueWatching() {
    const section   = document.getElementById('continueWatchingSection');
    const container = document.getElementById('continueWatchingRow');
    if (!container) return;

    const items = typeof StorageModule !== 'undefined'
      ? StorageModule.ContinueWatching.getAll()
      : [];

    /* Hide section if nothing to continue */
    if (!items.length) {
      if (section) section.style.display = 'none';
      return;
    }

    if (section) section.style.display = 'block';
    render('continueWatchingRow', items, 'landscape');
  }

  /* ─────────────────────────────────────────
     LOAD ALL HOME PAGE ROWS
     Main function — called on home page load
  ───────────────────────────────────────── */
  async function loadHomeRows() {

    /* Continue watching first (from localStorage — instant) */
    renderContinueWatching();

    /* Check TMDB key */
    if (MobiConfig.tmdb.apiKey === 'YOUR_TMDB_API_KEY') {
      _showApiKeyWarning();
      return;
    }

    try {
      /* Fetch all rows in parallel */
      const data = await TMDB.loadHomePage();

      /* Trending */
      render('trendingRow', data.trending.slice(0, 10), 'portrait');

      /* New Releases */
      render('newReleasesRow', data.newReleases.slice(0, 10), 'portrait');

      /* Top Movies */
      render('topMoviesRow', data.topMovies.slice(0, 10), 'portrait');

      /* Top Series */
      render('topSeriesRow', data.topSeries.slice(0, 10), 'portrait');

      /* Anime */
      render('animeRow', data.anime.slice(0, 10), 'portrait');

      /* World Cinema — default to all regions mixed */
      const worldMixed = [
        ...data.worldKR.slice(0, 3),
        ...data.worldTR.slice(0, 3),
        ...data.worldIN.slice(0, 4),
      ];
      render('worldCinemaRow', worldMixed, 'portrait');

      /* Documentaries — landscape */
      render('docsRow', data.docs.slice(0, 8), 'landscape');

      /* Cartoons */
      render('cartoonsRow', data.cartoons.slice(0, 10), 'portrait');

      /* Populate Hero */
      if (typeof HeroModule !== 'undefined') {
        HeroModule.init(data.trending);
      }

    } catch (err) {
      console.error('[MediaRow] Failed to load home rows:', err);
      _showLoadError();
    }
  }

  /* ─────────────────────────────────────────
     WORLD CINEMA — REGION FILTER
     Called when user clicks a region pill
  ───────────────────────────────────────── */
  async function loadWorldCinemaRegion(regionCode) {
    const container = document.getElementById('worldCinemaRow');
    if (!container) return;

    /* Show skeletons */
    Helpers.clearElement(container);
    MediaCard.buildSkeletonRow(6, 'portrait').forEach(s => container.appendChild(s));

    try {
      let items;
      if (regionCode === 'all') {
        const [kr, tr, india] = await Promise.all([
          TMDB.Movies.byRegion('KR'),
          TMDB.Movies.byRegion('TR'),
          TMDB.Movies.byRegion('IN'),
        ]);
        items = [
          ...TMDB.Normalize.results(kr?.results || [], 'movie').slice(0, 3),
          ...TMDB.Normalize.results(tr?.results || [], 'movie').slice(0, 3),
          ...TMDB.Normalize.results(india?.results || [], 'movie').slice(0, 4),
        ];
      } else {
        const res = await TMDB.Movies.byRegion(regionCode);
        items     = TMDB.Normalize.results(res?.results || [], 'movie');
      }

      render('worldCinemaRow', items.slice(0, 10), 'portrait');
    } catch (err) {
      console.error('[MediaRow] Region filter failed:', err);
    }
  }

  /* ─────────────────────────────────────────
     LOAD GAMES ROW (from data/games.json)
  ───────────────────────────────────────── */
  async function loadGamesRow() {
    const container = document.getElementById('gamesRow');
    if (!container) return;

    try {
      const base = Router?.getBasePath() || '';
      const res  = await fetch(`${base}data/games.json`);
      const data = await res.json();
      render('gamesRow', data.slice(0, 8), 'game');
    } catch {
      Helpers.clearElement(container);
      container.innerHTML = `<div class="row-empty">Games loading soon</div>`;
    }
  }

  /* ─────────────────────────────────────────
     LOAD LIVE TV PREVIEW (from data/channels.json)
  ───────────────────────────────────────── */
  async function loadLiveChannelsPreview() {
    const container = document.getElementById('liveChannelsGrid');
    if (!container) return;

    try {
      const base = Router?.getBasePath() || '';
      const res  = await fetch(`${base}data/channels.json`);
      const data = await res.json();

      Helpers.clearElement(container);
      data.slice(0, 12).forEach((ch, i) => {
        const card = MediaCard.buildChannel(ch, i);
        if (card) container.appendChild(card);
      });
    } catch {
      Helpers.clearElement(container);
      container.innerHTML = `<div class="row-empty">Live TV loading soon</div>`;
    }
  }

  /* ─────────────────────────────────────────
     LOAD YOUTUBE TRENDING ROW
  ───────────────────────────────────────── */
  async function loadYoutubeTrendingRow() {
    const container = document.getElementById('youtubeTrendingRow');
    if (!container) return;

    if (MobiConfig.youtube.apiKey === 'YOUR_YOUTUBE_API_KEY') {
      Helpers.clearElement(container);
      container.innerHTML = `<div class="row-empty">Add YouTube API key in config.js</div>`;
      return;
    }

    try {
      /* YouTubeModule will be built in Step 9 */
      if (typeof YouTubeModule !== 'undefined') {
        const videos = await YouTubeModule.getTrending();
        render('youtubeTrendingRow', videos, 'landscape');
      }
    } catch (err) {
      console.error('[MediaRow] YouTube row failed:', err);
    }
  }

  /* ─────────────────────────────────────────
     ERROR / WARNING STATES
  ───────────────────────────────────────── */
  function _showApiKeyWarning() {
    const rows = [
      'trendingRow', 'newReleasesRow', 'topMoviesRow',
      'topSeriesRow', 'animeRow', 'worldCinemaRow',
      'docsRow', 'cartoonsRow',
    ];

    rows.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      Helpers.clearElement(el);
      el.innerHTML = `
        <div class="row-api-warning">
          <span>🔑</span>
          <span>Add your TMDB API key in <code>js/config.js</code> to see content here</span>
        </div>`;
    });
  }

  function _showLoadError() {
    const rows = ['trendingRow', 'newReleasesRow', 'topMoviesRow'];
    rows.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      Helpers.clearElement(el);
      el.innerHTML = `<div class="row-empty">Failed to load. Check your connection.</div>`;
    });
  }

  /* ─────────────────────────────────────────
     INIT — called on home page load
  ───────────────────────────────────────── */
  function init() {
    loadHomeRows();
    loadGamesRow();
    loadLiveChannelsPreview();
    loadYoutubeTrendingRow();

    /* Wire region pills */
    document.querySelectorAll('.region-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.region-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        loadWorldCinemaRegion(pill.dataset.region);
      });
    });
  }

  /* Public API */
  return {
    init,
    render,
    renderContinueWatching,
    loadHomeRows,
    loadWorldCinemaRegion,
    loadGamesRow,
    loadLiveChannelsPreview,
    loadYoutubeTrendingRow,
  };

})();

/* ── Auto init on home page ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', MediaRow.init);
} else {
  MediaRow.init();
}