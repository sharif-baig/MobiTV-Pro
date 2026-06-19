/* ═══════════════════════════════════════════════════════════
   MOBITV — NAVBAR MODULE
   Handles:
   - Scroll behavior (transparent → solid)
   - Mobile hamburger menu
   - Active link detection
   - Search bar (focus, input, keyboard shortcut)
   - User avatar dropdown
   - Navbar search redirect
═══════════════════════════════════════════════════════════ */

const NavbarModule = (() => {

  /* ── Elements ── */
  let navbar, hamburger, mobileNav, searchInput;

  /* ─────────────────────────────────────────
     INIT
  ───────────────────────────────────────── */
  function init() {
    navbar      = document.getElementById('navbar');
    hamburger   = document.getElementById('hamburger');
    mobileNav   = document.getElementById('mobileNav');
    searchInput = document.getElementById('navSearchInput');

    if (!navbar) return; // not on a page with navbar

    _initScroll();
    _initMobileMenu();
    _initSearch();
    _initActiveLinks();
    _initAvatarDropdown();
    _initHamburgerAnimation();
  }

  /* ─────────────────────────────────────────
     SCROLL BEHAVIOR
     Navbar starts transparent over hero,
     becomes solid dark when user scrolls down
  ───────────────────────────────────────── */
  function _initScroll() {
    const onScroll = () => {
      if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    // Throttle scroll for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { onScroll(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });

    // Run once on load
    onScroll();
  }

  /* ─────────────────────────────────────────
     MOBILE HAMBURGER MENU
  ───────────────────────────────────────── */
  function _initMobileMenu() {
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileNav.classList.contains('open');
      _setMobileMenu(!isOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        _setMobileMenu(false);
      }
    });

    // Close on nav link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => _setMobileMenu(false));
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') _setMobileMenu(false);
    });
  }

  function _setMobileMenu(open) {
    if (!mobileNav || !hamburger) return;
    mobileNav.classList.toggle('open', open);
    hamburger.classList.toggle('open', open);
    // Prevent body scroll when mobile menu is open
    document.body.style.overflow = open ? 'hidden' : '';
  }

  /* ─────────────────────────────────────────
     HAMBURGER ANIMATION
  ───────────────────────────────────────── */
  function _initHamburgerAnimation() {
    if (!hamburger) return;

    // Add animation styles dynamically
    const style = document.createElement('style');
    style.textContent = `
      .navbar__hamburger.open span:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }
      .navbar__hamburger.open span:nth-child(2) {
        opacity: 0;
        transform: scaleX(0);
      }
      .navbar__hamburger.open span:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }
    `;
    document.head.appendChild(style);
  }

  /* ─────────────────────────────────────────
     SEARCH BAR
  ───────────────────────────────────────── */
  function _initSearch() {
    if (!searchInput) return;

    // Keyboard shortcut: S or / to focus
    document.addEventListener('keydown', (e) => {
      if (
        (e.key === 's' || e.key === '/') &&
        document.activeElement !== searchInput &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });

    // Submit search on Enter
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          const isSubPage = window.location.pathname.includes('/pages/');
          const base      = isSubPage ? '../' : '';
          window.location.href = `${base}pages/search.html?q=${encodeURIComponent(query)}`;
        }
      }

      // Escape = blur search
      if (e.key === 'Escape') {
        searchInput.blur();
        searchInput.value = '';
      }
    });

    // Expand on focus (handled via CSS, but add aria)
    searchInput.addEventListener('focus', () => {
      searchInput.setAttribute('aria-expanded', 'true');
    });

    searchInput.addEventListener('blur', () => {
      searchInput.setAttribute('aria-expanded', 'false');
    });
  }

  /* ─────────────────────────────────────────
     ACTIVE LINK DETECTION
     Highlights the current page's nav link
  ───────────────────────────────────────── */
  function _initActiveLinks() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';

    // Desktop nav links
    document.querySelectorAll('.navbar__links a, .navbar__mobile a').forEach(link => {
      const href     = link.getAttribute('href') || '';
      const linkPage = href.split('/').pop();

      link.classList.remove('active');

      if (
        (currentPage === 'index.html' && (href === 'index.html' || href === '../index.html' || href === '/')) ||
        (linkPage && linkPage !== 'index.html' && currentPage === linkPage)
      ) {
        link.classList.add('active');
      }
    });
  }

  /* ─────────────────────────────────────────
     AVATAR DROPDOWN
     Appears when user is logged in
  ───────────────────────────────────────── */
  function _initAvatarDropdown() {
    const avatar = document.getElementById('navAvatar');
    if (!avatar) return;

    // Create dropdown menu
    // Detect if on subpage
    const isSubPage = window.location.pathname.includes('/pages/');
    const base      = isSubPage ? '../' : '';

    const dropdown = document.createElement('div');
    dropdown.className = 'avatar-dropdown';
    dropdown.innerHTML = `
      <div class="avatar-dropdown__header">
        <div class="avatar-dropdown__name" id="avatarDropdownName">User</div>
        <div class="avatar-dropdown__plan" id="avatarDropdownPlan">Trial</div>
      </div>
      <div class="avatar-dropdown__divider"></div>
      <a href="${base}pages/auth.html#upgrade" class="avatar-dropdown__item avatar-dropdown__item--accent">⚡ Upgrade Plan</a>
      <div class="avatar-dropdown__divider"></div>
      <button class="avatar-dropdown__item avatar-dropdown__item--danger" onclick="AuthModule.logout()">
        🚪 Sign Out
      </button>
    `;

    // Inject dropdown styles
    _injectAvatarDropdownStyles();

    // Wrap avatar in a container
    const wrap = document.createElement('div');
    wrap.className = 'avatar-wrap';
    wrap.style.position = 'relative';
    avatar.parentNode.insertBefore(wrap, avatar);
    wrap.appendChild(avatar);
    wrap.appendChild(dropdown);

    // Toggle on click
    avatar.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    // Close on outside click
    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
    });

    // Populate user info
    _populateAvatarDropdown();
  }

  function _populateAvatarDropdown() {
    const nameEl = document.getElementById('avatarDropdownName');
    const planEl = document.getElementById('avatarDropdownPlan');

    if (nameEl && typeof AuthModule !== 'undefined') {
      const user = AuthModule.getCurrentUser();
      if (user) {
        nameEl.textContent = user.displayName || user.email || 'User';
      }
    }

    if (planEl && typeof TrialManager !== 'undefined') {
      const plan = TrialManager.getCurrentPlan();
      const days = TrialManager.getDaysRemaining();
      if (plan === 'trial' && days > 0) {
        planEl.textContent = `Trial — ${days} day${days !== 1 ? 's' : ''} left`;
        planEl.style.color = days <= 2 ? '#ff6b35' : '#2ecc71';
      } else if (plan === 'premium') {
        planEl.textContent = '👑 Premium';
        planEl.style.color = '#ffd700';
      } else if (plan === 'basic') {
        planEl.textContent = '⚡ Basic';
        planEl.style.color = '#3498db';
      } else {
        planEl.textContent = 'Free Tier';
        planEl.style.color = '#6b6b6b';
      }
    }
  }

  function _injectAvatarDropdownStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .avatar-dropdown {
        position: absolute;
        top: calc(100% + 12px);
        right: 0;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: var(--space-2) 0;
        min-width: 220px;
        box-shadow: var(--shadow-xl);
        z-index: var(--z-dropdown);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-8px);
        transition: all var(--transition);
        pointer-events: none;
      }
      .avatar-dropdown.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        pointer-events: all;
      }
      .avatar-dropdown__header {
        padding: var(--space-3) var(--space-5);
      }
      .avatar-dropdown__name {
        font-size: var(--text-sm);
        font-weight: var(--weight-bold);
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .avatar-dropdown__plan {
        font-size: var(--text-xs);
        color: var(--text-muted);
        margin-top: 3px;
        font-weight: var(--weight-semibold);
      }
      .avatar-dropdown__divider {
        height: 1px;
        background: var(--border);
        margin: var(--space-2) 0;
      }
      .avatar-dropdown__item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-5);
        font-size: var(--text-sm);
        color: var(--text-secondary);
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        font-family: var(--font-body);
        transition: all var(--transition-fast);
        text-decoration: none;
      }
      .avatar-dropdown__item:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }
      .avatar-dropdown__item--accent { color: var(--accent); }
      .avatar-dropdown__item--accent:hover { background: var(--accent-dim); }
      .avatar-dropdown__item--danger:hover { background: rgba(231,76,60,0.1); color: #e74c3c; }
    `;
    document.head.appendChild(style);
  }

  /* Public API */
  return { init, _populateAvatarDropdown };

})();

/* ── Auto init on DOM ready ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', NavbarModule.init);
} else {
  NavbarModule.init();
}