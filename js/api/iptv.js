/* ═══════════════════════════════════════════════════════════
   MOBITV — IPTV MODULE
   Free live TV channels from iptv-org open source database.
   No API key needed — completely free.
   Source: https://github.com/iptv-org/iptv
═══════════════════════════════════════════════════════════ */

const IPTVModule = (() => {

  /* ── IPTV-org API endpoints ── */
  const API = {
    channels: 'https://iptv-org.github.io/api/channels.json',
    streams:  'https://iptv-org.github.io/api/streams.json',
    guides:   'https://iptv-org.github.io/api/guides.json',
  };

  /* ── Cache ── */
  let _channels = [];
  let _streams  = [];
  let _loaded   = false;

  /* ─────────────────────────────────────────
     LOAD ALL DATA
  ───────────────────────────────────────── */
  async function load() {
    if (_loaded) return;

    try {
      const [chRes, stRes] = await Promise.all([
        fetch(API.channels),
        fetch(API.streams),
      ]);

      _channels = await chRes.json();
      _streams  = await stRes.json();
      _loaded   = true;

      console.log(`[IPTV] Loaded ${_channels.length} channels, ${_streams.length} streams`);
    } catch (err) {
      console.error('[IPTV] Failed to load:', err);
    }
  }

  /* ─────────────────────────────────────────
     GET CHANNELS WITH STREAMS
     Merges channel info with stream URLs
  ───────────────────────────────────────── */
  function getChannelsWithStreams() {
    const streamMap = {};
    _streams.forEach(s => {
      if (!streamMap[s.channel]) streamMap[s.channel] = [];
      streamMap[s.channel].push(s);
    });

    return _channels
      .filter(ch => streamMap[ch.id]?.length > 0)
      .map(ch => ({
        id:       ch.id,
        name:     ch.name,
        logo:     ch.logo,
        country:  ch.country,
        language: ch.languages?.[0] || '',
        category: ch.categories?.[0] || 'general',
        website:  ch.website,
        streams:  streamMap[ch.id] || [],
        url:      streamMap[ch.id]?.[0]?.url || '',
      }));
  }

  /* ─────────────────────────────────────────
     GET BY CATEGORY
  ───────────────────────────────────────── */
  function getByCategory(category) {
    const all = getChannelsWithStreams();
    if (category === 'all') return all;
    return all.filter(ch =>
      ch.category?.toLowerCase().includes(category.toLowerCase())
    );
  }

  /* ─────────────────────────────────────────
     GET BY COUNTRY
  ───────────────────────────────────────── */
  function getByCountry(countryCode) {
    const all = getChannelsWithStreams();
    if (!countryCode || countryCode === 'all') return all;
    return all.filter(ch =>
      ch.country?.toLowerCase() === countryCode.toLowerCase()
    );
  }

  /* ─────────────────────────────────────────
     SEARCH CHANNELS
  ───────────────────────────────────────── */
  function search(query) {
    const q   = query.toLowerCase();
    const all = getChannelsWithStreams();
    return all.filter(ch =>
      ch.name?.toLowerCase().includes(q) ||
      ch.country?.toLowerCase().includes(q) ||
      ch.category?.toLowerCase().includes(q)
    );
  }

  /* ─────────────────────────────────────────
     GET FEATURED CHANNELS
     Hand-picked popular global channels
  ───────────────────────────────────────── */
  function getFeatured() {
    const featured = [
      'al-jazeera-english.qa',
      'bbc-world-news.gb',
      'cnn-international.us',
      'euronews-english.int',
      'france-24-english.fr',
      'dw-english.de',
      'rt-international.ru',
      'sky-news.gb',
      'fox-news.us',
      'nasa-tv.us',
      'bloomberg-television.us',
      'cnbc.us',
    ];

    const all     = getChannelsWithStreams();
    const results = [];

    featured.forEach(id => {
      const ch = all.find(c => c.id === id);
      if (ch) results.push(ch);
    });

    /* Fill remaining spots with popular channels */
    if (results.length < 12) {
      const extras = all
        .filter(ch => !featured.includes(ch.id))
        .slice(0, 12 - results.length);
      results.push(...extras);
    }

    return results;
  }

  /* ─────────────────────────────────────────
     GET CATEGORIES WITH COUNTS
  ───────────────────────────────────────── */
  function getCategories() {
    const all    = getChannelsWithStreams();
    const counts = {};

    all.forEach(ch => {
      const cat = ch.category || 'general';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  /* ─────────────────────────────────────────
     GET STREAM URL FOR CHANNEL
  ───────────────────────────────────────── */
  function getStreamUrl(channelId) {
    const ch = getChannelsWithStreams().find(c => c.id === channelId);
    return ch?.url || null;
  }

  /* Public API */
  return {
    load,
    getChannelsWithStreams,
    getByCategory,
    getByCountry,
    search,
    getFeatured,
    getCategories,
    getStreamUrl,
  };

})();