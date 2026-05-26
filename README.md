# Cultural Compass (文化指南)

An interactive cultural education game for Chinese adoptees reconnecting with their heritage. Practice Chinese social etiquette through AI-powered roleplay conversations with virtual Chinese aunties and uncles.

## How It Works

Navigate through **8 real-life social scenarios** — receiving a red envelope, responding to compliments, fighting over the bill, navigating workplace guanxi, and more. Each scenario is a conversation with an AI-powered NPC who behaves like a natural Chinese relative, not a lecturer.

You progress through **4 learning stages** per scenario:

| Stage | Description |
|-------|-------------|
| **Observe** | Watch a pre-written dialogue unfold with typewriter streaming. Expandable notes reveal the cultural subtext and what each person is really thinking. |
| **Guided** | Choose from 4 AI-generated responses. Only one is culturally correct. Get detailed feedback on why each choice works or doesn't. |
| **Practice** | Type your own responses with ghost-text autocomplete that suggests culturally appropriate completions as you type. |
| **Challenge** | Full free-text conversation. No hints, no suggestions, no coaching — just you and the NPC. |

After each stage, you receive a personalized debrief with annotated phrases and "Auntie's Wisdom" collectible cards. All 32 wisdom cards are viewable in the Wisdom Book.

## Cultural Concepts

The game teaches these core Chinese social concepts:

| Concept | Pinyin | Meaning |
|---------|--------|---------|
| 推辞 | tuīcí | Ritualistic refusal — declining 2-3 times before reluctantly accepting |
| 客气 | kèqi | Polite deference — the mutual performance of modesty and generosity |
| 面子 | miànzi | Face — social prestige and dignity maintained in interactions |
| 人情 | rénqíng | Social debt created by receiving favors |
| 关系 | guānxi | Relationship networks that facilitate social and business interactions |
| 含蓄 | hánxù | Implicit, indirect communication — subtlety over directness |
| 分寸 | fēncùn | Social calibration — knowing the right degree of behavior for each context |

## Scenarios

| Scenario | Tier | Unlock Requirements |
|----------|------|---------------------|
| Red Envelope (红包) | Beginner | None |
| Compliment Trap | Beginner | None |
| Being a Guest | Beginner | None |
| The Gift Protocol | Intermediate | Red Envelope + Guest |
| The Bill Battle | Intermediate | Red Envelope + Compliment |
| The Dinner Invitation | Intermediate | Guest |
| The Office Favor | Advanced | Bill Battle + Gift Protocol |
| Graceful Refusal | Advanced | Office Favor + Dinner Invitation |

## Tech Stack

- **Framework:** Next.js 16 (App Router) with Turbopack
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 (stone/amber/emerald palette)
- **AI:** DeepSeek (`deepseek-v4-pro`) via SSE streaming
- **State:** React 19 + localStorage persistence
- **Icons:** Lucide React
- **Autocomplete:** DeepSeek FIM (fill-in-the-middle) API

## Getting Started

### Prerequisites

- Node.js 18+
- A [DeepSeek API key](https://platform.deepseek.com/api_keys)

### Setup

```bash
# Install dependencies
npm install

# Create environment file with your API key
echo DEEPSEEK_API_KEY=sk-your-key-here > .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | Yes | Your DeepSeek API key |
| `LLM_DEBUG` | No | Set to `true` to log full LLM request/response payloads to console |

## Project Structure

```
app/
  page.tsx                        # Homepage
  layout.tsx                      # Root layout
  globals.css                     # Tailwind + custom animations
  game/
    page.tsx                      # Journey map (scenario grid)
    [scenario]/page.tsx           # Main game engine
    wisdom-book/page.tsx          # Collected wisdom card gallery
  api/
    chat/route.ts                 # Chat proxy → DeepSeek (SSE)
    fim-complete/route.ts         # FIM autocomplete proxy → DeepSeek (SSE)
    hint/route.ts                 # Cultural hint generator
    debrief/route.ts              # Post-game analysis generator
components/
  game/
    JourneyMap.tsx                # Tiered scenario grid
    NarrativeIntro.tsx            # 5-step onboarding carousel
    StageSelector.tsx             # Learning stage picker
    DebriefPanel.tsx              # Post-stage summary with annotations
    FillInInput.tsx               # Free-text input with ghost-text autocomplete
    PsychologyNote.tsx            # Expandable "what were they thinking?" reveal
  ui/
    ChatBubble.tsx                # Message bubbles (NPC/user/context/feedback)
    ChoiceButton.tsx              # Guided-mode option button
    LanguageToggle.tsx            # English/中文 switch
    MarkdownText.tsx              # Markdown rendering
    ProgressBar.tsx
lib/
  scenario-config.ts              # Scenario metadata + unlock logic
  cultural-insights.ts            # 32 Auntie's Wisdom cards
  learning-progression.ts         # 4-stage learning model
  game-progress-store.ts          # localStorage persistence
  stream-parser.ts                # Tag-based SSE response parser
  game-titles.ts                  # Achievement titles
  i18n.ts                         # Bilingual text dictionary (en/zh)
  observe-script.ts               # Pre-written observe-mode dialogues
  scenario-goals.ts               # Per-scenario cultural goals
  prompts/
    prompt-builder.ts             # System prompt assembly
    scenario-prompts.ts           # Per-scenario persona + lesson data
```

## Architecture

### AI Integration

The game proxies all AI calls through Next.js API routes. The chat flow:

1. **Client** sends conversation history + scenario/stage/round/language to `/api/chat`
2. **API route** assembles a scenario-specific system prompt via `buildSystemPrompt()`, calls DeepSeek `chat/completions` with `stream: true`
3. **DeepSeek** streams SSE chunks back through the API route
4. **Client** reassembles complete lines from chunks, feeds them to `StreamParser`
5. **StreamParser** parses tagged sections (`<<NPC>>`, `<<OPTIONS>>`, `<<WISDOM>>`, etc.) and returns live partial text for typewriter rendering
6. On stream end, parsed sections are rendered as message bubbles in the chat UI

### LLM Output Tags

```
<<CONTEXT>>     Scene-setting context (round 1 only)
<<NPC>>         NPC dialogue with actions in parentheses
<<OPTIONS>>     4 bullet choices for guided mode, one marked [ACCEPT]
<<FEEDBACK>>    Cultural reflection on the player's choice
<<WISDOM>>      Reference to an existing wisdom card by ID
<<END_AVAILABLE>> Signals the conversation can naturally end
```

### i18n

All UI text goes through the `t()` function in `lib/i18n.ts`. The app supports English and Chinese with real-time toggling. No hardcoded strings in components — everything is in the bilingual dictionary.

### Persistence

Game progress is stored in `localStorage` via `lib/game-progress-store.ts`. No accounts, no database — the app is fully client-side. Tracked data includes:
- Completed scenarios and stages
- Collected wisdom cards
- Language preference
- Onboarding completion status

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
