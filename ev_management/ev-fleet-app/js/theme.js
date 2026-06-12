// ===== FleetPulse — Theme Toggle =====
// Light is default. Preference persisted in localStorage.
// Applies before paint to prevent flash.

(function () {
  const KEY = 'fp_theme';

  // Apply immediately (before DOMContentLoaded) to avoid FOUC
  const saved = localStorage.getItem(KEY) || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  function syncButtons(theme) {
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.innerHTML = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
      btn.title = theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode';
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    syncButtons(theme);

    // Re-render active dashboard tab so chart colors update
    if (typeof renderCurrentTab === 'function') {
      const active = document.querySelector('.tab-pane.active');
      if (active) renderCurrentTab(active.id.replace('tab-', ''));
    }
  }

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  };

  window.getSavedTheme = () => localStorage.getItem(KEY) || 'light';

  // Sync button labels after DOM is ready
  document.addEventListener('DOMContentLoaded', () => syncButtons(saved));
})();
