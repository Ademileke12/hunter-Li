import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { LanguageToggle } from './LanguageToggle';
import { SearchBar } from './SearchBar';
import { WalletButton } from './WalletButton';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  onTokenSelect?: (tokenAddress: string) => void;
}

/**
 * TopBar Component
 * Fixed top navigation bar with logo, language toggle, search, and wallet button
 * Styled with glassmorphism effect
 */
export function TopBar({ onTokenSelect }: TopBarProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-glow-blue">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
            <p className="text-xs text-gray-500">{t('app.subtitle')}</p>
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar onTokenSelect={onTokenSelect} />

        {/* Right Side Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <ThemeToggle />
          <LanguageToggle />
          <WalletButton />
        </div>
      </div>
    </div>
  );
}
