import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useUIStore();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`
        p-2 rounded-lg transition-all duration-200
        ${isDark
                    ? 'bg-dark-card hover:bg-dark-border text-yellow-400 hover:text-yellow-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-slate-700 hover:text-slate-900'}
        border border-transparent hover:border-current
      `}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};
