/* ═══════════════════════════════════════════════════════════
   MOBITV — CONSTANTS
   All static data: genres, regions, categories, languages,
   sort options, keyboard shortcuts, ad config, etc.
   Used by every module across the app.
═══════════════════════════════════════════════════════════ */

const MobiConstants = {

  /* ── TMDB GENRE IDs ── */
  genres: {
    movie: {
      action:      28,
      adventure:   12,
      animation:   16,
      comedy:      35,
      crime:       80,
      documentary: 99,
      drama:       18,
      fantasy:     14,
      horror:      27,
      romance:     10749,
      scifi:       878,
      thriller:    53,
      western:     37,
      mystery:     9648,
      music:       10402,
      history:     36,
      war:         10752,
      family:      10751,
    },
    tv: {
      action:      10759,
      animation:   16,
      comedy:      35,
      crime:       80,
      documentary: 99,
      drama:       18,
      fantasy:     10765,
      kids:        10762,
      mystery:     9648,
      news:        10763,
      reality:     10764,
      scifi:       10765,
      soap:        10766,
      talk:        10767,
      war:         10768,
      western:     37,
    },
  },

  /* ── MOOD → GENRE MAPPING ── */
  moods: {
    action:   { movieGenres: [28, 12],    tvGenres: [10759],      label: 'Action & Adventure' },
    comedy:   { movieGenres: [35],         tvGenres: [35],          label: 'Comedy' },
    romance:  { movieGenres: [10749, 18],  tvGenres: [18],          label: 'Romance & Drama' },
    thriller: { movieGenres: [53, 80],     tvGenres: [80, 9648],    label: 'Thriller & Crime' },
    scifi:    { movieGenres: [878, 14],    tvGenres: [10765],       label: 'Sci-Fi & Fantasy' },
    horror:   { movieGenres: [27, 53],     tvGenres: [27],          label: 'Horror' },
    drama:    { movieGenres: [18, 36],     tvGenres: [18],          label: 'Drama' },
    chill:    { movieGenres: [35, 10751],  tvGenres: [35, 10762],   label: 'Chill & Family' },
  },

  /* ── WORLD CINEMA REGIONS ── */
  regions: [
    { code: 'all', label: 'All Regions',  flag: '🌍' },
    { code: 'KR',  label: 'Korean',       flag: '🇰🇷' },
    { code: 'TR',  label: 'Turkish',      flag: '🇹🇷' },
    { code: 'IN',  label: 'Indian',       flag: '🇮🇳' },
    { code: 'JP',  label: 'Japanese',     flag: '🇯🇵' },
    { code: 'ES',  label: 'Spanish',      flag: '🇪🇸' },
    { code: 'DE',  label: 'German',       flag: '🇩🇪' },
    { code: 'AR',  label: 'Arabic',       flag: '🇸🇦' },
    { code: 'FR',  label: 'French',       flag: '🇫🇷' },
    { code: 'CN',  label: 'Chinese',      flag: '🇨🇳' },
    { code: 'IT',  label: 'Italian',      flag: '🇮🇹' },
    { code: 'MX',  label: 'Mexican',      flag: '🇲🇽' },
    { code: 'BR',  label: 'Brazilian',    flag: '🇧🇷' },
    { code: 'PK',  label: 'Pakistani',    flag: '🇵🇰' },
    { code: 'TH',  label: 'Thai',         flag: '🇹🇭' },
  ],

  /* ── LANGUAGES ── */
  languages: [
    { code: 'en', label: 'English'    },
    { code: 'ko', label: 'Korean'     },
    { code: 'tr', label: 'Turkish'    },
    { code: 'hi', label: 'Hindi'      },
    { code: 'ur', label: 'Urdu'       },
    { code: 'ja', label: 'Japanese'   },
    { code: 'es', label: 'Spanish'    },
    { code: 'de', label: 'German'     },
    { code: 'ar', label: 'Arabic'     },
    { code: 'fr', label: 'French'     },
    { code: 'zh', label: 'Chinese'    },
    { code: 'pt', label: 'Portuguese' },
    { code: 'it', label: 'Italian'    },
    { code: 'th', label: 'Thai'       },
  ],

  /* ── SORT OPTIONS ── */
  sortOptions: [
    { value: 'popularity.desc',     label: '🔥 Most Popular'   },
    { value: 'vote_average.desc',   label: '⭐ Top Rated'      },
    { value: 'release_date.desc',   label: '✨ Newest First'   },
    { value: 'release_date.asc',    label: '📅 Oldest First'   },
    { value: 'revenue.desc',        label: '💰 Highest Grossing'},
  ],

  /* ── CONTENT CATEGORIES ── */
  categories: [
    { id: 'movies',        label: 'Movies',        icon: '🎬', path: 'pages/movies.html'        },
    { id: 'series',        label: 'Series',        icon: '📺', path: 'pages/series.html'        },
    { id: 'anime',         label: 'Anime',         icon: '⛩️', path: 'pages/anime.html'         },
    { id: 'cartoons',      label: 'Cartoons',      icon: '🧸', path: 'pages/cartoons.html'      },
    { id: 'documentaries', label: 'Documentaries', icon: '🌍', path: 'pages/documentaries.html' },
    { id: 'live',          label: 'Live TV',       icon: '📡', path: 'pages/live-tv.html'       },
    { id: 'games',         label: 'Retro Games',   icon: '🎮', path: 'pages/games.html'         },
    { id: 'trending',      label: 'Trending',      icon: '▶',  path: 'pages/trending.html'      },
  ],

  /* ── LIVE TV CATEGORIES ── */
  liveCategories: [
    { id: 'all',           label: 'All Channels',   icon: '🌐' },
    { id: 'news',          label: 'News',           icon: '📰' },
    { id: 'sports',        label: 'Sports',         icon: '⚽' },
    { id: 'entertainment', label: 'Entertainment',  icon: '🎭' },
    { id: 'movies',        label: 'Movies',         icon: '🎬' },
    { id: 'kids',          label: 'Kids',           icon: '🧸' },
    { id: 'documentary',   label: 'Documentary',    icon: '🌍' },
    { id: 'music',         label: 'Music',          icon: '🎵' },
    { id: 'religious',     label: 'Religious',      icon: '🕌' },
    { id: 'cooking',       label: 'Cooking',        icon: '🍳' },
  ],

  /* ── RETRO GAME SYSTEMS ── */
  gameSystems: [
    { id: 'nes',   label: 'NES',         icon: '🕹️', core: 'fceumm'    },
    { id: 'snes',  label: 'Super NES',   icon: '🎮', core: 'snes9x'    },
    { id: 'gb',    label: 'Game Boy',    icon: '🎮', core: 'gambatte'  },
    { id: 'gba',   label: 'GBA',         icon: '🎮', core: 'mgba'      },
    { id: 'gbc',   label: 'Game Boy Color', icon: '🎮', core: 'gambatte'},
    { id: 'n64',   label: 'Nintendo 64', icon: '🕹️', core: 'mupen64plus'},
    { id: 'psx',   label: 'PlayStation', icon: '🎮', core: 'pcsx_rearmed'},
    { id: 'segaMD',label: 'Sega Genesis',icon: '🕹️', core: 'genesis_plus_gx'},
    { id: 'arcade',label: 'Arcade',      icon: '🕹️', core: 'mame2003'  },
  ],

  /* ── KEYBOARD SHORTCUTS ── */
  shortcuts: [
    { key: 'S',      description: 'Focus search bar'   },
    { key: '/',      description: 'Focus search bar'   },
    { key: 'Escape', description: 'Close modal / blur' },
    { key: 'F',      description: 'Toggle fullscreen (player)' },
    { key: 'M',      description: 'Mute / unmute (player)'     },
    { key: 'Space',  description: 'Play / pause (player)'      },
    { key: '←',      description: 'Seek back 10s (player)'     },
    { key: '→',      description: 'Seek forward 10s (player)'  },
  ],

  /* ── CURRENCY MAP ── */
  currencies: {
    USD: { symbol: '$',    name: 'US Dollar',        flag: '🇺🇸' },
    PKR: { symbol: '₨',   name: 'Pakistani Rupee',   flag: '🇵🇰' },
    GBP: { symbol: '£',    name: 'British Pound',     flag: '🇬🇧' },
    EUR: { symbol: '€',    name: 'Euro',              flag: '🇪🇺' },
    INR: { symbol: '₹',    name: 'Indian Rupee',      flag: '🇮🇳' },
    AED: { symbol: 'د.إ', name: 'UAE Dirham',         flag: '🇦🇪' },
    SAR: { symbol: '﷼',   name: 'Saudi Riyal',        flag: '🇸🇦' },
    TRY: { symbol: '₺',    name: 'Turkish Lira',      flag: '🇹🇷' },
  },

  /* ── GEO → CURRENCY MAP ── */
  geoCurrencyMap: {
    US: 'USD', PK: 'PKR', GB: 'GBP', IN: 'INR',
    DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
    AE: 'AED', SA: 'SAR', TR: 'TRY',
  },

  /* ── RATING LABELS ── */
  ratings: {
    9:  { label: 'Masterpiece',  color: '#2ecc71' },
    8:  { label: 'Excellent',    color: '#27ae60' },
    7:  { label: 'Great',        color: '#f39c12' },
    6:  { label: 'Good',         color: '#e67e22' },
    5:  { label: 'Average',      color: '#e74c3c' },
    0:  { label: 'Poor',         color: '#c0392b' },
  },

  /* ── SKELETON COUNT per row ── */
  skeletonCounts: {
    portrait:  7,
    landscape: 5,
    square:    6,
    channel:   8,
  },

  /* ── PAGINATION ── */
  pagination: {
    itemsPerPage: 20,
    maxPages:     10,
  },

  /* ── AD CONFIG (Free tier) ── */
  ads: {
    showBetweenRows: true,
    rowInterval:     3,       // show ad every 3 content rows
    bannerHeight:    90,      // px
  },

};

Object.freeze(MobiConstants);