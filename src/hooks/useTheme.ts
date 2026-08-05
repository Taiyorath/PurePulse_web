import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('pp_theme') as 'dark' | 'light') || 'dark'
  );
  const isLight = theme === 'light';

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('pp_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    document.body.setAttribute('data-theme', next);
    window.dispatchEvent(new CustomEvent('pp_theme_changed', { detail: { theme: next } }));
  };

  // listen for external changes (e.g., other tabs)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'pp_theme' && e.newValue) {
        setTheme(e.newValue as 'dark' | 'light');
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return { theme, isLight, toggleTheme };
};
