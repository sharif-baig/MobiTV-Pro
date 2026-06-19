/* ═══════════════════════════════════════════════════════════
   MOBITV — TOAST NOTIFICATION SYSTEM
   Lightweight toast notifications.
   Usage: showToast('Message here', 'success' | 'error' | 'warning' | 'info')
═══════════════════════════════════════════════════════════ */

const TOAST_ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || 'ℹ️'}</span>
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  /* Auto remove */
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}