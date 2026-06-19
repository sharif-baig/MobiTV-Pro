/* ═══════════════════════════════════════════════════════════
   MOBITV — AUTH MODULE
   Handles Firebase Authentication:
   - Email/Password login & register
   - Google Sign-In
   - Forgot password
   - Session persistence
   - Navbar UI sync (avatar, buttons)
   - Trial start on new registration

   SETUP REQUIRED:
   1. Add your Firebase config to js/config.js
   2. Go to Firebase Console → Authentication
      → Sign-in methods → Enable Email/Password + Google
   3. Go to Firebase Console → Firestore
      → Create database in test mode
═══════════════════════════════════════════════════════════ */

/* ── Firebase SDK (loaded via CDN in HTML) ──
   We load Firebase via CDN so no npm/build step needed.
   Scripts are injected dynamically below.
── */

const AuthModule = (() => {

  let _auth     = null;   // firebase.auth() instance
  let _db       = null;   // firebase.firestore() instance
  let _currentUser = null;

  /* ─────────────────────────────────────────
     LOAD FIREBASE SDK DYNAMICALLY
     Free — no npm, no bundler needed
  ───────────────────────────────────────── */
  function loadFirebaseSDK() {
    return new Promise((resolve) => {

      // Check if already loaded
      if (typeof firebase !== 'undefined') { resolve(); return; }

      const sdks = [
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
      ];

      let loaded = 0;
      sdks.forEach(src => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => { if (++loaded === sdks.length) resolve(); };
        document.head.appendChild(s);
      });
    });
  }

  /* ─────────────────────────────────────────
     INIT FIREBASE
  ───────────────────────────────────────── */
  async function init() {
    await loadFirebaseSDK();

    // Check if placeholder config — warn in console
    if (MobiConfig.firebase.apiKey === 'YOUR_FIREBASE_API_KEY') {
      console.warn('[MobiTv Auth] Firebase config not set. Running in demo mode. Add your keys to js/config.js');
      _runDemoMode();
      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(MobiConfig.firebase);
      }
      _auth = firebase.auth();
      _db   = firebase.firestore();

      // Persist session across tabs
      await _auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

      // Listen to auth state changes
      _auth.onAuthStateChanged(_onAuthStateChanged);

      console.log('[MobiTv Auth] Firebase initialized ✓');
    } catch (err) {
      console.error('[MobiTv Auth] Init failed:', err);
      _runDemoMode();
    }
  }

  /* ─────────────────────────────────────────
     AUTH STATE OBSERVER
     Fires on every page load + login/logout
  ───────────────────────────────────────── */
  async function _onAuthStateChanged(user) {
    _currentUser = user;

    if (user) {
      await _syncUserFromDB(user);
      _updateNavbarUI(user);
      TrialManager.init();
      /* Refresh navbar avatar name */
      if (typeof NavbarModule !== 'undefined') {
        NavbarModule._populateAvatarDropdown?.();
      }
    } else {
      _updateNavbarUI(null);
      _updateTrialFromLocalStorage();
    }
  }

  /* ─────────────────────────────────────────
     SYNC USER FROM FIRESTORE
  ───────────────────────────────────────── */
  async function _syncUserFromDB(user) {
    if (!_db) return;
    try {
      const docRef = _db.collection('users').doc(user.uid);
      const doc    = await docRef.get();

      if (doc.exists) {
        const data = doc.data();
        // Sync plan + trial to localStorage
        if (data.plan)      localStorage.setItem(MobiConfig.trial.planKey, data.plan);
        if (data.trialData) localStorage.setItem(MobiConfig.trial.storageKey, JSON.stringify(data.trialData));
      }
    } catch (err) {
      console.warn('[MobiTv Auth] Firestore sync failed:', err);
    }
  }

  /* ─────────────────────────────────────────
     REGISTER WITH EMAIL + PASSWORD
  ───────────────────────────────────────── */
  async function register() {
    const firstName = _val('regFirstName');
    const lastName  = _val('regLastName');
    const email     = _val('regEmail');
    const password  = _val('regPassword');
    const confirm   = _val('regPasswordConfirm');
    const agreed    = document.getElementById('agreeTerms')?.checked;

    // Validate
    if (!firstName) return _setError('regFirstNameError', 'First name is required');
    if (!lastName)  return _setError('regLastNameError',  'Last name is required');
    if (!_validEmail(email)) return _setError('regEmailError', 'Enter a valid email');
    if (password.length < 8) return _setError('regPasswordError', 'Password must be at least 8 characters');
    if (password !== confirm) return _setError('regPasswordConfirmError', 'Passwords do not match');
    if (!agreed) return _showToast('Please agree to the Terms of Service', 'warning');

    _setLoading('registerSubmitBtn', true);
    _clearErrors();

    try {
      let userCredential;
      let registeredUser;

      if (_auth) {
        // Real Firebase register
        userCredential = await _auth.createUserWithEmailAndPassword(email, password);
        registeredUser = userCredential.user;

        // Update display name
        try {
          await registeredUser.updateProfile({ displayName: `${firstName} ${lastName}` });
        } catch(e) { console.warn('Display name update failed:', e); }

        // Start trial in localStorage immediately
        const trialData = TrialManager.startTrial(registeredUser.uid);

        // Save to Firestore non-blocking — don't fail if this errors
        _saveUserToDB(registeredUser, { firstName, lastName, trialData, plan: 'trial' })
          .catch(e => console.warn('[MobiTv] Firestore save failed (non-critical):', e));

      } else {
        // Demo mode
        const fakeUser = { uid: 'demo_' + Date.now(), email, displayName: `${firstName} ${lastName}` };
        TrialManager.startTrial(fakeUser.uid);
        _currentUser = fakeUser;
        registeredUser = fakeUser;
        localStorage.setItem(MobiConfig.trial.userKey, JSON.stringify(fakeUser));
      }

      // Update navbar immediately
      _currentUser = registeredUser;
      _updateNavbarUI({ displayName: `${firstName} ${lastName}`, email });
      TrialManager.init();

      // Show success panel
      _showSuccessPanel();
      _showToast('Welcome to MobiTv! Your 7-day trial has started 🎉', 'success');

    } catch (err) {
      console.error('[MobiTv Auth] Register error:', err);
      _handleFirebaseError(err);
    } finally {
      _setLoading('registerSubmitBtn', false);
    }
  }

  /* ─────────────────────────────────────────
     LOGIN WITH EMAIL + PASSWORD
  ───────────────────────────────────────── */
  async function login() {
    const email    = _val('loginEmail');
    const password = _val('loginPassword');

    if (!_validEmail(email)) return _setError('loginEmailError', 'Enter a valid email');
    if (!password)           return _setError('loginPasswordError', 'Password is required');

    _setLoading('loginSubmitBtn', true);
    _clearErrors();

    try {
      if (_auth) {
        await _auth.signInWithEmailAndPassword(email, password);
      } else {
        // Demo mode
        const fakeUser = { uid: 'demo_user', email, displayName: email.split('@')[0] };
        _currentUser = fakeUser;
        localStorage.setItem(MobiConfig.trial.userKey, JSON.stringify(fakeUser));
        TrialManager.init();
        _updateNavbarUI(fakeUser);
      }

      _showToast('Welcome back! 👋', 'success');

      // Update navbar immediately
      _currentUser = _auth?.currentUser || _currentUser;
      _updateNavbarUI(_currentUser);
      TrialManager.init();

      // Redirect to home after short delay
      setTimeout(() => {
        const isSubPage = window.location.pathname.includes('/pages/');
        window.location.href = isSubPage ? '../index.html' : 'index.html';
      }, 1200);

    } catch (err) {
      console.error('[MobiTv Auth] Login error:', err);
      _handleFirebaseError(err);
    } finally {
      _setLoading('loginSubmitBtn', false);
    }
  }

  /* ─────────────────────────────────────────
     GOOGLE SIGN-IN
  ───────────────────────────────────────── */
  async function loginWithGoogle() {
    if (!_auth) {
      _showToast('Google Sign-In requires Firebase setup in config.js', 'info');
      return;
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result   = await _auth.signInWithPopup(provider);
      const user     = result.user;
      const isNew    = result.additionalUserInfo?.isNewUser;

      if (isNew) {
        const trialData = TrialManager.startTrial(user.uid);
        const [firstName, ...rest] = (user.displayName || 'User').split(' ');
        await _saveUserToDB(user, {
          firstName,
          lastName: rest.join(' '),
          trialData,
          plan: 'trial',
        });
        _showSuccessPanel();
        _showToast('Welcome to MobiTv! Your 7-day trial has started 🎉', 'success');
      } else {
        _showToast('Welcome back! 👋', 'success');
        setTimeout(() => { window.location.href = '../index.html'; }, 1200);
      }

    } catch (err) {
      console.error('[MobiTv Auth] Google login error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        _handleFirebaseError(err);
      }
    }
  }

  /* ─────────────────────────────────────────
     FORGOT PASSWORD
  ───────────────────────────────────────── */
  async function forgotPassword() {
    const email = _val('forgotEmail');
    if (!_validEmail(email)) return _setError('forgotEmailError', 'Enter a valid email');

    try {
      if (_auth) {
        await _auth.sendPasswordResetEmail(email);
      }
      _showToast('Password reset email sent! Check your inbox 📧', 'success');
      setTimeout(() => switchTab('login'), 2000);
    } catch (err) {
      _handleFirebaseError(err);
    }
  }

  /* ─────────────────────────────────────────
     LOGOUT
  ───────────────────────────────────────── */
  async function logout() {
    try {
      if (_auth) await _auth.signOut();
      TrialManager.clear();
      localStorage.removeItem(MobiConfig.trial.userKey);
      _currentUser = null;
      _updateNavbarUI(null);
      _showToast('Signed out successfully', 'info');
      setTimeout(() => { window.location.href = '/index.html'; }, 1000);
    } catch (err) {
      console.error('[MobiTv Auth] Logout error:', err);
    }
  }

  /* ─────────────────────────────────────────
     GET CURRENT USER
  ───────────────────────────────────────── */
  function getCurrentUser() {
    return _currentUser;
  }

  /* ─────────────────────────────────────────
     IS LOGGED IN
  ───────────────────────────────────────── */
  function isLoggedIn() {
    return !!_currentUser;
  }

  /* ─────────────────────────────────────────
     SAVE USER TO FIRESTORE
  ───────────────────────────────────────── */
  async function _saveUserToDB(user, extra = {}) {
    if (!_db) return;
    try {
      await _db.collection('users').doc(user.uid).set({
        uid:       user.uid,
        email:     user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        ...extra,
      }, { merge: true });
    } catch (err) {
      console.warn('[MobiTv Auth] Firestore save failed:', err);
    }
  }

  /* ─────────────────────────────────────────
     UPDATE NAVBAR UI
  ───────────────────────────────────────── */
  function _updateNavbarUI(user) {
    const authButtons = document.getElementById('navAuthButtons');
    const avatar      = document.getElementById('navAvatar');
    const notif       = document.getElementById('navNotif');

    if (user) {
      /* Hide sign in / sign up buttons */
      if (authButtons) {
        authButtons.style.display = 'none';
        authButtons.classList.add('hidden');
      }
      /* Show avatar with user initial */
      if (avatar) {
        avatar.style.display  = 'flex';
        avatar.classList.remove('hidden');
        const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
        avatar.textContent    = initial;
        avatar.title          = user.displayName || user.email || 'Profile';
      }
      if (notif) {
        notif.style.display = 'flex';
        notif.classList.remove('hidden');
      }
    } else {
      if (authButtons) {
        authButtons.style.display = '';
        authButtons.classList.remove('hidden');
      }
      if (avatar) {
        avatar.style.display = 'none';
        avatar.classList.add('hidden');
      }
      if (notif) {
        notif.style.display = 'none';
        notif.classList.add('hidden');
      }
    }
  }

  /* ─────────────────────────────────────────
     DEMO MODE (no Firebase config set)
  ───────────────────────────────────────── */
  function _runDemoMode() {
    console.log('[MobiTv Auth] Running in demo mode — localStorage only');

    // Check if demo user exists
    try {
      const raw  = localStorage.getItem(MobiConfig.trial.userKey);
      const user = raw ? JSON.parse(raw) : null;
      if (user) {
        _currentUser = user;
        _updateNavbarUI(user);
        TrialManager.init();
      }
    } catch {}

    // Wire Google buttons to demo message
    document.querySelectorAll('#googleLoginBtn, #googleRegisterBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        _showToast('Add your Firebase config in js/config.js to enable Google Sign-In', 'info');
      });
    });
  }

  /* ─────────────────────────────────────────
     TRIAL FROM LOCALSTORAGE (logged out users)
  ───────────────────────────────────────── */
  function _updateTrialFromLocalStorage() {
    const plan = TrialManager.getCurrentPlan();
    if (plan) TrialManager.init();
    else {
      // Hide trial banner for visitors
      const banner = document.getElementById('trialBanner');
      if (banner) banner.style.display = 'none';
      document.body.classList.remove('has-trial-banner');
    }
  }

  /* ─────────────────────────────────────────
     SHOW SUCCESS PANEL (after register)
  ───────────────────────────────────────── */
  function _showSuccessPanel() {
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    const success = document.getElementById('panelSuccess');
    if (success) success.classList.add('active');
  }

  /* ─────────────────────────────────────────
     FIREBASE ERROR HANDLER
  ───────────────────────────────────────── */
  function _handleFirebaseError(err) {
    const map = {
      'auth/email-already-in-use':    ['regEmailError',      'This email is already registered'],
      'auth/invalid-email':           ['loginEmailError',    'Invalid email address'],
      'auth/user-not-found':          ['loginEmailError',    'No account found with this email'],
      'auth/wrong-password':          ['loginPasswordError', 'Incorrect password'],
      'auth/too-many-requests':       [null,                 'Too many attempts. Please try again later'],
      'auth/network-request-failed':  [null,                 'Network error. Check your connection'],
      'auth/weak-password':           ['regPasswordError',   'Password is too weak'],
    };

    const [fieldId, msg] = map[err.code] || [null, 'Something went wrong. Please try again'];

    if (fieldId) _setError(fieldId, msg);
    else         _showToast(msg, 'error');
  }

  /* ─────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────── */
  function _val(id) {
    return document.getElementById(id)?.value?.trim() || '';
  }

  function _validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function _setError(fieldId, msg) {
    const el    = document.getElementById(fieldId);
    const input = el?.previousElementSibling?.querySelector('input')
                || document.getElementById(fieldId.replace('Error',''));
    if (el)    el.textContent = msg;
    if (input) input.classList.add('error');
    return false;
  }

  function _clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
  }

  function _setLoading(btnId, loading) {
    const btn    = document.getElementById(btnId);
    if (!btn) return;
    const text   = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    btn.disabled = loading;
    if (text)   text.classList.toggle('hidden', loading);
    if (loader) loader.classList.toggle('hidden', !loading);
  }

  function _showToast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type);
    else console.log(`[Toast][${type}] ${msg}`);
  }

  /* ─────────────────────────────────────────
     WIRE UP GOOGLE BUTTONS
  ───────────────────────────────────────── */
  function _wireGoogleButtons() {
    document.querySelectorAll('#googleLoginBtn, #googleRegisterBtn').forEach(btn => {
      btn.addEventListener('click', loginWithGoogle);
    });
  }

  /* ─────────────────────────────────────────
     OPEN AUTH MODAL (from other pages)
  ───────────────────────────────────────── */
  const AuthModal = {
    open(tab = 'login') {
      window.location.href = `pages/auth.html#${tab}`;
    },
  };

  /* ── AUTO INIT on DOM ready ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init(); _wireGoogleButtons(); });
  } else {
    init();
    _wireGoogleButtons();
  }

  /* Public API */
  return {
    init,
    login,
    register,
    loginWithGoogle,
    forgotPassword,
    logout,
    getCurrentUser,
    isLoggedIn,
  };

})();

/* Global openAuthModal used by index.html buttons */
function openAuthModal(tab) {
  window.location.href = `pages/auth.html#${tab}`;
}