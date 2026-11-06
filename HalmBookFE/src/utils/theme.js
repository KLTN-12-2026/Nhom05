export const THEME_KEYS = ['color-theme', 'halm-theme', 'halm_theme', 'theme'];

export function getSavedTheme() {
  if (typeof window === 'undefined') return 'light';
  for (const key of THEME_KEYS) {
    const val = localStorage.getItem(key);
    if (val === 'dark' || val === 'light') return val;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function isDarkMode() {
  return getSavedTheme() === 'dark';
}

export function applyTheme(isDark) {
  if (typeof window === 'undefined') return;
  const themeVal = isDark ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', isDark);
  THEME_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, themeVal);
    } catch {
      // Ignore localStorage exceptions in private mode
    }
  });
  window.dispatchEvent(new CustomEvent('halm-theme-change', { detail: { isDark } }));
}
