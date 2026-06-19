/* ═══════════════════════════════════════════════════════════
   MOBITV — ROUTER MODULE
   Handles:
   - Category tab switching on home page
   - URL query param parsing
   - Page transition animations
   - Deep linking (e.g. live-tv.html?cat=sports)
   - Scroll position memory
   - 404 / redirect handling
═══════════════════════════════════════════════════════════ */

const Router = (() => {

  /* ── Route map: category tab → page URL ── */
  const ROUTES = {
    all:           'index.html',
    movies:        'pages/movies.html',
    series:        'pages/series.html',
    anime:         'pages/anime.html',
    cartoons:      'pages/cartoons.html',
    documentaries: 'pages/documentaries.html',
    live:          'pages/live-tv.html',
    games:         'pages/games.html',
    trending:      'pages/trending.html',
  };

  /* ─────────────────────────────────────────
     INIT
  ───────────────────────────────────────── */
  function init() {
    _initCategoryTabs();
    _initPageTransition();
    _initScrollMemory();
    _handleDeepLink();
  }

  /* ─────────────────────────────────────────
     CATEGORY TABS
     Clicking a tab on home navigates to
     the matching page
  ───────────────────────────────────────── */
  function _initCategoryTabs() {
    const tabs = document.querySelectorAll('.cat-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat  = tab.dataset.cat;
        const dest = ROUTES[cat];
        if (!dest) return;

        // "All" stays on home — just scroll to top
        if (cat === 'all') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          _setActiveTab(tab);
          return;
        }

        // Navigate with page transition
        _navigateTo(dest);
      });
    });

    // Highlight tab matching current page
    _syncTabToCurrentPage();
  }

  function _setActiveTab(activeTab) {
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    activeTab.classList.add('active');
  }

  function _syncTabToCurrentPage() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const map  = Object.entries(ROUTES);

    for (const [cat, route] of map) {
      const routePage = route.split('/').pop();
      if (routePage === page) {
        const tab = document.querySelector(`.cat-tab[data-cat="${cat}"]`);
        if (tab) _setActiveTab(tab);
        break;
      }
    }
  }

  /* ─────────────────────────────────────────
     NAVIGATE WITH TRANSITION
  ───────────────────────────────────────── */
  function _navigateTo(url) {
    const main = document.getElementById('mainContent');

    if (main) {
      // Fade out before navigating
      main.style.transition = 'opacity 0.2s ease';
      main.style.opacity    = '0';
      setTimeout(() => { window.location.href = url; }, 200);
    } else {
      window.location.href = url;
    }
  }

  /* ─────────────────────────────────────────
     PAGE TRANSITION (fade in on load)
  ───────────────────────────────────────── */
  function _initPageTransition() {
    const main = document.getElementById('mainContent');
    if (!main) return;

    // Already has page-enter class from HTML — just ensure it plays
    main.style.opacity = '1';
  }

  /* ─────────────────────────────────────────
     DEEP LINK HANDLER
     Reads URL params and activates the right
     sub-section on page load
     e.g. live-tv.html?cat=sports
  ───────────────────────────────────────── */
  function _handleDeepLink() {
    const params = getQueryParams();

    // Category filter (live TV, movies, etc.)
    if (params.cat) {
      _activateCategoryFilter(params.cat);
    }

    // Search query
    if (params.q) {
      const searchInput = document.getElementById('navSearchInput');
      if (searchInput) searchInput.value = decodeURIComponent(params.q);
    }

    // Mood filter (from mood picker on home)
    if (params.mood) {
      _activateMoodFilter(params.mood);
    }

    // Sort order
    if (params.sort) {
      _activateSortFilter(params.sort);
    }

    // Scroll to anchor
    if (window.location.hash) {
      setTimeout(() => {
        const el = document.querySelector(window.location.hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }

  function _activateCategoryFilter(cat) {
    // Activate matching filter chip/tab on category pages
    const chip = document.querySelector(`[data-cat="${cat}"], [data-category="${cat}"]`);
    if (chip) {
      chip.click();
    }
    // Store for use by page-specific JS modules
    window.MobiActiveCategory = cat;
  }

  function _activateMoodFilter(mood) {
    window.MobiActiveMood = mood;
    // Will be consumed by search.js in Step 15
  }

  function _activateSortFilter(sort) {
    window.MobiActiveSort = sort;
    // Will be consumed by mediaRow.js in Step 13
  }

  /* ─────────────────────────────────────────
     SCROLL MEMORY
     Remembers scroll position per page
     so browser back button feels natural
  ───────────────────────────────────────── */
  function _initScrollMemory() {
    const key = 'mobitv_scroll_' + window.location.pathname;

    // Restore scroll position
    const saved = sessionStorage.getItem(key);
    if (saved) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(saved), behavior: 'instant' });
      }, 100);
    }

    // Save scroll on page leave
    window.addEventListener('beforeunload', () => {
      sessionStorage.setItem(key, window.scrollY.toString());
    });
  }

  /* ─────────────────────────────────────────
     QUERY PARAM HELPERS
  ───────────────────────────────────────── */
  function getQueryParams() {
    const params = {};
    new URLSearchParams(window.location.search).forEach((val, key) => {
      params[key] = val;
    });
    return params;
  }

  function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  function setParam(key, value) {
    const url    = new URL(window.location.href);
    url.searchParams.set(key, value);
    history.replaceState({}, '', url.toString());
  }

  function removeParam(key) {
    const url = new URL(window.location.href);
    url.searchParams.delete(key);
    history.replaceState({}, '', url.toString());
  }

  /* ─────────────────────────────────────────
     IS SUBPAGE
     Returns true if we're inside /pages/
  ───────────────────────────────────────── */
  function isSubPage() {
    return window.location.pathname.includes('/pages/');
  }

  /* ─────────────────────────────────────────
     GET BASE PATH
     Returns '../' for subpages, '' for root
  ───────────────────────────────────────── */
  function getBasePath() {
    return isSubPage() ? '../' : '';
  }

  /* Public API */
  return {
    init,
    getQueryParams,
    getParam,
    setParam,
    removeParam,
    isSubPage,
    getBasePath,
  };

})();

/* ── Auto init ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Router.init);
} else {
  Router.init();
}