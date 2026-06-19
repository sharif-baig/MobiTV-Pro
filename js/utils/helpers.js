/* ═══════════════════════════════════════════════════════════
   MOBITV — HELPERS
   Pure utility functions used across every module.
   No side effects, no DOM dependencies.
═══════════════════════════════════════════════════════════ */

const Helpers = {

  /* ─────────────────────────────────────────
     STRING HELPERS
  ───────────────────────────────────────── */

  /* Truncate text to maxLen with ellipsis */
  truncate(str = '', maxLen = 80) {
    return str.length > maxLen ? str.slice(0, maxLen).trimEnd() + '…' : str;
  },

  /* Capitalize first letter */
  capitalize(str = '') {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /* Convert a slug to title case: "sci-fi" → "Sci-Fi" */
  slugToTitle(slug = '') {
    return slug.split('-').map(w => this.capitalize(w)).join('-');
  },

  /* Strip HTML tags from a string */
  stripHtml(html = '') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  },

  /* ─────────────────────────────────────────
     NUMBER HELPERS
  ───────────────────────────────────────── */

  /* Format large numbers: 1200000 → "1.2M" */
  formatNumber(n = 0) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  },

  /* Format runtime minutes: 142 → "2h 22m" */
  formatRuntime(minutes = 0) {
    if (!minutes) return 'N/A';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  },

  /* Round rating to 1 decimal */
  formatRating(rating = 0) {
    return parseFloat(rating).toFixed(1);
  },

  /* Clamp a number between min and max */
  clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  },

  /* ─────────────────────────────────────────
     DATE HELPERS
  ───────────────────────────────────────── */

  /* Format ISO date: "2024-03-15" → "Mar 2024" */
  formatDate(dateStr = '') {
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  },

  /* Get year from ISO date string */
  getYear(dateStr = '') {
    if (!dateStr) return '';
    return new Date(dateStr).getFullYear().toString();
  },

  /* Time ago: "2 hours ago", "3 days ago" */
  timeAgo(dateStr = '') {
    const now   = Date.now();
    const then  = new Date(dateStr).getTime();
    const diff  = now - then;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);

    if (mins  < 1)   return 'Just now';
    if (mins  < 60)  return `${mins}m ago`;
    if (hours < 24)  return `${hours}h ago`;
    if (days  < 30)  return `${days}d ago`;
    return this.formatDate(dateStr);
  },

  /* Format YouTube duration: "PT1H23M45S" → "1:23:45" */
  formatYoutubeDuration(iso = '') {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    const h = parseInt(match[1] || 0);
    const m = parseInt(match[2] || 0);
    const s = parseInt(match[3] || 0);
    const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  },

  /* ─────────────────────────────────────────
     IMAGE HELPERS
  ───────────────────────────────────────── */

  /* Build TMDB image URL */
  tmdbImg(path = '', size = 'w342') {
    if (!path) return this.placeholderImg();
    return `${MobiConfig.tmdb.imgBase}${size}${path}`;
  },

  /* Generate a placeholder gradient image (no external request) */
  placeholderImg(title = '', index = 0) {
    const colors = [
      ['#1a1a2e', '#16213e'], ['#2d1b1b', '#4a1942'],
      ['#1b2d1b', '#1a3a2a'], ['#2d2a1b', '#3a3020'],
      ['#1b2535', '#0f2744'], ['#2b1b2d', '#3d1a4f'],
    ];
    const [c1, c2] = colors[index % colors.length];
    const letter   = (title || '?')[0]?.toUpperCase() || '?';

    // Returns an SVG data URI
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='${encodeURIComponent(c1)}'/%3E%3Cstop offset='1' stop-color='${encodeURIComponent(c2)}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='160' height='240' fill='url(%23g)'/%3E%3Ctext x='80' y='130' text-anchor='middle' fill='rgba(255,255,255,0.3)' font-size='64' font-family='sans-serif'%3E${letter}%3C/text%3E%3C/svg%3E`;
  },

  /* Handle broken image — replace with placeholder */
  onImgError(imgEl, title = '', index = 0) {
    imgEl.src = this.placeholderImg(title, index);
    imgEl.onerror = null; // prevent infinite loop
  },

  /* ─────────────────────────────────────────
     URL HELPERS
  ───────────────────────────────────────── */

  /* Build a watch page URL */
  watchUrl(type, id, season = null, episode = null) {
    const base = Router?.getBasePath() || '';
    let url = `${base}pages/watch.html?type=${type}&id=${id}`;
    if (season)  url += `&s=${season}`;
    if (episode) url += `&e=${episode}`;
    return url;
  },

  /* Build a media detail URL */
  detailUrl(type, id) {
    const base = Router?.getBasePath() || '';
    return `${base}pages/watch.html?type=${type}&id=${id}&view=info`;
  },

  /* ─────────────────────────────────────────
     DOM HELPERS
  ───────────────────────────────────────── */

  /* Safe querySelector — returns null instead of throwing */
  qs(selector, parent = document) {
    return parent.querySelector(selector);
  },

  /* Safe querySelectorAll — returns array */
  qsa(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  },

  /* Create element with classes and attributes */
  createElement(tag, classes = [], attrs = {}) {
    const el = document.createElement(tag);
    if (classes.length) el.className = classes.join(' ');
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  },

  /* Clear all children of an element */
  clearElement(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  },

  /* Show/hide element */
  show(el) { if (el) el.classList.remove('hidden'); },
  hide(el) { if (el) el.classList.add('hidden'); },

  /* Toggle element visibility */
  toggle(el, force) {
    if (el) el.classList.toggle('hidden', force !== undefined ? !force : undefined);
  },

  /* ─────────────────────────────────────────
     ASYNC HELPERS
  ───────────────────────────────────────── */

  /* Debounce a function */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /* Throttle a function */
  throttle(fn, limit = 200) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        fn(...args);
      }
    };
  },

  /* Sleep (await Helpers.sleep(500)) */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /* Retry a fetch up to N times */
  async retry(fn, times = 3, delay = 1000) {
    for (let i = 0; i < times; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === times - 1) throw err;
        await this.sleep(delay);
      }
    }
  },

  /* ─────────────────────────────────────────
     MEDIA HELPERS
  ───────────────────────────────────────── */

  /* Get rating color based on score */
  ratingColor(score = 0) {
    if (score >= 8) return '#2ecc71';
    if (score >= 7) return '#f39c12';
    if (score >= 5) return '#e67e22';
    return '#e74c3c';
  },

  /* Get rating label */
  ratingLabel(score = 0) {
    const entries = Object.entries(MobiConstants.ratings).sort((a, b) => b[0] - a[0]);
    for (const [min, data] of entries) {
      if (score >= min) return data.label;
    }
    return 'Poor';
  },

  /* Determine if content is new (released within 90 days) */
  isNewRelease(dateStr = '') {
    if (!dateStr) return false;
    const release = new Date(dateStr).getTime();
    const now     = Date.now();
    return (now - release) < 90 * 24 * 60 * 60 * 1000;
  },

  /* Get badge for media item */
  getMediaBadge(item = {}) {
    if (item.live)                          return { type: 'live',  text: 'LIVE' };
    if (this.isNewRelease(item.release_date || item.first_air_date))
                                            return { type: 'new',   text: 'NEW'  };
    if ((item.vote_average || 0) >= 8)      return { type: 'hot',   text: 'HOT'  };
    if ((item.popularity   || 0) >= 1000)   return { type: 'trend', text: 'TRENDING' };
    return null;
  },

  /* ─────────────────────────────────────────
     STORAGE HELPERS (lightweight wrappers)
  ───────────────────────────────────────── */

  lsGet(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },

  lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },

  lsRemove(key) {
    try { localStorage.removeItem(key); } catch {}
  },

};