# Alpha Hunter Crypto Workspace

A professional-grade, Solana-focused crypto trading and analysis platform that combines infinite canvas workspace management with real-time token discovery, risk analysis, and instant swap execution.

## Features

- 🌐 **Internationalization**: Full support for English and 简体中文
- 🎨 **Infinite Canvas**: Drag, resize, and arrange widgets freely
- 📊 **Discovery Widgets**: DexScreener, Birdeye, trending tokens, new pairs
- 🔍 **Analysis Tools**: Token overview, holder distribution, LP analysis, risk scoring
- ⚡ **Quick Execution**: Fast buy flow and Jupiter-powered swaps
- 📡 **Alpha Feeds**: Twitter, Telegram, and RSS integrations
- 🛠️ **Utilities**: Notes, checklists, block clock, PnL tracker
- ✏️ **Annotations**: Draw and annotate directly on your workspace
- 💼 **Wallet Integration**: Support for Phantom, Solflare, and Backpack

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS with dark theme and glassmorphism
- **State Management**: Zustand
- **Testing**: Vitest + React Testing Library + fast-check (property-based testing)
- **Blockchain**: Solana Web3.js + Wallet Adapter
- **Canvas**: Konva.js for annotations

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Solana wallet (Phantom, Solflare, or Backpack)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run unit tests only
npm run test:unit

# Run property-based tests only
npm run test:property

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/     # React components
├── stores/         # Zustand state management stores
├── widgets/        # Widget components
├── utils/          # Utility functions and helpers
├── locales/        # Translation files (en, zh-CN)
├── types/          # TypeScript type definitions
├── test/           # Test setup and utilities
├── App.tsx         # Main application component
├── main.tsx        # Application entry point
└── index.css       # Global styles
```

## Development

This project follows a test-driven development approach with both unit tests and property-based tests:

- **Unit Tests**: Test specific examples and edge cases
- **Property Tests**: Verify universal properties hold across all inputs

All tests are located alongside their source files with `.test.tsx` or `.properties.test.tsx` extensions.

## License

Private - All rights reserved
