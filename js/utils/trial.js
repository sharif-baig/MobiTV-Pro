/* ═══════════════════════════════════════════════════════════
   MOBITV — TRIAL MANAGER
   Handles 7-day trial start, countdown, expiry checks,
   soft block enforcement, and trial banner updates.
═══════════════════════════════════════════════════════════ */

const TrialManager = (() => {

  /* Safe config access — fallback to defaults if MobiConfig not loaded yet */
  const _cfg     = (typeof MobiConfig !== 'undefined') ? MobiConfig.trial : {};
  const KEY      = _cfg.storageKey  || 'mobitv_trial';
  const USER_KEY = _cfg.userKey     || 'mobitv_user';
  const PLAN_KEY = _cfg.planKey     || 'mobitv_plan';
  const DURATION = _cfg.durationDays || 7;

  /* ─────────────────────────────────────────
     START TRIAL
     Called when a new user registers.
     Stores trial start timestamp in localStorage
     AND syncs to Firestore via auth.js
  ───────────────────────────────────────── */
  function startTrial(userId) {
    const now       = Date.now();
    const expiresAt = now + DURATION * 24 * 60 * 60 * 1000;

    const trialData = {
      userId,
      startedAt:  now,
      expiresAt,
      plan:       'trial',
    };

    localStorage.setItem(KEY,      JSON.stringify(trialData));
    localStorage.setItem(PLAN_KEY, 'trial');

    console.log(`[MobiTv] Trial started for ${userId}. Expires: ${new Date(expiresAt).toLocaleDateString()}`);
    return trialData;
  }

  /* ─────────────────────────────────────────
     GET TRIAL DATA
  ───────────────────────────────────────── */
  function getTrialData() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /* ─────────────────────────────────────────
     GET DAYS REMAINING
     Returns: positive int if active, 0 if expired, -1 if no trial
  ───────────────────────────────────────── */
  function getDaysRemaining() {
    const data = getTrialData();
    if (!data) return -1;

    const now       = Date.now();
    const remaining = data.expiresAt - now;
    if (remaining <= 0) return 0;

    return Math.ceil(remaining / (1000 * 60 * 60 * 24));
  }

  /* ─────────────────────────────────────────
     IS TRIAL ACTIVE
  ───────────────────────────────────────── */
  function isTrialActive() {
    return getDaysRemaining() > 0;
  }

  /* ─────────────────────────────────────────
     IS TRIAL EXPIRED
  ───────────────────────────────────────── */
  function isTrialExpired() {
    const data = getTrialData();
    if (!data) return false;
    return getDaysRemaining() === 0;
  }

  /* ─────────────────────────────────────────
     GET CURRENT PLAN
     Returns: 'trial' | 'free' | 'basic' | 'premium' | null
  ───────────────────────────────────────── */
  function getCurrentPlan() {
    return localStorage.getItem(PLAN_KEY) || null;
  }

  /* ─────────────────────────────────────────
     CAN PLAY MEDIA
     Trial + paid plans = yes. Free = no (soft block)
  ───────────────────────────────────────── */
  function canPlayMedia() {
    const plan = getCurrentPlan();
    if (!plan) return true;           // No plan = visitor, allow freely
    if (plan === 'free') return false; // Expired trial = soft block
    if (plan === 'trial') return isTrialActive();
    if (plan === 'basic' || plan === 'premium') return true;
    return true;
  }

  /* ─────────────────────────────────────────
     SET PLAN (called after upgrade)
  ───────────────────────────────────────── */
  function setPlan(plan) {
    localStorage.setItem(PLAN_KEY, plan);
  }

  /* ─────────────────────────────────────────
     UPDATE TRIAL BANNER
     Injects countdown into the navbar trial banner
  ───────────────────────────────────────── */
  function updateTrialBanner() {
    const banner   = document.getElementById('trialBanner');
    const daysEl   = document.getElementById('trialDaysLeft');
    if (!banner) return;
    banner.style.display = 'flex'; /* ensure visible */

    const plan = getCurrentPlan();
    const days = getDaysRemaining();

    // No trial, no banner
    if (!plan || plan === 'basic' || plan === 'premium') {
      banner.style.display = 'none';
      document.body.classList.remove('has-trial-banner');
      return;
    }

    // Free tier — show upgrade nudge
    if (plan === 'free') {
      if (daysEl) daysEl.textContent = 'Free Tier';
      banner.style.display = 'flex';
      return;
    }

    // Active trial
    if (days > 0) {
      if (daysEl) daysEl.textContent = `${days} Day${days !== 1 ? 's' : ''} Left`;
      banner.style.display = 'flex';

      // Urgency color when ≤ 2 days left
      if (days <= 2 && daysEl) {
        daysEl.style.background = '#ff6b35';
      }
      return;
    }

    // Trial expired → switch to free plan silently
    if (days === 0) {
      setPlan('free');
      if (daysEl) daysEl.textContent = 'Trial Ended';
      banner.style.display = 'flex';
    }
  }

  /* ─────────────────────────────────────────
     ENFORCE SOFT BLOCK
     Call this before playing any media.
     Shows paywall overlay if user can't play.
  ───────────────────────────────────────── */
  function enforcePlayback(onAllowed) {
    if (canPlayMedia()) {
      if (typeof onAllowed === 'function') onAllowed();
    } else {
      // Show paywall overlay
      const overlay = document.getElementById('paywallOverlay');
      if (overlay) {
        overlay.classList.add('active');
      } else {
        // If not on home page, redirect to auth upgrade
        window.location.href = '/pages/auth.html#upgrade';
      }

      // Toast notification
      if (typeof showToast === 'function') {
        const plan = getCurrentPlan();
        const msg  = plan === 'free'
          ? '🔒 Upgrade to watch this content'
          : '🔒 Your trial has ended — upgrade to keep watching';
        showToast(msg, 'warning');
      }
    }
  }

  /* ─────────────────────────────────────────
     INIT
     Run on every page load to sync state
  ───────────────────────────────────────── */
  function init() {
    updateTrialBanner();

    // If trial just expired, switch to free
    if (isTrialExpired()) {
      setPlan('free');
      updateTrialBanner();
    }

    // Refresh banner every minute (for countdown accuracy)
    setInterval(updateTrialBanner, 60 * 1000);
  }

  /* ─────────────────────────────────────────
     CLEAR (logout / reset)
  ───────────────────────────────────────── */
  function clear() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(PLAN_KEY);
  }

  /* Public API */
  return {
    startTrial,
    getTrialData,
    getDaysRemaining,
    isTrialActive,
    isTrialExpired,
    getCurrentPlan,
    canPlayMedia,
    setPlan,
    enforcePlayback,
    updateTrialBanner,
    init,
    clear,
  };

})();