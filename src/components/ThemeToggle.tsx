import React, { useState, useEffect } from 'react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('pp_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('pp_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.body.setAttribute('data-theme', nextTheme);
    window.dispatchEvent(new CustomEvent('pp_theme_changed', { detail: { theme: nextTheme } }));
  };

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      style={{
        padding: '6px 12px',
        borderRadius: 20,
        background: theme === 'dark' ? '#111827' : '#f1f5f9',
        border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #cbd5e1',
        color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease-in-out',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
};

export default ThemeToggle;
