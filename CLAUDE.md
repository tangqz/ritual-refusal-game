# CLAUDE.md — Chinese Ritual Game (Cultural Compass)

## Project Domain

This is an interactive cultural education game for Chinese adoptees reconnecting with their heritage. It teaches Chinese social etiquette through AI-powered NPC roleplay.

**Key cultural concepts:**
- **推辞 (tuīcí)** — ritualistic refusal; declining 2-3 times before reluctantly accepting
- **客气 (kèqi)** — polite deference; the mutual performance of modesty and generosity
- **面子 (miànzi)** — face; social prestige and dignity maintained in interactions
- **人情 (rénqíng)** — social debt/obligation created by receiving favors
- **关系 (guānxi)** — relationship networks that facilitate social and business interactions
- **含蓄 (hánxù)** — implicit, indirect communication; preference for subtlety over directness
- **分寸 (fēncùn)** — social calibration; knowing the right degree of behavior for each context

**Target audience:** Chinese adoptees raised abroad who are learning, not being tested. NPCs should be warm and understanding when the player doesn't follow traditional rituals. The goal is connection and cultural discovery, not perfect performance.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with Turbopack dev server
- **Language:** TypeScript 5 (strict mode, `tsc --noEmit` for type checking)
- **Styling:** Tailwind CSS 4 with custom stone/amber/emerald color palette
- **AI Backend:** DeepSeek (`deepseek-v4-pro`) via SSE streaming for chat, FIM API for autocomplete
- **State:** React 19 with `useState`/`useRef`/`useCallback`; localStorage for progress persistence
- **Runtime:** `npm run dev` → http://localhost:3000

## Project Architecture

```
app/
  page.tsx                    # Homepage with "Begin Journey" CTA
  layout.tsx                  # Root layout (Geist font, metadata)
  globals.css                 # Tailwind imports
  game/
    page.tsx                  # Journey map (scenario selection)
    [scenario]/page.tsx       # Main game engine (~620 lines) — chat UI, streaming, stage logic
    wisdom-book/page.tsx      # Collected wisdom card gallery
  api/
    chat/route.ts             # POST — proxies to DeepSeek chat/completions, SSE streaming
    fim-complete/route.ts     # POST — proxies to DeepSeek beta/completions for FIM autocomplete
    hint/route.ts             # POST — one-shot cultural hint generation
    progress/                 # (empty dir, reserved)

components/
  game/
    JourneyMap.tsx            # Tiered scenario grid (beginner/intermediate/advanced)
    NarrativeIntro.tsx        # 5-step onboarding carousel
    StageSelector.tsx         # observe/guided/practice/challenge stage picker
    DebriefPanel.tsx          # Post-game summary with insights, next stage CTA
    FillInInput.tsx           # Free-text input with FIM ghost-text autocomplete
    LearningStageIndicator.tsx
    PsychologyNote.tsx        # Expandable "what were they thinking?" reveal
  ui/
    ChatBubble.tsx            # Message bubble (NPC/user/context/feedback variants)
    ChoiceButton.tsx          # Guided-mode option button
    LanguageToggle.tsx        # EN/中文 switch
    MarkdownText.tsx          # Markdown rendering for messages
    ProgressBar.tsx

lib/
  scenario-config.ts          # 8 scenarios with full bilingual metadata + unlock logic
  cultural-insights.ts        # ~32 "Auntie's Wisdom" cards with bilingual text
  learning-progression.ts     # 4-stage learning model (observe→guided→practice→challenge)
  game-progress-store.ts      # localStorage persistence layer
  stream-parser.ts            # Tag-based SSE response parser (<<NPC>>, <<OPTIONS>>, etc.)
  game-titles.ts              # Achievement titles and LLM title conversion
  i18n.ts                     # Complete bilingual text dictionary (en/zh)
  prompts/
    prompt-builder.ts         # Assembles system prompts from scenario + stage + lang
    scenario-prompts.ts       # Per-scenario persona, motivation, lesson, and mistake data
```

## Critical UI Rules

1. **NPC dialogue and player options MUST stay in separate UI elements.** Never leak option text into NPC chat bubbles. The `StreamParser` has safety nets in `flushSection()` to strip leaked bullets from NPC text, but the prompt must also instruct the LLM to close `<<NPC>>` before emitting `<<OPTIONS>>`.

2. **Player messages use `bg-stone-800 text-white` (dark bubble, right-aligned).** NPC messages use `bg-white border border-stone-200` (light bubble, left-aligned with avatar). Context messages are centered, dimmed, italic. Feedback messages use `bg-amber-50 border border-amber-200` with owl icon.

3. **The "End Conversation" button is always a direct user action** — never rely on the LLM generating `<<END>>` tags to trigger debrief flow. The LLM uses `<<END_AVAILABLE>>` to signal readiness, and the user clicks the button themselves.

## React State Management — Known Pitfalls

1. **Stale closures in `useCallback`/`useEffect`:** Always include all dependencies in dependency arrays. The game engine (`[scenario]/page.tsx`) uses parallel refs (`messagesRef`, `stageRef`, `currentRoundRef`) alongside state to avoid stale closures in streaming callbacks. Follow this pattern for any new streaming or async logic.

2. **SSE delimiter chunking:** Token-level streaming WILL split multi-character delimiters like `<<`, `<</`, `>>` across chunks. The `StreamParser.feed()` method operates line-by-line after the caller reassembles lines. The caller (`page.tsx` around line 176-184) must buffer partial lines and only feed complete lines to the parser. Never feed raw SSE chunks directly to `parser.feed()`.

3. **Double-initialization guard:** Use `gameInitRef` to prevent `startGame()` from firing twice in Strict Mode. Never remove this guard.

4. **Abort controller cleanup:** Always abort in-flight fetches before starting new ones (`abortRef.current?.abort()` at top of `streamFetch`). Clean up on unmount.

## Testing Requirements

**After ANY code change, verify at runtime before declaring the fix complete:**

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000 in a browser
3. Walk through the complete user flow: homepage → onboarding → journey map → select a scenario → play through observe mode → check end conversation → debrief → try guided mode
4. Check browser console for errors
5. Confirm all state transitions work: stage unlocking, wisdom card collection, language toggle, end conversation button
6. Verify NPC dialogue renders in light bubbles (left) and player text in dark bubbles (right) — no leakage

**If anything fails, fix it before reporting done.** Do not rely solely on code analysis. Type checking alone (`tsc --noEmit`) is not sufficient verification.

## File Organization Conventions

- All components are client components (`'use client'` directive)
- Imports use `@/` path alias (maps to project root)
- Bilingual text lives in `lib/i18n.ts` via the `t()` function — never hardcode English or Chinese strings in components
- Scenario data in `lib/scenario-config.ts` uses the `ScenarioConfig` interface with `*En`/`*Zh` suffix pairs
- New cultural insights go in `lib/cultural-insights.ts` as `AuntieWisdom` objects, referenced by ID
- API routes are thin proxies to DeepSeek — they assemble the prompt, call DeepSeek, and stream back SSE
- The `StreamParser` class in `lib/stream-parser.ts` is the single source of truth for parsing LLM output — if tag format changes, update it here

## Streaming Architecture

1. Client calls `/api/chat` with messages, scenario, stage, round, and language
2. API route assembles system prompt via `buildSystemPrompt()`, calls DeepSeek `chat/completions` with `stream: true`
3. DeepSeek returns SSE chunks. API forwards as `{ type: 'chunk', text }` or `{ type: 'thinking', text }` events
4. Client reassembles lines from chunks, feeds complete lines to `StreamParser.feed()`
5. `StreamParser` accumulates sections by tag (`<<NPC>>`, `<<OPTIONS>>`, `<<WISDOM>>`, etc.) and returns live partial text for streaming display
6. On stream end, `parser.getResult()` returns the fully parsed `ParsedSections` for rendering

**LLM Output Tag Format:**
```
<<CONTEXT>> ... <</CONTEXT>>      (round 1 only — scene setting)
<<NPC>> ... <</NPC>>              (NPC dialogue with actions in parentheses)
<<PLAYER>> ... <</PLAYER>>        (observe mode — player response)
<<PSYCHOLOGY>> ... <</PSYCHOLOGY>>(observe mode — inner thoughts)
<<OPTIONS>>                        (guided mode — 4 bullet choices, one marked [ACCEPT])
- [ACCEPT] ...
- ...
<</OPTIONS>>
<<FEEDBACK>> ... <</FEEDBACK>>    (guided mode — cultural reflection on player choice)
<<WISDOM>>                        (reference existing wisdom card by ID)
id: card_id
<</WISDOM>>
<<END_AVAILABLE>>                  (signals conversation can end — shows button)
<<END>>                            (LLM title data — parsed but end is user-triggered)
<</END>>
```

Both `<<TAG>>` and `</TAG>` close forms are accepted (the latter is an LLM mistake that the parser handles).

## Environment

Requires `DEEPSEEK_API_KEY` environment variable. Set it before running `npm run dev`.
