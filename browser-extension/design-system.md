ThinkFirst Browser Extension — Full Rebuild
The entire browser extension is currently the wrong product. It was built as a generic "ClearCart" shopping cart manager — a completely different concept. Every type, component, service, and content script must be replaced with ThinkFirst's actual purpose: detecting manipulation tactics on shopping pages and introducing compassionate friction before checkout. The ThinkFirst design system (deep navy, indigo, Inter font, shadow & radius tokens) will be applied throughout.

Proposed Changes
Config & Tooling
[MODIFY] 
tailwind.config.js
Replace the ClearCart emerald palette with the full ThinkFirst design token palette: deep navy #0F172A, indigo #4338CA, soft blue #60A5FA, teal #14B8A6, and semantic risk colors (red/amber/teal). Add custom borderRadius and boxShadow tokens.

[MODIFY] 
manifest.json
Fix host_permissions: remove clearcart.app, keep localhost:3001 for dummy backend.
Keep ThinkFirst name/description (already correct).
[MODIFY] 
popup.html
Update <title> from "ClearCart" → "ThinkFirst"
Add Google Fonts Inter link
Types — Replace All
[MODIFY] 
types/index.ts
 (rename to types/index.ts)
Replace all old ClearCart types (Cart, 
Product
, User) with ThinkFirst types:

ManipulationTactic — { type, copy, severity }
ImpulseAnalysis — { riskScore, tactics, trigger, truthRewrite, reflectionPrompt, regretForecast }
CoolingOffItem — { id, url, pageTitle, savedAt, riskScore, aiSummary }
MessageType — new message type union for ThinkFirst messages
Services
[MODIFY] 
services/storageService.ts
 (replace cartService)
Wrap chrome.storage.local for:

getCoolingOffList() / addToCoolingOff(item) / removeFromCoolingOff(id)
getSettings() / setSettings()
getAnalysisHistory() / addToHistory()
[MODIFY] 
services/claudeService.ts
 (replace productService)
Proxy calls to dummy backend (localhost:3001/api/analyze):

analyzePageContext(url, pageText, tactics) → returns ImpulseAnalysis
Graceful offline fallback (returns null, detection still works locally)
Utils
[MODIFY] 
utils/riskCalculator.ts
 (replace)
Pure function computing ImpulseRiskScore (0–100) from:

tactic count × severity weights
time-of-day bonus (10pm–2am = +15)
revisit count (stored in chrome.storage)
discount intensity (if original price detected, large % = +10)
[MODIFY] 
utils/storage.ts
Keep but update key names (tf_cooling_off_list, tf_settings, tf_history).

[MODIFY] 
utils/messaging.ts
Update message types to ThinkFirst message union.

Content Script — Manipulation Detector
[MODIFY] 
content/detector.ts
 (replace)
Offline-first manipulation detection (runs <200ms, no network needed):

Urgency keywords: "only X left", "limited time", "ends in", countdown timers
Scarcity: "only 2 left in stock", "hurry", "selling fast"
Social proof abuse: "X people viewing", "bestseller"
FOMO deals: "today only", "flash sale", "40% off"
Returns ManipulationTactic[]
[MODIFY] 
content/index.ts
Complete rewrite:

Run local detector on page DOM
Compute risk score from tactics + time-of-day
If risk > 20: send TACTICS_DETECTED to background, inject risk badge into page
If risk > 60: send SHOW_INTERVENTION — background shows intervention via popup badge
Background Service Worker
[MODIFY] 
background/messageHandler.ts
Replace ClearCart cart CRUD handlers with ThinkFirst handlers:

TACTICS_DETECTED → store in session, update badge color/count
SAVE_TO_COOLING_OFF → persist item to chrome.storage
GET_COOLING_OFF_LIST → return full list
REMOVE_FROM_COOLING_OFF → delete by id
GET_PAGE_ANALYSIS → proxy to claudeService
[MODIFY] 
background/index.ts
Keep alarm/onMessage structure. Update badge color to indigo #4338CA.

Popup UI — Full Rewrite with ThinkFirst Design System
[MODIFY] 
popup/Popup.tsx
Complete rewrite. Three-state UI:

No risk detected — neutral state, ThinkFirst logo, "You're safe here" message, cooling-off list preview
Risk detected — pill badge + risk meter + tactics list + "Save for 24h" / "Continue Anyway" CTAs
Loading — subtle skeleton
[NEW] components/RiskMeter.tsx
Horizontal bar (teal → amber → red) showing 0–100 score. Includes label ("Low / Medium / High") with icon.

[NEW] components/ManipulationTag.tsx
Colored pill chips for each detected tactic. Variant by severity.

[NEW] components/CoolingOffCard.tsx
Card showing saved item: page title, saved timestamp, risk badge, "Re-evaluate" button.

[NEW] components/TruthRewrite.tsx
Shows AI-rewritten copy (from Claude Truth Rewrite) vs detected manipulative original. Two-panel layout.

[NEW] components/InterventionPanel.tsx
The core popup state when risk ≥ 60:

Warning icon + title
"What we detected" section with tactics chips
One reflection prompt from Claude
Buttons: "Save for 24h" (primary, indigo) / "Continue Anyway" (ghost)
DELETE old components: 
CartPreview.tsx
, 
PriceTag.tsx
, 
ProductCard.tsx
, 
SaveButton.tsx

Options Page
[MODIFY] 
options/Options.tsx
Rename to ThinkFirst settings. Fields: risk threshold slider, enable/disable extension toggle, cooling-off duration (12h / 24h / 48h).

Verification Plan
Automated Build Check
cd c:\Users\USER\Desktop\think-first-frontend\browser-extension
npm run build
Pass condition: No TypeScript errors, dist/ folder generated with popup.html, background.js, content script.

Dev Preview
npm run dev
Then load dist/ as an unpacked extension in Chrome (chrome://extensions → Developer mode → Load unpacked). Open the extension popup — should show ThinkFirst UI with indigo branding, not emerald ClearCart UI.

Manual Test — Content Script Detection
Navigate to any e-commerce page with urgency tactics (e.g., Amazon, Jumia). Open DevTools → Console — should see [ThinkFirst] tactics detected: [...] log. The extension badge should update.

Existing Tests
The existing tests in __tests__/ (
productDetector.test.ts
, 
messageHandler.test.ts
) will be rewritten to match new logic since all types change.

