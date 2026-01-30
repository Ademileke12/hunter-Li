# TopBar Component

The TopBar is a fixed navigation bar that provides essential controls for the Alpha Hunter Crypto Workspace application.

## Overview

The TopBar component is a composite component that includes:
- **Logo and branding** - Application identity with gradient styling
- **LanguageToggle** - Switch between English and 简体中文
- **SearchBar** - Search for tokens by address or symbol
- **WalletButton** - Connect/disconnect Solana wallets

## Features

### Fixed Positioning
The TopBar remains fixed at the top of the viewport during canvas panning and zooming, ensuring essential controls are always accessible.

### Glassmorphism Styling
The TopBar uses a frosted glass effect with backdrop blur and semi-transparent background, creating a modern, professional appearance.

### Responsive Design
The component adapts to different screen sizes:
- On small screens, the app subtitle is hidden
- The search bar has a maximum width to prevent overflow
- All components maintain proper spacing and alignment

## Components

### TopBar
Main container component that orchestrates all sub-components.

**Props:**
- `onTokenSelect?: (tokenAddress: string) => void` - Callback when a token is selected from search

**Usage:**
```tsx
import { TopBar } from './components/TopBar';

function App() {
  const handleTokenSelect = (tokenAddress: string) => {
    // Initiate Fast Buy flow
    console.log('Selected token:', tokenAddress);
  };

  return (
    <div>
      <TopBar onTokenSelect={handleTokenSelect} />
      {/* Rest of your app */}
    </div>
  );
}
```

### LanguageToggle
Dropdown component for switching between supported languages.

**Features:**
- Displays current language
- Dropdown with all available languages
- Highlights currently selected language
- Persists selection to localStorage
- Closes on outside click

**Translation Keys:**
- `topbar.language_toggle` - Aria label for accessibility
- `language.en` - English language label
- `language.zh-CN` - Chinese language label

### SearchBar
Token search component with autocomplete functionality.

**Features:**
- Debounced search (300ms delay)
- Minimum 3 characters to trigger search
- Displays search results in dropdown
- Shows token symbol, name, and truncated address
- Loading indicator during search
- Keyboard support (Escape to close)
- Closes on outside click

**Props:**
- `onTokenSelect?: (tokenAddress: string) => void` - Callback when result is selected

**Translation Keys:**
- `topbar.search_placeholder` - Input placeholder text

**TODO:**
- Integrate with actual token search API (currently uses mock data)
- Add more sophisticated search filtering
- Add recent searches history

### WalletButton
Wallet connection component supporting multiple Solana wallet providers.

**Features:**
- Connect to Phantom, Solflare, or Backpack wallets
- Display wallet address when connected
- Show connection status indicator
- Disconnect functionality
- Loading state during connection
- Persists wallet provider preference

**Supported Wallets:**
- Phantom (👻)
- Solflare (🔥)
- Backpack (🎒)

**Translation Keys:**
- `topbar.wallet_connect` - Connect button text
- `topbar.wallet_disconnect` - Disconnect button text
- `topbar.wallet_connected` - Connected status label
- `common.loading` - Loading state text

## Styling

### Colors
- Background: `bg-dark-bg/80` - Semi-transparent dark background
- Border: `border-dark-border` - Subtle border at bottom
- Accent: `accent-blue` and `accent-purple` - Gradient effects

### Effects
- Backdrop blur: `backdrop-blur-md` - Glassmorphism effect
- Shadows: `shadow-glow-blue` - Neon glow on logo
- Transitions: Smooth hover and state transitions

### Layout
- Fixed positioning: `fixed top-0 left-0 right-0`
- Z-index: `z-50` - Stays above other content
- Flexbox layout with proper spacing
- Responsive padding and gaps

## Requirements Validation

This implementation satisfies the following requirements:

### Requirement 16.1
✅ System displays a top bar with logo, language toggle, wallet connect button, and search

### Requirement 16.2
✅ Language toggle displays current language and allows switching between English and 简体中文

### Requirement 16.3
✅ Wallet connect button displays connection status and wallet address when connected

### Requirement 16.4
✅ Search bar allows users to search for token addresses or symbols

### Requirement 16.7
✅ Top bar remains fixed at the top during canvas panning and zooming

## Testing

All components have comprehensive unit tests covering:
- Rendering and display
- User interactions (clicks, typing, keyboard)
- State management
- Dropdown behavior
- Outside click handling
- Translation integration
- Wallet store integration

Run tests:
```bash
npm test -- src/components/TopBar
```

## Integration

The TopBar is designed to work with:
- **I18nProvider** - For translation functionality
- **WalletStore** - For wallet state management
- **Fast Buy Flow** - Token selection triggers Fast Buy (to be implemented)

## Accessibility

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Proper focus management
- Color contrast compliance

## Future Enhancements

1. **Search Improvements**
   - Real API integration
   - Search history
   - Advanced filters
   - Token favorites

2. **Wallet Features**
   - Display wallet balance
   - Transaction history
   - Multi-wallet support
   - Wallet switching

3. **Notifications**
   - Toast notifications for actions
   - Connection status alerts
   - Error messages

4. **Customization**
   - Theme switching
   - Layout preferences
   - Keyboard shortcuts display
