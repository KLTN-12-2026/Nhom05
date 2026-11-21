export const THEME_KEYS = ['color-theme', 'halm-theme', 'halm_theme', 'theme'];

export function getSavedTheme() {
  return 'dark';
}

export function isDarkMode() {
  return true;
}

export function applyTheme() {
  if (typeof window === 'undefined') return;
  const isAdmin = window.location.pathname.startsWith('/admin');
  if (isAdmin) {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    return;
  }
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light');
  THEME_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, 'dark');
    } catch {
      // Ignore localStorage exceptions in private mode
    }
  });
  window.dispatchEvent(new CustomEvent('halm-theme-change', { detail: { isDark: true } }));
}
