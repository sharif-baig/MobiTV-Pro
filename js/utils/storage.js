/* ═══════════════════════════════════════════════════════════
   MOBITV — STORAGE MODULE
   Manages all localStorage data:
   - Watchlist (saved items)
   - Watch history
   - Continue watching (with progress %)
   - User preferences (language, region, theme)
   - Recently searched
═══════════════════════════════════════════════════════════ */

const StorageModule = (() => {

  /* ── Storage Keys ── */
  const KEYS = {
    watchlist:       'mobitv_watchlist',
    history:         'mobitv_history',
    continueWatch:   'mobitv_continue',
    preferences:     'mobitv_prefs',
    recentSearches:  'mobitv_searches',
    ratings:         'mobitv_ratings',
  };

  /* ── Max items per store ── */
  const LIMITS = {
    history:        100,
    continueWatch:  20,
    recentSearches: 10,
  };

  /* ─────────────────────────────────────────
     WATCHLIST
  ───────────────────────────────────────── */
  const Watchlist = {

    /* Get all watchlist items */
    getAll() {
      return Helpers.lsGet(KEYS.watchlist, []);
    },

    /* Add item to watchlist */
    add(item) {
      const list = this.getAll();
      const exists = list.find(i => i.id === item.id && i.type === item.type);
      if (exists) return false; // already in watchlist

      list.unshift({
        id:          item.id,
        type:        item.type,        // 'movie' | 'tv' | 'anime' | 'game' | 'channel'
        title:       item.title || item.name,
        poster:      item.poster_path || item.thumbnail || '',
        rating:      item.vote_average || 0,
        year:        Helpers.getYear(item.release_date || item.first_air_date),
        addedAt:     Date.now(),
      });

      Helpers.lsSet(KEYS.watchlist, list);
      return true;
    },

    /* Remove item from watchlist */
    remove(id, type) {
      const list = this.getAll().filter(i => !(i.id === id && i.type === type));
      Helpers.lsSet(KEYS.watchlist, list);
    },

    /* Check if item is in watchlist */
    has(id, type) {
      return this.getAll().some(i => i.id === id && i.type === type);
    },

    /* Toggle item in watchlist — returns true if added, false if removed */
    toggle(item) {
      if (this.has(item.id, item.type)) {
        this.remove(item.id, item.type);
        return false;
      } else {
        this.add(item);
        return true;
      }
    },

    /* Get count */
    count() {
      return this.getAll().length;
    },

    /* Clear watchlist */
    clear() {
      Helpers.lsRemove(KEYS.watchlist);
    },
  };

  /* ─────────────────────────────────────────
     WATCH HISTORY
  ───────────────────────────────────────── */
  const History = {

    /* Get all history items (most recent first) */
    getAll() {
      return Helpers.lsGet(KEYS.history, []);
    },

    /* Add/update item in history */
    add(item) {
      let list = this.getAll();

      // Remove existing entry for same item
      list = list.filter(i => !(i.id === item.id && i.type === item.type));

      // Add to front
      list.unshift({
        id:        item.id,
        type:      item.type,
        title:     item.title || item.name,
        poster:    item.poster_path || item.thumbnail || '',
        season:    item.season    || null,
        episode:   item.episode   || null,
        watchedAt: Date.now(),
      });

      // Trim to limit
      if (list.length > LIMITS.history) list = list.slice(0, LIMITS.history);

      Helpers.lsSet(KEYS.history, list);
    },

    /* Remove item from history */
    remove(id, type) {
      const list = this.getAll().filter(i => !(i.id === id && i.type === type));
      Helpers.lsSet(KEYS.history, list);
    },

    /* Clear all history */
    clear() {
      Helpers.lsRemove(KEYS.history);
    },
  };

  /* ─────────────────────────────────────────
     CONTINUE WATCHING
     Stores progress % for each item
  ───────────────────────────────────────── */
  const ContinueWatching = {

    /* Get all continue-watching items */
    getAll() {
      return Helpers.lsGet(KEYS.continueWatch, []);
    },

    /* Save or update progress */
    save(item, progressPercent) {
      let list = this.getAll();

      // Remove existing
      list = list.filter(i => !(i.id === item.id && i.type === item.type));

      // Only save if meaningful progress (> 5% and < 95%)
      if (progressPercent > 5 && progressPercent < 95) {
        list.unshift({
          id:         item.id,
          type:       item.type,
          title:      item.title || item.name,
          poster:     item.poster_path || item.backdrop_path || item.thumbnail || '',
          backdrop:   item.backdrop_path || '',
          rating:     item.vote_average || 0,
          year:       Helpers.getYear(item.release_date || item.first_air_date),
          season:     item.season  || null,
          episode:    item.episode || null,
          progress:   Math.round(progressPercent),
          updatedAt:  Date.now(),
        });

        // Trim to limit
        if (list.length > LIMITS.continueWatch) list = list.slice(0, LIMITS.continueWatch);
        Helpers.lsSet(KEYS.continueWatch, list);
      }

      // If > 95% complete, remove from continue watching
      if (progressPercent >= 95) {
        this.remove(item.id, item.type);
        History.add(item);
      }
    },

    /* Get progress for a specific item */
    getProgress(id, type) {
      const item = this.getAll().find(i => i.id === id && i.type === type);
      return item ? item.progress : 0;
    },

    /* Remove item */
    remove(id, type) {
      const list = this.getAll().filter(i => !(i.id === id && i.type === type));
      Helpers.lsSet(KEYS.continueWatch, list);
    },

    /* Check if item has progress */
    has(id, type) {
      return this.getAll().some(i => i.id === id && i.type === type);
    },

    /* Clear all */
    clear() {
      Helpers.lsRemove(KEYS.continueWatch);
    },
  };

  /* ─────────────────────────────────────────
     USER PREFERENCES
  ───────────────────────────────────────── */
  const Preferences = {

    defaults: {
      language:       'en',
      region:         'all',
      currency:       'USD',
      autoplay:       true,
      subtitles:      false,
      subtitleLang:   'en',
      adultContent:   false,
      notifications:  true,
    },

    /* Get all preferences */
    getAll() {
      return { ...this.defaults, ...Helpers.lsGet(KEYS.preferences, {}) };
    },

    /* Get a single preference */
    get(key) {
      return this.getAll()[key] ?? this.defaults[key];
    },

    /* Set a single preference */
    set(key, value) {
      const prefs  = this.getAll();
      prefs[key]   = value;
      Helpers.lsSet(KEYS.preferences, prefs);
    },

    /* Set multiple preferences at once */
    setMany(obj = {}) {
      const prefs = { ...this.getAll(), ...obj };
      Helpers.lsSet(KEYS.preferences, prefs);
    },

    /* Reset to defaults */
    reset() {
      Helpers.lsRemove(KEYS.preferences);
    },
  };

  /* ─────────────────────────────────────────
     RECENT SEARCHES
  ───────────────────────────────────────── */
  const RecentSearches = {

    getAll() {
      return Helpers.lsGet(KEYS.recentSearches, []);
    },

    add(query = '') {
      query = query.trim();
      if (!query) return;

      let list = this.getAll().filter(q => q.toLowerCase() !== query.toLowerCase());
      list.unshift(query);
      if (list.length > LIMITS.recentSearches) list = list.slice(0, LIMITS.recentSearches);
      Helpers.lsSet(KEYS.recentSearches, list);
    },

    remove(query) {
      const list = this.getAll().filter(q => q !== query);
      Helpers.lsSet(KEYS.recentSearches, list);
    },

    clear() {
      Helpers.lsRemove(KEYS.recentSearches);
    },
  };

  /* ─────────────────────────────────────────
     USER RATINGS
  ───────────────────────────────────────── */
  const UserRatings = {

    getAll() {
      return Helpers.lsGet(KEYS.ratings, {});
    },

    set(id, type, rating) {
      const ratings = this.getAll();
      ratings[`${type}_${id}`] = { rating, ratedAt: Date.now() };
      Helpers.lsSet(KEYS.ratings, ratings);
    },

    get(id, type) {
      return this.getAll()[`${type}_${id}`]?.rating || 0;
    },

    remove(id, type) {
      const ratings = this.getAll();
      delete ratings[`${type}_${id}`];
      Helpers.lsSet(KEYS.ratings, ratings);
    },
  };

  /* ─────────────────────────────────────────
     CLEAR ALL USER DATA (on logout)
  ───────────────────────────────────────── */
  function clearAll() {
    Object.values(KEYS).forEach(key => Helpers.lsRemove(key));
  }

  /* ─────────────────────────────────────────
     GET STORAGE STATS
  ───────────────────────────────────────── */
  function getStats() {
    return {
      watchlistCount:      Watchlist.count(),
      historyCount:        History.getAll().length,
      continueCount:       ContinueWatching.getAll().length,
      recentSearchCount:   RecentSearches.getAll().length,
    };
  }

  /* Public API */
  return {
    Watchlist,
    History,
    ContinueWatching,
    Preferences,
    RecentSearches,
    UserRatings,
    clearAll,
    getStats,
  };

})();