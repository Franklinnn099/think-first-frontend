# ThinkFirst — Browser Extension

> **Status:** In development  
> **Manifest Version:** MV3 (Chrome / Edge)  
> **AI Engine:** Claude AI (behavioral reasoning layer)  
> **Project:** ClearCart UG — Hackathon 2025, Social Impact Track

---

## Table of Contents

1. [Overview](#overview)
2. [Why This Extension Exists](#why-this-extension-exists)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Features](#features)
7. [Claude AI Integration](#claude-ai-integration)
8. [Getting Started](#getting-started)
9. [Build & Distribution](#build--distribution)
10. [API Integration](#api-integration)

---

## Overview

**ThinkFirst** is an AI-powered Chrome extension that sits between University of Ghana students and the manipulative shopping environments engineered to exploit their emotional vulnerabilities.

It detects manipulation tactics on e-commerce pages (Jumia, Shein, Temu, etc.) in real time, scores the student's impulse risk, rewrites manipulative copy into honest language using Claude AI, and generates compassionate reflection prompts before checkout is completed.

> ThinkFirst never blocks a purchase. It introduces intelligent, non-shaming friction at the moment of maximum vulnerability — the gap between emotional urge and completed purchase.

---

## Why This Extension Exists

Modern e-commerce platforms are engineered to exploit emotional weakness. ThinkFirst detects and counteracts:

| Tactic | Example |
|---|---|
| **Urgency pressure** | "Ends tonight", "Hurry now", "Limited time offer" |
| **Scarcity pressure** | "Only 2 left", "Almost sold out", "Last one" |
| **Social proof** | "247 people viewing", "Bestseller", "Trending now" |
| **Loss aversion** | "Price goes up at midnight", "One-time offer" |
| **Discount anchoring** | "Was GHS 250 — now GHS 89", "You save GHS 120" |

**AI Truth Rewrite examples:**

| Original Manipulative Copy | ThinkFirst Truth Rewrite |
|---|---|
| "Only 3 left! Hurry before it's gone!" | "This page is using scarcity pressure to reduce your decision time." |
| "You SAVE GHS 120 today only!" | "You would spend GHS 130. The discount creates urgency, not necessity." |
| "247 people are viewing this right now" | "This message creates social pressure. You cannot verify this claim." |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite + CRXJS (Chrome Extension HMR plugin) |
| Styling | Tailwind CSS |
| State | Zustand (shared across extension contexts) |
| Messaging | Chrome Extension Message Passing API (type-safe) |
| Storage | `chrome.storage.local` (on-device, privacy-first) |
| AI Engine | Claude AI via Anthropic API (server-side proxy) |
| Build Target | Chrome MV3 |

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    ThinkFirst Extension                   │
│                                                           │
│  ┌─────────────────┐   ┌─────────────────────────────┐   │
│  │  Popup (React)  │   │  Options Page (React)        │   │
│  │  - Risk badge   │   │  - Sensitivity settings      │   │
│  │  - Cooling-off  │   │  - Notification prefs        │   │
│  │  - Quick save   │   │  - Clear data                │   │
│  └────────┬────────┘   └──────────────┬───────────────┘   │
│           │                           │                   │
│  ┌────────▼───────────────────────────▼───────────────┐   │
│  │          Background Service Worker (MV3)           │   │
│  │  - Message router                                  │   │
│  │  - Claude API calls (server-side)                  │   │
│  │  - Risk score computation                          │   │
│  │  - chrome.alarms for cooling-off timers            │   │
│  │  - Browser notifications for price drops           │   │
│  └────────┬───────────────────────────────────────────┘   │
│           │  chrome.tabs.sendMessage                      │
│  ┌────────▼───────────────────────────────────────────┐   │
│  │              Content Script                        │   │
│  │  - Injected on all shopping pages                  │   │
│  │  - Keyword-based tactic detection (<200ms, offline)│   │
│  │  - DOM observation for checkout page entry         │   │
│  │  - Renders intervention modal overlay              │   │
│  │  - Updates toolbar badge (risk score)              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                           │
│  ┌────────────────────────────────────────────────────┐   │
│  │          chrome.storage.local                      │   │
│  │  (cooling-off list, session state, user prefs)     │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
             │
             ▼
    ┌─────────────────────────┐
    │  ThinkFirst Backend API │  ← Proxies Claude, syncs cooling-off
    │  (from backend repo)    │    list with mobile app
    └─────────────────────────┘
```

### Context Communication Flow

```
Content Script ──► Background SW ──► Claude API (server-side)
     ▲                   │
     │                   ▼
  DOM events         Popup / Options
```

---

## Project Structure

```
browser-extension/
├── src/
│   ├── popup/                        # Extension toolbar popup (React)
│   │   ├── Popup.tsx                 # Main popup — risk badge, cooling-off list
│   │   ├── popup.html
│   │   └── popup.css
│   │
│   ├── content/                      # Content scripts (injected into every page)
│   │   ├── index.ts                  # Entry — sets up observers
│   │   ├── manipulationDetector.ts   # Local keyword scan of page text (<200ms)
│   │   ├── riskScoreUpdater.ts       # Updates toolbar badge color/number
│   │   ├── interventionModal.tsx     # Full pause modal (high risk / checkout)
│   │   └── overlay.tsx               # Floating "Save to ThinkFirst" button
│   │
│   ├── background/                   # MV3 Service Worker
│   │   ├── index.ts                  # Entry
│   │   ├── messageHandler.ts         # Routes messages from popup & content
│   │   ├── claudeService.ts          # Anthropic API calls (truth rewrite, reflection)
│   │   ├── riskEngine.ts             # Composite risk score calculation
│   │   ├── coolingOffService.ts      # Save/retrieve cooling-off items
│   │   └── alarms.ts                 # 24h cooling-off timers + notifications
│   │
│   ├── options/                      # Extension settings page
│   │   ├── Options.tsx
│   │   ├── options.html
│   │   └── options.css
│   │
│   ├── components/                   # Shared React components
│   │   ├── RiskBadge.tsx             # Color-coded risk score pill
│   │   ├── TruthRewrite.tsx          # Claude's honest rewrite card
│   │   ├── ReflectionPrompt.tsx      # Claude's non-shaming reflection question
│   │   ├── CoolingOffCard.tsx        # Saved item in popup list
│   │   └── TacticTag.tsx             # Label for detected manipulation tactic
│   │
│   ├── services/
│   │   ├── apiClient.ts              # HTTP client (swap URL for real backend)
│   │   └── notificationService.ts    # Browser notification helpers
│   │
│   ├── utils/
│   │   ├── storage.ts                # Type-safe chrome.storage wrappers
│   │   ├── messaging.ts              # Type-safe chrome.runtime.sendMessage
│   │   ├── timeOfDayRisk.ts          # Elevated risk: 10pm–2am window
│   │   └── formatGHS.ts              # Ghana Cedi price formatting
│   │
│   ├── constants/
│   │   ├── manipulationTactics.ts    # Keyword → tactic category mappings
│   │   └── riskWeights.ts            # Risk score signal weights
│   │
│   └── types/
│       ├── messages.ts               # Chrome message type union
│       ├── analysis.ts               # ImpulseAnalysis, RiskScore, TriggerType
│       └── coolingOff.ts             # CoolingOffItem
│
├── public/
│   ├── manifest.json                 # Chrome MV3 manifest
│   └── icons/
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
│
├── __tests__/
│   ├── manipulationDetector.test.ts
│   ├── riskEngine.test.ts
│   └── messageHandler.test.ts
│
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── .env.example
```

---

## Features

### 1. Manipulation Detection (Content Script — Offline Safe)
- Scans all visible page text against keyword dictionary on page load
- Detects: urgency, scarcity, social proof, loss aversion, discount anchoring
- Runs in <200ms — Claude enriches after, never blocks on AI

### 2. Impulse Risk Score
Composite signal updated dynamically as the student browses:

| Signal | Logic |
|---|---|
| Manipulation tactics count | +10–15 pts per tactic type detected |
| Time of day (10pm–2am) | +15 pts baseline elevation |
| Product page revisit (3+ times) | +20 pts |
| Discount intensity (>40%) | +10 pts |
| User stress self-report | ±10 pts |

**Risk levels:**
- 🟢 **Low (0–30):** Small badge only, no interruption
- 🟡 **Medium (31–60):** Gentle reflection prompt in popup
- 🔴 **High (61–100):** Full pause modal before checkout

### 3. AI Truth Rewrite (Claude)
Claude rewrites manipulative shopping copy into neutral, factually accurate language. Not sarcastic — just honest. Shown in the intervention modal and popup.

### 4. Reflective Intervention Prompts (Claude)
Non-shaming, context-appropriate reflection questions:

| Trigger Type | Prompt |
|---|---|
| Stress | "Would you still want this tomorrow if today had gone well?" |
| FOMO | "The urgency is engineered. The item will likely still be available tomorrow." |
| Status | "Is this about the item, or about how you want to feel right now?" |
| Boredom | "Late-night browsing often creates purchase regret. Save it and revisit tomorrow." |

### 5. Cooling-Off List
- Student clicks "Save for Later" instead of buying immediately
- Item stored with 24h timer, risk score, and trigger type
- After 24h: Claude re-evaluation prompt — *"The urgency you felt then was engineered. Do you still want it?"*
- Synced with the ThinkFirst mobile app via backend API

### 6. Toolbar Badge
- Live number shows current page's risk score
- Color changes: green → yellow → red as risk increases
- Clicking opens the popup with full analysis

---

## Claude AI Integration

Claude is invoked from the **Background Service Worker** (never from content scripts directly, to protect the API key server-side).

### Message Types

```ts
// types/messages.ts
export type ThinkFirstMessage =
  | { type: 'ANALYZE_PAGE'; payload: { tactics: string[]; pageUrl: string; timeOfDay: number } }
  | { type: 'SAVE_TO_COOLING_OFF'; payload: { productName: string; url: string; riskScore: number } }
  | { type: 'GET_COOLING_OFF_LIST' }
  | { type: 'REMOVE_FROM_COOLING_OFF'; payload: { id: string } }
  | { type: 'GET_RISK_SCORE' };
```

### Claude System Prompt

```ts
const systemPrompt = `
You are ThinkFirst's behavioral reasoning engine for University of Ghana students.
Your role is NOT to judge or shame the user. Use epistemic humility throughout.

Given detected manipulation tactics and context, respond with JSON:
{
  "triggerType": "stress | fomo | status | boredom | loss_aversion",
  "truthRewrites": [{ "original": "...", "honest": "..." }],
  "reflectionPrompt": "One compassionate, non-verdict question",
  "riskExplanation": "Brief explanation of what's happening emotionally",
  "regretForecast": "low | medium | high"
}

Never say 'you should not buy this'. Always frame with 'this might suggest...'.
`;
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Chrome browser

### Install & Run Dev Mode

```bash
cd browser-extension
npm install
npm run dev
```

### Load in Chrome

1. Go to `chrome://extensions/`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load unpacked**
4. Select `browser-extension/dist/`

CRXJS auto-rebuilds and reloads on file save.

---

## Build & Distribution

```bash
npm run build          # Production build → dist/
npm run build:firefox  # Firefox MV2 compat → dist-firefox/
```

### Chrome Web Store Checklist
- [ ] Icons at 16, 32, 48, 128 px
- [ ] `manifest.json` version bumped
- [ ] Privacy policy URL added
- [ ] All permissions justified (storage, alarms, notifications, activeTab only)
- [ ] Screenshots showing ThinkFirst intervention in action

---

## API Integration

```env
# .env
VITE_API_BASE_URL=http://localhost:3001   # Dummy backend (dev)
# VITE_API_BASE_URL=https://api.thinkfirst.app  # Real backend (prod)
```

When the backend repo is ready:
1. Update `VITE_API_BASE_URL` in `.env`
2. Claude calls move fully server-side (no API key in extension)
3. Cooling-off list syncs with mobile app via shared API
