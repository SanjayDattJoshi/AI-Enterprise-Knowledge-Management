// Client: Centralized Theme Manager (Light / Dark / System)

export type ThemeMode = 'Light' | 'Dark' | 'System';

const THEME_KEY = 'aieks_theme_mode';

export const getStoredTheme = (): ThemeMode => {
  const stored = localStorage.getItem(THEME_KEY) as ThemeMode;
  if (stored === 'Light' || stored === 'Dark' || stored === 'System') {
    return stored;
  }
  return 'Light';
};

export const applyTheme = (mode: ThemeMode) => {
  localStorage.setItem(THEME_KEY, mode);
  const root = document.documentElement;

  if (mode === 'Dark') {
    root.classList.add('dark');
  } else if (mode === 'Light') {
    root.classList.remove('dark');
  } else if (mode === 'System') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

// Initialize theme immediately on script load
export const initTheme = () => {
  const current = getStoredTheme();
  applyTheme(current);
};
