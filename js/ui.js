/**
 * ui.js
 * DOM helpers: toast notifications, hint pill, shared UI state.
 */

const UI = (() => {
  let toastTimer = null;

  /** Show a brief toast message at the bottom of the screen */
  function toast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  /** Hide the long-press hint pill */
  function hideHint() {
    document.getElementById('hint')?.classList.add('hidden');
  }

  return { toast, hideHint };
})();
