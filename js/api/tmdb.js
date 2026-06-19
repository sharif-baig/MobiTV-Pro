/* ═══════════════════════════════════════════════════════════
   MOBITV — TMDB API MODULE
   Fetches all movie, series, anime, cartoon, documentary
   metadata, posters, backdrops, cast, trailers from TMDB.

   SETUP:
   1. Register free at https://www.themoviedb.org/signup
   2. Settings → API → Request API Key (free, instant)
   3. Paste key into js/config.js → tmdb.apiKey
═══════════════════════════════════════════════════════════ */

const TMDB = (() => {

  /* ── Shorthand references ── */
  const BASE    = MobiConfig.tmdb.baseUrl;
  const KEY     = MobiConfig.tmdb.apiKey;
  const IMG     = MobiConfig.tmdb.imgBase;
  const SIZES   = MobiConfig.tmdb.imgSizes;

  /* ── In-memory cache to minimize API calls ── */
  const _cache  = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /* ─────────────────────────────────────────
     CORE FETCH
     All TMDB requests go through here.
     Handles caching, errors, and retries.
  ───────────────────────────────────────── */
  async function _fetch(endpoint, params = {}) {
    if (KEY === 'YOUR_TMDB_API_KEY') {
      console.warn('[TMDB] API key not set in js/config.js');
      return null;
    }

    const queryString = new URLSearchParams({ api_key: KEY, ...params }).toString();
    const url         = `${BASE}${endpoint}?${queryString}`;

    /* Check cache */
    const cached = _cache.get(url);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.data;
    }

    try {
      const res  = await Helpers.retry(() => fetch(url), 3, 1000);
      if (!res.ok) throw new Error(`TMDB ${res.status}: ${res.statusText}`);
      const data = await res.json();

      /* Store in cache */
      _cache.set(url, { data, ts: Date.now() });
      return data;

    } catch (err) {
      console.error(`[TMDB] Fetch failed: ${endpoint}`, err);
      return null;
    }
  }

  /* ─────────────────────────────────────────
     IMAGE HELPERS
  ───────────────────────────────────────── */
  function posterUrl(path, size = SIZES.poster) {
    return path ? `${IMG}${size}${path}` : null;
  }

  function backdropUrl(path, size = SIZES.backdrop) {
    return path ? `${IMG}${size}${path}` : null;
  }

  function thumbUrl(path) {
    return path ? `${IMG}${SIZES.thumb}${path}` : null;
  }

  /* ─────────────────────────────────────────
     MOVIES
  ───────────────────────────────────────── */
  const Movies = {

    /* Trending movies this week */
    async trending(page = 1) {
      return _fetch('/trending/movie/week', { page });
    },

    /* Now playing in theatres */
    async nowPlaying(page = 1) {
      return _fetch('/movie/now_playing', { page });
    },

    /* Popular movies */
    async popular(page = 1) {
      return _fetch('/movie/popular', { page });
    },

    /* Top rated movies */
    async topRated(page = 1) {
      return _fetch('/movie/top_rated', { page });
    },

    /* Upcoming movies */
    async upcoming(page = 1) {
      return _fetch('/movie/upcoming', { page });
    },

    /* Movies by genre */
    async byGenre(genreId, page = 1, sortBy = 'popularity.desc') {
      return _fetch('/discover/movie', {
        with_genres:  genreId,
        sort_by:      sortBy,
        page,
        'vote_count.gte': 50,
      });
    },

    /* Movies by region/language */
    async byRegion(regionCode, page = 1) {
      return _fetch('/discover/movie', {
        with_origin_country: regionCode,
        sort_by:             'popularity.desc',
        page,
        'vote_count.gte':    20,
      });
    },

    /* Search movies */
    async search(query, page = 1) {
      return _fetch('/search/movie', { query, page, include_adult: false });
    },

    /* Movie details + credits + videos */
    async details(movieId) {
      return _fetch(`/movie/${movieId}`, {
        append_to_response: 'credits,videos,similar,recommendations',
      });
    },

    /* Movie videos (trailers) */
    async videos(movieId) {
      return _fetch(`/movie/${movieId}/videos`);
    },
  };

  /* ─────────────────────────────────────────
     TV SERIES
  ───────────────────────────────────────── */
  const TV = {

    /* Trending TV this week */
    async trending(page = 1) {
      return _fetch('/trending/tv/week', { page });
    },

    /* Popular series */
    async popular(page = 1) {
      return _fetch('/tv/popular', { page });
    },

    /* Top rated series */
    async topRated(page = 1) {
      return _fetch('/tv/top_rated', { page });
    },

    /* Currently airing */
    async onAir(page = 1) {
      return _fetch('/tv/on_the_air', { page });
    },

    /* Series by genre */
    async byGenre(genreId, page = 1) {
      return _fetch('/discover/tv', {
        with_genres:  genreId,
        sort_by:      'popularity.desc',
        page,
        'vote_count.gte': 20,
      });
    },

    /* Series by region */
    async byRegion(regionCode, page = 1) {
      return _fetch('/discover/tv', {
        with_origin_country: regionCode,
        sort_by:             'popularity.desc',
        page,
      });
    },

    /* Search series */
    async search(query, page = 1) {
      return _fetch('/search/tv', { query, page, include_adult: false });
    },

    /* Full series details */
    async details(tvId) {
      return _fetch(`/tv/${tvId}`, {
        append_to_response: 'credits,videos,similar,recommendations',
      });
    },

    /* Season details */
    async season(tvId, seasonNumber) {
      return _fetch(`/tv/${tvId}/season/${seasonNumber}`);
    },

    /* Episode details */
    async episode(tvId, seasonNumber, episodeNumber) {
      return _fetch(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
    },
  };

  /* ─────────────────────────────────────────
     ANIME
     TMDB doesn't have a dedicated anime category.
     We use animation genre + Japanese origin.
  ───────────────────────────────────────── */
  const Anime = {

    async popular(page = 1) {
      return _fetch('/discover/tv', {
        with_genres:         16,      // Animation
        with_origin_country: 'JP',    // Japanese origin
        sort_by:             'popularity.desc',
        page,
        'vote_count.gte':    50,
      });
    },

    async topRated(page = 1) {
      return _fetch('/discover/tv', {
        with_genres:         16,
        with_origin_country: 'JP',
        sort_by:             'vote_average.desc',
        page,
        'vote_count.gte':    200,
      });
    },

    async trending(page = 1) {
      return _fetch('/trending/tv/week', { page,
        // Filter client-side for JP animation
      });
    },

    async search(query, page = 1) {
      return _fetch('/search/tv', {
        query,
        page,
        include_adult:       false,
      });
    },

    async byGenre(genreId, page = 1) {
      return _fetch('/discover/tv', {
        with_genres:         `16,${genreId}`,
        with_origin_country: 'JP',
        sort_by:             'popularity.desc',
        page,
      });
    },
  };

  /* ─────────────────────────────────────────
     CARTOONS
     Animation genre, non-Japanese origin
  ───────────────────────────────────────── */
  const Cartoons = {

    async popular(page = 1) {
      return _fetch('/discover/tv', {
        with_genres:  16,
        with_networks:'213,1024,2739', // Disney+, Netflix, Cartoon Network
        sort_by:      'popularity.desc',
        page,
      });
    },

    async kids(page = 1) {
      return _fetch('/discover/tv', {
        with_genres:  '16,10762',     // Animation + Kids
        sort_by:      'popularity.desc',
        page,
        'vote_count.gte': 20,
      });
    },

    async animatedMovies(page = 1) {
      return _fetch('/discover/movie', {
        with_genres:  16,
        sort_by:      'popularity.desc',
        page,
        'vote_count.gte': 100,
      });
    },

    async search(query, page = 1) {
      return _fetch('/search/multi', { query, page, include_adult: false });
    },
  };

  /* ─────────────────────────────────────────
     DOCUMENTARIES
  ───────────────────────────────────────── */
  const Documentaries = {

    async popular(page = 1) {
      return _fetch('/discover/movie', {
        with_genres:      99,
        sort_by:          'popularity.desc',
        page,
        'vote_count.gte': 20,
      });
    },

    async topRated(page = 1) {
      return _fetch('/discover/movie', {
        with_genres:      99,
        sort_by:          'vote_average.desc',
        page,
        'vote_count.gte': 50,
      });
    },

    async tvDocs(page = 1) {
      return _fetch('/discover/tv', {
        with_genres:  99,
        sort_by:      'popularity.desc',
        page,
      });
    },

    async nature(page = 1) {
      return _fetch('/search/tv', { query: 'planet earth nature documentary', page });
    },

    async search(query, page = 1) {
      return _fetch('/search/multi', { query: `${query} documentary`, page });
    },
  };

  /* ─────────────────────────────────────────
     SEARCH (multi — movies + TV together)
  ───────────────────────────────────────── */
  const Search = {

    async multi(query, page = 1) {
      return _fetch('/search/multi', { query, page, include_adult: false });
    },

    async movies(query, page = 1) {
      return Movies.search(query, page);
    },

    async tv(query, page = 1) {
      return TV.search(query, page);
    },

    async person(query, page = 1) {
      return _fetch('/search/person', { query, page });
    },
  };

  /* ─────────────────────────────────────────
     TRENDING (all media)
  ───────────────────────────────────────── */
  const Trending = {

    async all(timeWindow = 'week', page = 1) {
      return _fetch(`/trending/all/${timeWindow}`, { page });
    },

    async movies(timeWindow = 'week', page = 1) {
      return _fetch(`/trending/movie/${timeWindow}`, { page });
    },

    async tv(timeWindow = 'week', page = 1) {
      return _fetch(`/trending/tv/${timeWindow}`, { page });
    },
  };

  /* ─────────────────────────────────────────
     GENRES LIST (for filter dropdowns)
  ───────────────────────────────────────── */
  const Genres = {

    async movieGenres() {
      return _fetch('/genre/movie/list');
    },

    async tvGenres() {
      return _fetch('/genre/tv/list');
    },
  };

  /* ─────────────────────────────────────────
     DATA NORMALIZERS
     Converts TMDB responses into a consistent
     format used by mediaCard.js
  ───────────────────────────────────────── */
  const Normalize = {

    /* Normalize a single movie item */
    movie(item) {
      if (!item) return null;
      return {
        id:           item.id,
        type:         'movie',
        title:        item.title || item.original_title || 'Unknown',
        overview:     item.overview || '',
        poster:       posterUrl(item.poster_path),
        backdrop:     backdropUrl(item.backdrop_path),
        rating:       parseFloat(item.vote_average || 0).toFixed(1),
        votes:        item.vote_count || 0,
        year:         Helpers.getYear(item.release_date),
        releaseDate:  item.release_date || '',
        genres:       item.genre_ids || (item.genres?.map(g => g.id) || []),
        language:     item.original_language || 'en',
        popularity:   item.popularity || 0,
        adult:        item.adult || false,
      };
    },

    /* Normalize a single TV item */
    tv(item) {
      if (!item) return null;
      return {
        id:           item.id,
        type:         'tv',
        title:        item.name || item.original_name || 'Unknown',
        overview:     item.overview || '',
        poster:       posterUrl(item.poster_path),
        backdrop:     backdropUrl(item.backdrop_path),
        rating:       parseFloat(item.vote_average || 0).toFixed(1),
        votes:        item.vote_count || 0,
        year:         Helpers.getYear(item.first_air_date),
        releaseDate:  item.first_air_date || '',
        genres:       item.genre_ids || (item.genres?.map(g => g.id) || []),
        language:     item.original_language || 'en',
        popularity:   item.popularity || 0,
        seasons:      item.number_of_seasons || null,
        episodes:     item.number_of_episodes || null,
        status:       item.status || '',
      };
    },

    /* Auto-detect movie or TV and normalize */
    auto(item) {
      if (!item) return null;
      if (item.media_type === 'movie' || item.title) return this.movie(item);
      if (item.media_type === 'tv'    || item.name)  return this.tv(item);
      return null;
    },

    /* Normalize an array of results */
    results(items = [], type = 'auto') {
      return items
        .map(item => type === 'auto' ? this.auto(item) : this[type]?.(item))
        .filter(Boolean);
    },

    /* Normalize full movie details (with credits, videos) */
    details(item) {
      if (!item) return null;
      const base = item.title ? this.movie(item) : this.tv(item);
      return {
        ...base,
        tagline:    item.tagline || '',
        runtime:    item.runtime ? Helpers.formatRuntime(item.runtime) : null,
        budget:     item.budget  || 0,
        revenue:    item.revenue || 0,
        homepage:   item.homepage || '',
        imdbId:     item.imdb_id || '',
        genres:     item.genres?.map(g => g.name) || [],
        cast:       item.credits?.cast?.slice(0, 10).map(c => ({
          id:       c.id,
          name:     c.name,
          character:c.character,
          photo:    thumbUrl(c.profile_path),
        })) || [],
        trailer:    _extractTrailer(item.videos?.results || []),
        similar:    this.results(item.similar?.results || [], 'auto'),
        recommended:this.results(item.recommendations?.results || [], 'auto'),
        seasons:    item.seasons?.map(s => ({
          id:       s.id,
          number:   s.season_number,
          name:     s.name,
          episodes: s.episode_count,
          poster:   posterUrl(s.poster_path),
          airDate:  s.air_date,
        })) || [],
      };
    },
  };

  /* ─────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────── */
  function _extractTrailer(videos = []) {
    const trailer = videos.find(v =>
      v.site === 'YouTube' &&
      (v.type === 'Trailer' || v.type === 'Teaser') &&
      v.official
    ) || videos.find(v => v.site === 'YouTube');

    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
  }

  /* Clear cache (call on config change) */
  function clearCache() {
    _cache.clear();
  }

  /* ─────────────────────────────────────────
     HOME PAGE LOADER
     Fetches all home page rows in parallel
  ───────────────────────────────────────── */
  async function loadHomePage() {
    const [trending, newReleases, topMovies, topSeries, animeTop, worldKR, worldTR, worldIN, docs, cartoons] =
      await Promise.allSettled([
        Trending.all('week'),
        Movies.nowPlaying(),
        Movies.popular(),
        TV.popular(),
        Anime.popular(),
        Movies.byRegion('KR'),
        Movies.byRegion('TR'),
        Movies.byRegion('IN'),
        Documentaries.popular(),
        Cartoons.animatedMovies(),
      ]);

    return {
      trending:     Normalize.results(trending.value?.results || []),
      newReleases:  Normalize.results(newReleases.value?.results || [], 'movie'),
      topMovies:    Normalize.results(topMovies.value?.results || [], 'movie'),
      topSeries:    Normalize.results(topSeries.value?.results || [], 'tv'),
      anime:        Normalize.results(animeTop.value?.results || [], 'tv'),
      worldKR:      Normalize.results(worldKR.value?.results || [], 'movie'),
      worldTR:      Normalize.results(worldTR.value?.results || [], 'movie'),
      worldIN:      Normalize.results(worldIN.value?.results || [], 'movie'),
      docs:         Normalize.results(docs.value?.results || [], 'movie'),
      cartoons:     Normalize.results(cartoons.value?.results || [], 'movie'),
    };
  }

  /* Public API */
  return {
    Movies,
    TV,
    Anime,
    Cartoons,
    Documentaries,
    Search,
    Trending,
    Genres,
    Normalize,
    posterUrl,
    backdropUrl,
    thumbUrl,
    loadHomePage,
    clearCache,
  };

})();