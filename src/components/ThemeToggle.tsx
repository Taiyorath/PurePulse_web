import React from 'react';
import { useTheme } from '../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

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
