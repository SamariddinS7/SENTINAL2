---
name: VMS AI Copilot
description: Enterprise AI Copilot feature — architecture, file locations, design decisions.
---

# VMS AI Copilot

## Architecture
Observe→Understand→Reason→Plan→Verify→Execute→Explain cycle. Independent agents collaborate through CopilotOrchestrator.

## Files
- `apps/api/src/services/copilot/CopilotOrchestrator.ts` — intent classification, agent orchestration, action executor with RBAC
- `apps/api/src/services/copilot/CopilotApiRouter.ts` — POST /query, POST /execute-action, GET /context
- `apps/web/src/components/AICopilot.tsx` — UI panel (reasoning chain, action cards with risk, confidence meter, source tags)
- Mounted: `app.use("/api/copilot", authenticateToken, copilotApiRouter)` in server.ts
- View: `ai_copilot` in App.tsx, Sparkles icon in sidebar

## Design decisions
- Responds in Uzbek (matches platform)
- Uses gemini-2.5-flash for reasoning, gemini-2.0-flash for perception
- Gracefully degrades to rule-based when GEMINI_API_KEY absent
- Token key: `sentinel_token` in localStorage
- VmsHealthService method is `getTelemetry()` not `getMetrics()`

**Why:** Spec says "NOT a chatbot" — reasoning chain visible, action cards have risk ratings, confidence meter, source citations all enforce operational intelligence framing.
