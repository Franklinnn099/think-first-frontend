# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ClearCart** is a cross-platform e-commerce monorepo with two implemented sub-projects:
- `mobile-app/` — React Native (Expo)
- `browser-extension/` — Chrome/Firefox Extension (React + Vite + CRXJS)

A web app (`src/`) is planned but not yet implemented. The backend is currently mocked with `json-server`. When the real backend is ready, update `constants/config.ts` (mobile) or `.env` (extension) with the real `API_BASE_URL`.

## Commands

### Mobile App (`mobile-app/`)
```bash
npm start                    # Start Expo dev server
npm run android              # Run on Android emulator
npm run ios                  # Run on iOS simulator
npm run dummy                # Start mock backend (json-server on port 3001)
npm test                     # Run Jest tests
```

### Browser Extension (`browser-extension/`)
```bash
npm run dev                  # Watch mode (Vite)
npm run build                # Build for Chrome (MV3)
npm run build:firefox        # Build for Firefox
npm run pack                 # Build and zip for distribution
npm test                     # Run Jest tests
```

## Architecture

### Mobile App

**Routing**: File-based via Expo Router (similar to Next.js)
- `app/(auth)/` — Login, register, forgot-password screens
- `app/(tabs)/` — Bottom tab navigation (home, search, cart, profile)
- `app/product/[id].tsx`, `app/order/[id].tsx` — Dynamic routes

**State**: Zustand stores in `store/` (`authStore`, `cartStore`, `userStore`)

**Data fetching**: TanStack Query over axios service modules in `services/`
- `services/api.ts` — Base axios config; swap `API_BASE_URL` here for real backend
- Other services (`authService`, `productService`, `cartService`, `orderService`) call through this base

**Styling**: NativeWind (Tailwind for React Native)

**Storage**: `AsyncStorage` for general data; `expo-secure-store` for auth tokens

### Browser Extension

**Four contexts** communicate via Chrome Message Passing API:
1. **Popup** (`src/popup/`) — Mini cart preview and quick actions
2. **Content Script** (`src/content/`) — Injects "Save to ClearCart" button on product pages, detects products from DOM
3. **Background Service Worker** (`src/background/`) — Handles messages, makes API calls, schedules price checks
4. **Options Page** (`src/options/`) — Extension settings

**State**: Zustand (shared across extension contexts)

**Storage**: `chrome.storage.sync` / `chrome.storage.local`

**Build**: Vite + CRXJS plugin; `public/manifest.json` is MV3
