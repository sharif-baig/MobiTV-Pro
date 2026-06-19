/* ═══════════════════════════════════════════════════════════
   MOBITV — APP CONFIG (EXAMPLE)
   Copy this file to js/config.js and fill in your own real
   API keys. config.js is gitignored and will not be committed.
═══════════════════════════════════════════════════════════ */

const MobiConfig = {

  app: {
    name:    'MobiTv',
    version: '1.0.0',
    url: 'https://celadon-basbousa-a58e9e.netlify.app',
  },

  /* ── FIREBASE ──────────────────────────────────────────
     1. Go to https://console.firebase.google.com
     2. Create a new project (free Spark plan)
     3. Add a Web App
     4. Enable Authentication → Email/Password + Google
     5. Enable Firestore Database (test mode to start)
     6. Copy your firebaseConfig object here
  ──────────────────────────────────────────────────────── */
  firebase: {
    apiKey:            "YOUR_FIREBASE_API_KEY",
    authDomain:        "YOUR_PROJECT.firebaseapp.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID",
  },

  /* ── TMDB API ───────────────────────────────────────────
     1. Go to https://www.themoviedb.org/signup
     2. Verify your email
     3. Settings → API → Request an API Key (free)
  ──────────────────────────────────────────────────────── */
  tmdb: {
    apiKey:  "YOUR_TMDB_API_KEY",
    baseUrl: "https://api.themoviedb.org/3",
    imgBase: "https://image.tmdb.org/t/p/",
    imgSizes: {
      poster:    "w342",
      backdrop:  "w1280",
      thumb:     "w185",
    },
  },

  /* ── YOUTUBE DATA API v3 ────────────────────────────────
     console.cloud.google.com → Enable YouTube Data API v3
     Free quota: 10,000 units/day
  ──────────────────────────────────────────────────────── */
  youtube: {
    apiKey:  "YOUR_YOUTUBE_API_KEY",
    baseUrl: "https://www.googleapis.com/youtube/v3",
  },

  /* ── VIDSRC (Free streaming embeds, no key needed) ── */
  vidsrc: {
    movie:    "https://vidsrc.to/embed/movie/",
    tv:       "https://vidsrc.to/embed/tv/",
    fallback: "https://vidsrc.me/embed/",
  },

  /* ── IPTV-ORG (Free live TV, no key needed) ── */
  iptv: {
    channelsUrl: "https://iptv-org.github.io/api/channels.json",
    streamsUrl:  "https://iptv-org.github.io/api/streams.json",
  },

  /* ── RAWG API (Game covers) ──────────────────────────────
     1. https://rawg.io/apidocs → Get API Key (free)
  ──────────────────────────────────────────────────────── */
  rawg: {
    apiKey:  "YOUR_RAWG_API_KEY",
    baseUrl: "https://api.rawg.io/api",
  },

  trial: {
    durationDays:  7,
    storageKey:    "mobitv_trial",
    userKey:       "mobitv_user",
    planKey:       "mobitv_plan",
  },

  plans: {
    free:    { name: "Free",    level: 0 },
    trial:   { name: "Trial",   level: 1 },
    basic:   { name: "Basic",   level: 2 },
    premium: { name: "Premium", level: 3 },
  },

};

Object.freeze(MobiConfig);