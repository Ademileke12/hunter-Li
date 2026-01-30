# Implementation Plan: Alpha Hunter Crypto Workspace

## Overview

This implementation plan breaks down the Alpha Hunter Crypto Workspace into incremental, testable steps. The approach follows a layered architecture: foundation (i18n, state management) → core canvas system → widget framework → individual widgets → integration features. Each major component includes property-based tests to validate correctness properties from the design document.

The implementation uses React, TypeScript, TailwindCSS, Zustand for state management, and fast-check for property-based testing.

## Tasks

- [x] 1. Project Setup and Foundation
  - Initialize React + TypeScript + Vite project
  - Configure TailwindCSS with dark theme and custom colors (neon blue, purple)
  - Set up Zustand for state management
  - Configure Vitest and React Testing Library
  - Install fast-check for property-based testing
  - Set up project structure: /components, /stores, /widgets, /utils, /locales, /types
  - Configure path aliases in tsconfig.json
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 2. Internationalization System
  - [x] 2.1 Create translation infrastructure
    - Create translation JSON files: /locales/en/common.json, /locales/zh-CN/common.json
    - Implement TranslationService with loadTranslations, t(), setLanguage methods
    - Create I18nProvider React context component
    - Implement localStorage persistence for language preference (key: app_language)
    - Create useTranslation hook for components
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x]* 2.2 Write property test for language persistence round-trip
    - **Property 1: Language Preference Persistence Round-Trip**
    - **Validates: Requirements 1.3, 1.4**

  - [x]* 2.3 Write property test for language switch completeness
    - **Property 9: Language Switch Completeness**
    - **Validates: Requirements 1.2**

  - [x]* 2.4 Write unit test for translation key fallback
    - Test missing translation key displays key identifier
    - _Requirements: 1.7_

- [x] 3. State Management Stores
  - [x] 3.1 Create Canvas Store
    - Implement CanvasStore with Zustand: widgets[], viewport, zoom, pan, annotations[]
    - Implement actions: addWidget, removeWidget, updateWidget, duplicateWidget
    - Implement actions: setZoom, setPan, addAnnotation, removeAnnotation
    - Implement saveWorkspace and loadWorkspace with localStorage
    - Use key format: workspace_{language}
    - _Requirements: 2.9, 2.10, 17.2_

  - [x] 3.2 Create Wallet Store
    - Implement WalletStore: connected, publicKey, provider, balance
    - Implement actions: connect, disconnect, signTransaction
    - Integrate @solana/wallet-adapter-react
    - Persist wallet provider to localStorage (key: app_wallet_provider)
    - _Requirements: 12.1, 12.2, 12.8, 12.9_

  - [x] 3.3 Create UI Store
    - Implement UIStore: toolLibraryCollapsed, annotationMode, selectedTool
    - Implement actions: toggleToolLibrary, setAnnotationMode, setSelectedTool
    - Persist toolLibraryCollapsed to localStorage
    - _Requirements: 3.7_

  - [x]* 3.4 Write property tests for workspace persistence
    - **Property 5: Workspace Persistence Round-Trip**
    - **Validates: Requirements 2.9, 2.10**

  - [x]* 3.5 Write property test for wallet state sharing
    - **Property 29: Wallet State Sharing**
    - **Validates: Requirements 12.6**

- [-] 4. Core Canvas System
  - [x] 4.1 Implement InfiniteCanvas component
    - Create canvas viewport with pan and zoom controls
    - Implement mouse drag for panning (middle button or space + drag)
    - Implement mouse wheel zoom (ctrl + wheel)
    - Implement keyboard navigation (arrow keys for pan)
    - Apply CSS transforms for smooth rendering
    - _Requirements: 2.2, 2.3_

  - [x] 4.2 Implement WidgetContainer component
    - Create draggable container with title bar
    - Implement drag by title bar using react-draggable or custom hook
    - Implement resize handles using react-resizable or custom hook
    - Add close, refresh, duplicate buttons to title bar
    - Enforce minimum size constraints per widget type
    - Apply glassmorphism styling and shadows
    - _Requirements: 4.1, 4.2, 4.6, 4.7, 4.8_

  - [x]* 4.3 Write property tests for canvas operations
    - **Property 2: Widget Position Updates**
    - **Property 3: Widget Size Updates**
    - **Property 4: Widget Deletion**
    - **Validates: Requirements 2.5, 2.6, 2.8, 4.6, 4.7, 4.8**

  - [x]* 4.4 Write property test for canvas panning and zooming
    - **Property 6: Canvas Panning**
    - **Property 7: Canvas Zooming**
    - **Validates: Requirements 2.2, 2.3**

  - [x]* 4.5 Write property test for widget overlap
    - **Property 8: Widget Overlap Allowance**
    - **Validates: Requirements 2.7**

- [-] 5. Widget Registry and Dynamic Loading
  - [x] 5.1 Create widget registry system
    - Define WidgetDefinition interface with type, category, icon, label, component, sizes
    - Create widgetRegistry map with all widget types
    - Implement getWidgetDefinition(type) utility
    - Create widget categories: discovery, analysis, execution, alpha, utilities
    - _Requirements: 3.2_

  - [x] 5.2 Implement dynamic widget loading
    - Create DynamicWidget component that loads widget by type
    - Use React.lazy for code splitting per widget
    - Implement loading state with skeleton loader
    - Wrap each widget in ErrorBoundary
    - _Requirements: 4.10, 19.3_

  - [x]* 5.3 Write property test for widget addition
    - **Property 11: Widget Addition**
    - **Validates: Requirements 2.4, 3.4**

  - [x]* 5.4 Write property test for widget duplication
    - **Property 13: Widget Duplication**
    - **Validates: Requirements 4.5**

- [-] 6. Tool Library Sidebar
  - [x] 6.1 Implement ToolLibrary component
    - Create collapsible sidebar with category sections
    - Display widget icons and translated labels
    - Implement collapse/expand toggle
    - Add click handler to add widget to canvas
    - Style with dark theme and smooth transitions
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6_

  - [x]* 6.2 Write property test for tool library state persistence
    - **Property 15: Tool Library State Persistence**
    - **Validates: Requirements 3.7**

  - [x]* 6.3 Write unit tests for tool library UI states
    - Test collapsed state shows only icons
    - Test expanded state shows labels
    - _Requirements: 3.5, 3.6_

- [-] 7. Top Bar Navigation
  - [x] 7.1 Implement TopBar component
    - Create fixed top bar with logo, language toggle, search, wallet button
    - Implement LanguageToggle component with dropdown
    - Implement SearchBar component with token search
    - Implement WalletButton component showing connection status
    - Style with glassmorphism and proper spacing
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.7_

  - [x]* 7.2 Write property test for top bar persistence
    - **Property 39: Top Bar Persistence**
    - **Validates: Requirements 16.7**

- [x] 8. Checkpoint - Core System Complete
  - Ensure all tests pass, ask the user if questions arise.

- [-] 9. Data Layer - API Clients
  - [x] 9.1 Implement Birdeye API client
    - Create BirdeyeClient class with methods: getTokenOverview, getHolderDistribution, getNewPairs, getTrendingTokens
    - Use fetch with error handling and retry logic
    - Implement exponential backoff for failed requests
    - Base URL: https://public-api.birdeye.so
    - _Requirements: 5.3, 6.1, 6.2, 6.3_

  - [x] 9.2 Implement Solana RPC client
    - Create SolanaClient wrapper around @solana/web3.js Connection
    - Implement fallback RPC endpoints (primary, fallback1, fallback2)
    - Methods: getConnection, getTokenAccountsByOwner, getCurrentSlot
    - _Requirements: 7.9, 9.6, 19.4_

  - [x] 9.3 Implement Jupiter SDK integration
    - Create JupiterClient wrapper around @jup-ag/core
    - Implement getQuote and executeSwap methods
    - Handle quote calculation and transaction building
    - _Requirements: 7.6, 7.7, 7.8_

  - [x]* 9.4 Write property test for RPC fallback
    - **Property 37: RPC Fallback**
    - **Validates: Requirements 19.4**

  - [x]* 9.5 Write unit tests for API error handling
    - Test timeout handling
    - Test rate limiting
    - Test network errors
    - _Requirements: 19.1_

- [-] 10. Discovery Widgets
  - [x] 10.1 Implement DexScreener widget
    - Create iframe embed with token address parameter
    - URL format: https://dexscreener.com/solana/{address}
    - Implement iframe sandbox security
    - Handle load errors with fallback UI
    - _Requirements: 5.1_

  - [x] 10.2 Implement Birdeye widget
    - Fetch token data from Birdeye API
    - Display price, volume, market cap
    - Implement auto-refresh every 30 seconds
    - Show skeleton loader during fetch
    - _Requirements: 5.3, 5.9_

  - [x] 10.3 Implement New Pairs widget
    - Fetch from Birdeye /defi/v3/pairs/new endpoint
    - Display table: symbol, age, liquidity, volume
    - Highlight tokens < 24h old with blue badge
    - Implement pagination
    - _Requirements: 5.4, 5.5_

  - [x] 10.4 Implement Trending Tokens widget
    - Fetch from Birdeye /defi/v3/tokens/trending endpoint
    - Calculate volume spike percentage
    - Highlight tokens with >100% spike
    - Display sparkline charts using recharts
    - _Requirements: 5.6, 5.7_

  - [x]* 10.5 Write property test for new token highlighting
    - **Property 16: New Token Highlighting**
    - **Validates: Requirements 5.5, 13.1**

  - [x]* 10.6 Write property test for volume spike detection
    - **Property 17: Volume Spike Detection**
    - **Validates: Requirements 5.7, 13.2**

- [-] 11. Analysis Widgets
  - [x] 11.1 Implement Token Overview widget
    - Input field for token address
    - Fetch from Birdeye /defi/v3/token/overview
    - Display: name, symbol, supply, price, market cap, volume
    - Show token logo if available
    - _Requirements: 6.1_

  - [x] 11.2 Implement Holder Distribution widget
    - Fetch from Birdeye /defi/v3/token/holder
    - Display pie chart of top 10 holders using recharts
    - Show percentage for each holder
    - Calculate and display concentration metric
    - _Requirements: 6.2_

  - [x] 11.3 Implement LP Overview widget
    - Fetch liquidity pool data from Birdeye
    - Display: LP locked %, LP value, providers count
    - Show warning if LP < 50%
    - Display lock duration if available
    - _Requirements: 6.3_

  - [x] 11.4 Implement Risk Flags widget
    - Calculate risk score using formula from design
    - Categorize into Low/Medium/High/Critical
    - Display specific flags: Low LP, High Concentration, Deployer Active
    - Color code by severity: green, yellow, orange, red
    - _Requirements: 6.5, 14.1, 14.2, 14.3, 14.4, 14.5, 14.7_

  - [x]* 11.5 Write property test for risk score calculation
    - **Property 19: Risk Score Calculation**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4**

  - [x]* 11.6 Write property test for risk level categorization
    - **Property 20: Risk Level Categorization**
    - **Validates: Requirements 14.5**

  - [x]* 11.7 Write property test for risk flag generation
    - **Property 21: Risk Flag Generation**
    - **Validates: Requirements 14.7**

- [-] 12. Execution Widgets
  - [x] 12.1 Implement Swap widget
    - Create input/output token selectors with search
    - Implement amount input field
    - Add Quick Buy buttons: 0.1, 0.5, 1, 5, 10 SOL
    - Add slippage selector: 0.5%, 1%, 2%, custom
    - Display quote: expected output, price impact, minimum received
    - Implement swap button with wallet integration
    - Show transaction status indicator
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.10, 7.11_

  - [x]* 12.2 Write property test for quick buy amount population
    - **Property 22: Quick Buy Amount Population**
    - **Validates: Requirements 7.4**

  - [x]* 12.3 Write property test for swap quote consistency
    - **Property 23: Swap Quote Consistency**
    - **Validates: Requirements 7.6, 7.7**

  - [x]* 12.4 Write unit tests for swap error handling
    - Test insufficient balance
    - Test user rejection
    - Test transaction failure
    - _Requirements: 19.2_

- [x] 13. Checkpoint - Widgets Phase 1 Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Alpha Feed Widgets
  - [x] 14.1 Implement Twitter Embed widget
    - Configuration input for username or tweet URL
    - Use Twitter embed API: https://publish.twitter.com/oembed
    - Display embedded tweet in iframe
    - Handle embed failures gracefully
    - _Requirements: 8.1_

  - [x] 14.2 Implement Telegram Channel widget
    - Configuration input for public channel username
    - Use Telegram Widget API for read-only display
    - Display recent 20 messages
    - Show timestamp and sender
    - Auto-refresh every 60 seconds
    - _Requirements: 8.2_

  - [x] 14.3 Implement RSS Feed widget
    - Configuration input for RSS feed URL
    - Parse RSS XML using DOMParser
    - Display: title, description, link, publish date
    - Limit to 10 most recent items
    - Implement click to open in new tab
    - _Requirements: 8.3, 8.7_

- [ ] 15. Utility Widgets
  - [x] 15.1 Implement Notes widget
    - Integrate TipTap or Slate rich text editor
    - Support: bold, italic, lists, links
    - Auto-save to localStorage on change (debounced 500ms)
    - Persist per widget instance ID
    - _Requirements: 9.1, 9.5_

  - [x] 15.2 Implement Checklist widget
    - List of checkbox items
    - Add new item with Enter key
    - Delete item with delete button
    - Implement drag-and-drop reordering
    - Persist to localStorage
    - _Requirements: 9.2, 9.5_

  - [x] 15.3 Implement Block Clock widget
    - Fetch current slot from Solana RPC: getSlot()
    - Calculate estimated time: slot * 400ms
    - Display: current slot, estimated time, epoch
    - Update every 400ms
    - _Requirements: 9.3, 9.6_

  - [x] 15.4 Implement PnL Tracker widget
    - Table with columns: token, entry price, exit price, amount, PnL
    - Add entry button opens modal form
    - Calculate PnL: (exit_price - entry_price) * amount
    - Display total PnL at bottom
    - Persist entries to localStorage
    - _Requirements: 9.4, 9.7, 9.8_

  - [ ]* 15.5 Write property test for notes persistence
    - **Property 40: Notes Persistence**
    - **Validates: Requirements 9.1, 9.5**

  - [ ]* 15.6 Write property test for PnL calculation accuracy
    - **Property 41: PnL Calculation Accuracy**
    - **Validates: Requirements 9.7, 9.8**

  - [ ]* 15.7 Write property test for block clock updates
    - **Property 42: Block Clock Real-Time Updates**
    - **Validates: Requirements 9.6**

- [x] 16. Annotation Layer
  - [x] 16.1 Implement annotation system
    - Integrate Konva.js or Fabric.js for canvas drawing
    - Implement drawing tools: pencil, arrow, highlight, text
    - Create tool selector UI
    - Implement annotation data model
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 16.2 Implement annotation persistence
    - Serialize annotations to JSON
    - Store in localStorage with key: workspace_annotations_{language}
    - Deserialize on load and render to canvas
    - Implement visibility toggle
    - Implement delete and clear all functions
    - _Requirements: 10.5, 10.6, 10.8, 10.9_

  - [x]* 16.3 Write property test for annotation persistence
    - **Property 24: Annotation Persistence**
    - **Validates: Requirements 10.6**

  - [x]* 16.4 Write property test for annotation language agnostic
    - **Property 25: Annotation Language Agnostic**
    - **Validates: Requirements 10.7**

  - [x]* 16.5 Write property test for annotation visibility toggle
    - **Property 26: Annotation Visibility Toggle**
    - **Validates: Requirements 10.5**

- [x] 17. Fast Buy Flow
  - [x] 17.1 Implement Fast Buy orchestration
    - Create fastBuyFlow function that takes token address
    - Add chart widget (DexScreener) with token address
    - Add token overview widget with token address
    - Add swap widget with output token set
    - Calculate optimal layout positions
    - Animate widgets into position (300ms ease-out)
    - Focus swap widget amount input
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 17.2 Integrate Fast Buy with search
    - Connect SearchBar to Fast Buy flow
    - Trigger Fast Buy on search result selection
    - _Requirements: 16.5, 16.6_

  - [ ]* 17.3 Write property test for Fast Buy widget creation
    - **Property 27: Fast Buy Widget Creation**
    - **Validates: Requirements 11.1, 11.2, 11.3**

  - [ ]* 17.4 Write property test for Fast Buy widget configuration
    - **Property 28: Fast Buy Widget Configuration**
    - **Validates: Requirements 11.5**

  - [ ]* 17.5 Write property test for token search to Fast Buy
    - **Property 38: Token Search to Fast Buy**
    - **Validates: Requirements 16.6**

- [x] 18. Checkpoint - Integration Features Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Performance Optimizations
  - [x] 19.1 Implement code splitting and lazy loading
    - Add React.lazy for all widget components
    - Lazy load translation files
    - Lazy load heavy libraries (charting, drawing)
    - _Requirements: 18.8_

  - [x] 19.2 Implement caching and optimization
    - Set up React Query (TanStack Query) for API caching
    - Configure cache durations: 30s market data, 5min static data
    - Implement request deduplication
    - Debounce canvas updates (16ms)
    - Throttle API calls
    - _Requirements: 18.4, 18.5, 18.6_

  - [x] 19.3 Implement rendering optimizations
    - Add React.memo to widget components
    - Use useMemo for expensive calculations (risk scores)
    - Use useCallback for event handlers
    - Implement virtual scrolling for long lists
    - _Requirements: 18.7_

- [-] 20. Error Handling and Edge Cases
  - [x] 20.1 Implement comprehensive error handling
    - Add error boundaries for widgets
    - Implement API error handling with retry
    - Add wallet error handling
    - Implement storage error handling
    - Add user-friendly error messages
    - _Requirements: 19.1, 19.2, 19.3, 19.5, 19.6, 19.7_

  - [ ]* 20.2 Write property test for API failure graceful degradation
    - **Property 35: API Failure Graceful Degradation**
    - **Validates: Requirements 19.1, 19.3**

  - [ ]* 20.3 Write property test for storage error recovery
    - **Property 34: Storage Error Recovery**
    - **Validates: Requirements 17.7**

  - [ ]* 20.4 Write unit tests for wallet errors
    - Test wallet not installed
    - Test user rejection
    - Test insufficient balance
    - _Requirements: 19.2_

- [x] 21. UI Polish and Accessibility
  - [x] 21.1 Implement UI enhancements
    - Add smooth transitions to all interactive elements
    - Implement hover animations
    - Add skeleton loaders for loading states
    - Apply glassmorphism effects
    - Ensure consistent spacing and alignment
    - _Requirements: 15.4, 15.5, 15.6, 15.7, 15.9, 15.10_

  - [x] 21.2 Implement accessibility features
    - Add keyboard shortcuts for common actions
    - Add tooltips to all interactive elements
    - Use semantic HTML elements
    - Ensure color contrast ratios
    - Add ARIA labels where needed
    - _Requirements: 20.1, 20.2, 20.4, 20.5, 20.6_

  - [ ]* 21.3 Write unit tests for keyboard shortcuts
    - Test arrow keys for canvas pan
    - Test Del key for widget deletion
    - Test Ctrl+Z for undo
    - _Requirements: 20.1_

- [ ] 22. Final Integration and Testing
  - [ ] 22.1 Implement multi-language workspace isolation
    - Verify workspace saves per language
    - Test language switching loads correct workspace
    - _Requirements: 17.2_

  - [ ]* 22.2 Write property test for multi-language workspace isolation
    - **Property 32: Multi-Language Workspace Isolation**
    - **Validates: Requirements 2.9, 17.2**

  - [ ]* 22.3 Write property test for widget state isolation
    - **Property 33: Widget State Isolation**
    - **Validates: Requirements 17.1**

  - [ ] 22.4 End-to-end integration testing
    - Test complete Fast Buy flow
    - Test workspace save/load across language switch
    - Test wallet connection and swap execution
    - Test annotation persistence
    - _Requirements: All_

- [ ] 23. Final Checkpoint - Production Ready
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all 42 correctness properties are tested
  - Run full test suite with 100+ iterations per property test
  - Check code coverage meets 80% target

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation at major milestones
- The implementation follows a bottom-up approach: foundation → core → widgets → integration
- All widgets are implemented with error boundaries for isolation
- Performance optimizations are applied after core functionality is complete
