● Base URL                                                                                                                                          
  https://clearcart-ug-backend.onrender.com                                 (replace with your actual Render URL after deploy)                                                                                                  ---                                                                       Endpoints                                                               
                                                                          
  1. POST /api/analyze — Analyze a product page
  {
    "productText": "string (required)",
    "url": "string",
    "pageContext": "string",
    "riskSignals": {
      "timeOfDay": 0-23,
      "revisitCount": "number",
      "cartValueJump": "boolean",
      "discountPercent": "number",
      "stressLevel": "low | medium | high"
    }
  }
  Response:
  {
    "success": true,
    "data": {
      "localTactics": [{ "type": "urgency", "matchedPhrase": "ends        
  tonight" }],
      "riskScore": 72,
      "riskLevel": "Low | Medium | High",
      "claudeAnalysis": {
        "manipulation_tactics": [{ "type": "", "phrase": "", "rewrite": ""
   }],
        "trigger_type": "stress_relief | fomo | status_repair | boredom | 
  self_reward",
        "trigger_explanation": "string (under 30 words)",
        "risk_level": "Low | Medium | High",
        "regret_forecast": "string",
        "reflection_prompt": "string (a question)",
        "recommendation": "buy | save | wait"
      }
    }
  }

  2. POST /api/coolingoff — Save item to cooling-off list
  {
    "sessionId": "string (required)",
    "productTitle": "string (required)",
    "productUrl": "string",
    "riskScore": "number",
    "triggerType": "string",
    "claudeAnalysis": "object",
    "sourcePlatform": "extension | mobile (required)",
    "delayHours": "number (default 24)"
  }

  3. GET /api/coolingoff/:sessionId — Get all items for a session

  4. GET /api/coolingoff/:id/reevaluate — Get AI re-evaluation prompt     
  (only works after timer expires)

  5. PATCH /api/coolingoff/:id/resolve — Resolve an item
  {
    "action": "keep | remove | extend"
  }

  6. GET /api/health — Health check

  ---
  Frontend dev must know

  - Response format: Always { success: true/false, data/error: ... }      
  - sessionId: Frontend generates and persists this per user — it's how   
  items sync between extension and mobile
  - sourcePlatform: Must be exactly "extension" or "mobile" — DB rejects  
  anything else
  - Rate limit: 30 requests/min per IP on /api/analyze
  - Deduplication: Same URL returns cached result within 10 min (cached:  
  true in response)
  - Risk level thresholds: Low (0-30), Medium (31-60), High (61-100) — use
   these to decide which UI to show (informational vs reflection prompt vs
   pause modal per PRD)
  - claudeAnalysis can be null: If no manipulation tactics are detected   
  locally, the AI is not called — frontend should handle this case        
  - stressLevel: Frontend should collect this via a quick check-in UI     
  before or during analysis