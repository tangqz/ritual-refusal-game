# CLAUDE.md — Cultural Compass (文化指南)

## Project Domain

An interactive cultural education game for Chinese adoptees reconnecting with their heritage. Teaches Chinese social etiquette through AI-powered NPC roleplay across 8 scenarios.

**Key cultural concepts:** 推辞 (tuīcí), 客气 (kèqi), 面子 (miànzi), 人情 (rénqíng), 关系 (guānxi), 含蓄 (hánxù), 分寸 (fēncùn)

**Target audience:** Chinese adoptees raised abroad who are *learning, not being tested*. NPCs should be warm and understanding — the goal is connection and cultural discovery, not perfect performance.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with Turbopack
- **Language:** TypeScript 5 strict mode (`tsc --noEmit`)
- **Styling:** Tailwind CSS 4 (stone/amber/emerald palette)
- **AI:** DeepSeek `deepseek-v4-pro` via SSE streaming + FIM API for autocomplete
- **Validation:** Zod 4 (request schemas in `lib/validation.ts`)
- **State:** React 19 with `useState`/`useRef`/`useCallback`; localStorage persistence
- **Testing:** Vitest 4 with `@vitest/coverage-v8`
- **Runtime:** `npm run dev` → `http://localhost:3000`

## Project Architecture

```
app/
  page.tsx                         # Homepage
  layout.tsx                       # Root layout (Geist fonts, SEO metadata, JSON-LD)
  globals.css                      # Tailwind imports + custom animations
  game/
    page.tsx                       # Journey map with scenario grid
    layout.tsx                     # Game layout
    [scenario]/page.tsx            # ~1400-line game engine — chat UI, streaming, 4 stages
    [scenario]/layout.tsx
    wisdom-book/page.tsx           # Collected wisdom card gallery
  api/
    chat/route.ts                  # Chat SSE proxy → DeepSeek (validation, rate-limit, retry)
    debrief/route.ts               # Debrief SSE streaming with progress events
    hint/route.ts                  # One-shot cultural hint generation
    fim-complete/route.ts          # FIM autocomplete proxy → DeepSeek
    health/route.ts                # Health check
    progress/route.ts              # Server-side progress persistence

components/
  game/
    JourneyMap.tsx                 # Tiered scenario grid (beginner/intermediate/advanced)
    NarrativeIntro.tsx             # 5-step onboarding carousel
    StageSelector.tsx              # observe/guided/practice/challenge picker
    DebriefPanel.tsx               # Post-stage debrief: title, summary, phrase annotations
    FillInInput.tsx                # Free-text input with FIM ghost-text autocomplete
    PsychologyNote.tsx             # Expandable "what were they thinking?" reveal
    LearningStageIndicator.tsx
  ui/
    ChatBubble.tsx                 # NPC/user/context/feedback variants
    ChoiceButton.tsx               # Guided-mode option button
    LanguageToggle.tsx             # EN/中文 toggle
    MarkdownText.tsx               # Markdown rendering
    ProgressBar.tsx

lib/
  scenario-config.ts               # 8 scenarios — bilingual metadata, tiers, unlock logic
  scenario-goals.ts                # Per-scenario cultural goal definitions + interaction patterns
  cultural-insights.ts             # ~32 "Auntie's Wisdom" cards with bilingual text
  learning-progression.ts          # 4-stage model: observe→guided→practice→challenge
  game-progress-store.ts           # localStorage persistence with corruption recovery
  progress-store-hybrid.ts         # localStorage + fire-and-forget server sync
  progress-store-server.ts         # Server-side progress (API-backed)
  stream-parser.ts                 # Tag-based SSE parser (<<NPC>>, <<OPTIONS>>, etc.)
  game-titles.ts                   # Achievement titles + LLM title conversion
  i18n.ts                          # Complete bilingual dictionary + t() function
  observe-script.ts                # Hardcoded observe-mode dialogues with split thoughts
  validation.ts                    # Zod schemas for all API requests
  content-filter.ts                # User input moderation + LLM output safety filter
  rate-limit.ts                    # In-memory sliding-window rate limiter
  fetch-utils.ts                   # Exponential backoff + jitter retry for API calls
  llm-logger.ts                    # Structured LLM request/response logging
  prompts/
    prompt-builder.ts              # System prompt assembly from scenario + stage + lang
    scenario-prompts.ts            # Per-scenario persona, motivation, lesson, mistake data

__tests__/                         # 24 Vitest test files covering all lib modules + API routes
```

## Critical Rules

1. **NPC dialogue and player options MUST stay in separate UI elements.** Never leak option text into NPC chat bubbles. The `StreamParser.flushSection()` has safety nets to strip leaked bullets and action blocks.

2. **Bubble styling:** Player → `bg-stone-800 text-white` (right). NPC → `bg-white border border-stone-200` (left, avatar). Context → centered, dimmed, italic. Feedback → `bg-amber-50 border border-amber-200` with owl icon.

3. **"End Conversation" is always user-triggered.** The LLM uses `<<END_AVAILABLE>>` to signal readiness; the user clicks the button. Never auto-end from `<<END>>`.

4. **All UI text goes through `t()` in `lib/i18n.ts`.** Never hardcode English or Chinese strings in components. Scenario data uses `*En`/`*Zh` suffix pairs.

5. **API routes are thin proxies** — they validate via Zod, rate-limit, assemble prompts, call DeepSeek, and stream SSE back. Business logic lives in `lib/`.

6. **`StreamParser` is the single source of truth** for LLM output parsing. If tag format changes, update it there.

## React State — Known Pitfalls

1. **Stale closures:** Use parallel refs (`messagesRef`, `stageRef`, `currentRoundRef`) alongside state in streaming callbacks. Always include all deps in dependency arrays.

2. **SSE chunking:** Token-level streaming WILL split `<</` and `>>` across chunks. Buffer partial lines and only feed complete lines to `parser.feed()`. Never feed raw SSE chunks directly.

3. **Double-init guard:** `gameInitRef` prevents `startGame()` firing twice in Strict Mode. Never remove this.

4. **Abort cleanup:** Always `abortRef.current?.abort()` at top of `streamFetch`. Clean up on unmount.

5. **Duplicate feedback:** `acceptanceFeedbackShownRef` prevents duplicate owl feedback when the client already showed acceptance feedback before the LLM generates `<<FEEDBACK>>`.

## Streaming Architecture

```
Client → POST /api/chat → buildSystemPrompt() → DeepSeek chat/completions (stream:true)
  → SSE chunks forwarded as { type: 'chunk', text } | { type: 'thinking', text }
  → Client buffers lines → StreamParser.feed(line) per line
  → Live partial text rendered during stream → parser.getResult() on end
```

**LLM Tag Format:**
```
<<CONTEXT>> scene setting (round 1 only)
<<NPC>> dialogue with (actions) in parentheses
<<PLAYER>> observe mode — player response
<<PSYCHOLOGY>> inner thoughts (observe mode)
<<OPTIONS>> 4 bullets, one marked [ACCEPT] (guided mode)
<<FEEDBACK>> cultural reflection on choice
<<WISDOM>> id: card_id (reference existing card)
<<END_AVAILABLE>> conversation can naturally end
<<END>> title data: title_name_en/zh, title_emoji, title_desc_en/zh
```

Both `<</TAG>>` and `</TAG>` close forms accepted (LLM sometimes emits XML-style).

## Debrief System

Non-observe modes trigger a debrief SSE stream on game end:
- **Step 1:** "Thinking" (client-side implicit)
- **Step 2:** Title generation (personalized cultural nickname)
- **Step 3:** Summary (one strength + one gentle growth tip)
- **Step 4:** Phrase annotations (GOOD/IMPROVE with exact phrase matches) — practice/challenge only
- **Step 5:** Done, transition to DebriefPanel

Guided mode skips step 4 (no free-text to annotate). Client fallback titles exist for all 8 scenarios if the API fails.

## Error Recovery & Resilience

- **API failures:** 3 retries with exponential backoff + jitter in `fetchWithRetry`. After exhaustion, shows per-scenario fallback NPC closing message + "End Conversation" button.
- **Content safety:** `filterUserInput()` blocks prompt injection, PII, and harmful content before API calls. `filterLlmOutput()` redacts harmful text from LLM responses.
- **Rate limiting:** In-memory sliding window per endpoint (chat: 30/min, debrief: 10/min, hint: 20/min, fim: 30/min).
- **Progress corruption:** `loadProgress()` saves a corrupted backup, attempts partial recovery, falls back to empty state.
- **Multi-tab detection:** BroadcastChannel heartbeat prevents duplicate game sessions.
- **Observe mode timeout:** 15s safety timeout auto-advances stuck observe rounds.

## Testing

- **Test runner:** Vitest (`npm test`, `npm run test:watch`)
- **Coverage:** `npm run coverage` → `coverage/lcov-report/index.html`
- **24 test files** covering all lib modules, API routes, and game logic
- **Runtime verification required after any code change** — type checking alone is insufficient. Start the dev server and walk through the full user flow.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | Yes | DeepSeek API key |
| `LLM_DEBUG` | No | Set `true` for verbose LLM request/response logging |
| `LLM_MAX_RETRIES` | No | Max retry attempts (default: 2) |

## File Conventions

- All components are client components (`'use client'`)
- Imports use `@/` path alias (maps to project root)
- API routes are the only files allowed to read `process.env` directly
- New wisdom cards go in `cultural-insights.ts` as `AuntieWisdom` objects
- Scenario metadata uses `ScenarioConfig` interface with `*En`/`*Zh` suffix pairs
