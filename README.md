# ThinkFirst — Monorepo

> AI-powered impulse purchase protection for University of Ghana students.  
> **Hackathon 2025 — Social Impact Track**

---

## What is ThinkFirst?

ThinkFirst is an AI-powered cross-platform system that protects UG students from stress-driven impulse purchases. It operates as:

1. **A Chrome browser extension** — intercepts manipulative shopping tactics on websites in real time
2. **A mobile app** — analyzes app-based shopping (Jumia, Shein, TikTok Shop, WhatsApp sellers)

Claude AI acts as a **behavioral interpretation layer** — detecting emotional triggers, rewriting manipulative copy honestly, and generating compassionate reflection prompts before checkout.

> ThinkFirst never blocks spending. It introduces intelligent, non-shaming friction at the gap between emotional urge and completed purchase.

---

## Repository Structure

```
think-first-frontend/
├── src/                        # Web application (React + Vite) — if applicable
├── mobile-app/                 # React Native mobile app (Expo)
│   └── MOBILE_APP.md           # Full mobile app documentation
├── browser-extension/          # Chrome extension (MV3 + CRXJS + React)
│   └── BROWSER_EXTENSION.md    # Full extension documentation
├── ClearCart_UG_PRD.pdf        # Product Requirements Document
├── ClearCart_UG_SRS.pdf        # Software Requirements Specification
└── ClearCart_UG_TechStack_StressTest.pdf
```

---

## Platform Documentation

| Platform | Docs | Status |
|---|---|---|
| Mobile App | [mobile-app/MOBILE_APP.md](./mobile-app/MOBILE_APP.md) | In development |
| Browser Extension | [browser-extension/BROWSER_EXTENSION.md](./browser-extension/BROWSER_EXTENSION.md) | In development |

---

## Backend Note

> Currently using a **dummy backend** (`json-server`) for the cooling-off list and session data.  
> Claude AI calls are proxied through the backend (API key never in the client).  
> When the real backend repo is ready, update `API_BASE_URL` in:
> - `mobile-app/constants/config.ts`
> - `browser-extension/.env`
