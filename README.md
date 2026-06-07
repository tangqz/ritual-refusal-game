# Cultural Compass (文化指南)

An interactive cultural education game for Chinese adoptees reconnecting with their heritage. Practice Chinese social etiquette through AI-powered roleplay conversations with virtual Chinese aunties and uncles.

**[Try it live →](https://ritual-refusal-game.vercel.app)**

## How It Works

Navigate **8 real-life social scenarios** — receiving a red envelope, responding to compliments, fighting over the bill, navigating workplace guanxi, and more. Each scenario is a conversation with an AI-powered NPC who behaves like a natural Chinese relative, not a lecturer.

You progress through **4 learning stages** per scenario:

| Stage | Description |
|-------|-------------|
| **Observe** | Watch a pre-written dialogue unfold with typewriter streaming. Expandable notes reveal cultural subtext and what each person is really thinking. |
| **Guided** | Choose from 4 AI-generated responses — one is culturally correct. Get detailed feedback on why each choice works. |
| **Practice** | Type your own responses with ghost-text autocomplete suggesting culturally appropriate completions as you type. |
| **Challenge** | Full free-text conversation. No hints, no suggestions, no coaching — just you and the NPC. |

After each stage, you receive a **personalized debrief** with a custom title, summary, and annotated phrases showing what you said well and what could be smoother. 32 "Auntie's Wisdom" collectible cards are viewable in the Wisdom Book.

## Cultural Concepts Taught

| Concept | Pinyin | Meaning |
|---------|--------|---------|
| 推辞 | tuīcí | Ritualistic refusal — declining 2-3 times before accepting |
| 客气 | kèqi | Polite deference — mutual performance of modesty and generosity |
| 面子 | miànzi | Face — social prestige and dignity |
| 人情 | rénqíng | Social debt created by receiving favors |
| 关系 | guānxi | Relationship networks for social and business interactions |
| 含蓄 | hánxù | Implicit, indirect communication |
| 分寸 | fēncùn | Social calibration — knowing the right degree of behavior |

## Scenarios

| Scenario | Tier | Unlock |
|----------|------|--------|
| The Red Envelope Dance (红包) | Beginner | — |
| The Compliment Trap | Beginner | — |
| Being a Guest | Beginner | — |
| The Gift Protocol | Intermediate | Red Envelope + Guest |
| The Bill Battle | Intermediate | Red Envelope + Compliment |
| The Dinner Invitation | Intermediate | Guest |
| The Office Favor | Advanced | Bill + Gift |
| Graceful Refusal | Advanced | Office + Dinner |

## Design Roadmap / TODO

- [ ] **Scenario → Learning Objective Mapping** — Map each scenario to explicit learning goals.  
  *e.g. "Red Envelope = ritual refusal timing + face-giving", "Graceful Refusal = boundary + face-saving refusal".*

- [ ] **Mastery-Based Wisdom Cards** — Redesign wisdom cards as mastery-based rewards: players earn cards by triggering/understanding a cultural concept, not merely by completing a scenario.

- [ ] **Transparent Feedback Rubric** — Display per-round feedback across 5 dimensions: **warmth**, **clarity**, **face-saving**, **boundary**, **timing**. Let players see *why* a response was (or wasn't) culturally appropriate.

- [ ] **No Public Leaderboard** — Replace any competitive ranking with personal progress tracking: **self-improvement**, **scenario completion**, **reflection depth**.

- [ ] **Maintain Flow (Scaffolded Difficulty)** — Preserve the 4-stage progression (**Observe → Guided → Practice → Challenge**) to keep players in the flow channel as difficulty ramps.

- [ ] **Personalization** — Let players choose:
  - Language: English / 中文
  - Hint intensity (low / medium / high)
  - Cultural familiarity level
  - Scenario emotional intensity (low / high)

- [ ] **Prevent Novelty Decay** — Introduce varied NPCs, different relationship contexts, multiple endings per scenario, and regularly updated wisdom cards.

- [ ] **Evidence of Learning Gains** — Add pre/post reflection prompts or short quizzes to demonstrate measurable improvement in cultural concept understanding and situational judgment.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5 (strict)
- **Styling:** Tailwind CSS 4 (stone/amber/emerald palette)
- **AI:** DeepSeek (`deepseek-v4-pro`) via SSE streaming
- **Autocomplete:** DeepSeek FIM (fill-in-the-middle) API
- **State:** React 19 + localStorage persistence
- **Validation:** Zod 4
- **Icons:** Lucide React
- **Testing:** Vitest 4

## Getting Started

### Prerequisites

- Node.js ≥ 20
- A [DeepSeek API key](https://platform.deepseek.com/api_keys)

### Setup

```bash
npm install
echo "DEEPSEEK_API_KEY=sk-your-key-here" > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | Yes | DeepSeek API key |
| `LLM_DEBUG` | No | Set `true` to log full LLM payloads |
| `LLM_MAX_RETRIES` | No | API call retry attempts (default: 2) |

## Project Structure

```
app/
  page.tsx                         # Homepage
  layout.tsx                       # Root layout (SEO + JSON-LD)
  game/
    page.tsx                       # Journey map (scenario grid)
    [scenario]/page.tsx            # Main game engine
    wisdom-book/page.tsx           # Wisdom card gallery
  api/
    chat/route.ts                  # Chat proxy → DeepSeek (SSE)
    debrief/route.ts               # Post-game analysis (SSE)
    hint/route.ts                  # Cultural hint generator
    fim-complete/route.ts          # FIM autocomplete proxy
lib/
  scenario-config.ts               # Scenario metadata + unlock logic
  scenario-goals.ts                # Per-scenario cultural goals
  cultural-insights.ts             # 32 Auntie's Wisdom cards
  learning-progression.ts          # 4-stage learning model
  game-progress-store.ts           # localStorage persistence
  stream-parser.ts                 # Tag-based SSE response parser
  i18n.ts                          # Bilingual text dictionary (en/zh)
  observe-script.ts                # Observe-mode pre-written dialogues
  validation.ts                    # Zod request schemas
  content-filter.ts                # Content moderation
  rate-limit.ts                    # In-memory rate limiter
  fetch-utils.ts                   # Retry with exponential backoff
components/
  game/                            # Game-specific components
  ui/                              # Reusable UI primitives
```

## Architecture

### AI Integration

1. Client sends conversation history + scenario/stage/round/language to `/api/chat`
2. API route validates with Zod, rate-limits, assembles a system prompt via `buildSystemPrompt()`, calls DeepSeek with `stream: true`
3. DeepSeek returns SSE chunks; API forwards as `{ type: 'chunk', text }` events
4. Client reassembles lines from chunks, feeds them to `StreamParser`
5. `StreamParser` parses tagged sections (`<<NPC>>`, `<<OPTIONS>>`, `<<WISDOM>>`, etc.) for streaming display
6. On stream end, parsed sections are rendered as message bubbles

### LLM Output Tags

```
<<NPC>>         NPC dialogue with (actions) in parentheses
<<OPTIONS>>     4 bullet choices (guided mode), one marked [ACCEPT]
<<FEEDBACK>>    Cultural reflection on the player's choice
<<WISDOM>>      Reference to an existing wisdom card by ID
<<END_AVAILABLE>> Natural conversation end point reached
```

### i18n

All UI text goes through the `t()` function in `lib/i18n.ts`. English and Chinese with real-time toggling. No hardcoded strings in components.

### Persistence

Game progress is stored in `localStorage` and synced to the server via `/api/progress`. No accounts required. Tracks completed scenarios, stages, collected wisdom cards, and onboarding status.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run coverage` | Test coverage report |
