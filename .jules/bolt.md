## 2026-05-29 - Memoize MarkdownText during LLM streaming
**Learning:** In a chat interface with live LLM streaming, continuously updating a `liveText` state in the parent component causes the entire list of past messages to re-render. If past messages use a custom markdown parser that uses expensive RegExp execution, this generates significant CPU overhead on every single token streamed.
**Action:** Wrap the pure, static presentation component (`MarkdownText`) with `React.memo` to prevent re-renders of older, finalized messages when the parent component updates its streaming state.

## 2026-06-03 - Memoize FIM prompt string calculation during streaming
**Learning:** During LLM live streaming, `app/game/[scenario]/page.tsx` re-renders on every token. A helper function `getFimPrompt()` was computing a context string by stringifying and joining the past message array on *every render*. Because this string was passed as a prop to a child component, it recreated the `fetchGhost` callback and caused unnecessary hook evaluations hundreds of times per second.
**Action:** Wrap complex prompt/string generation derived from state in `useMemo` when the parent component is subject to high-frequency re-renders (like streaming), ensuring it only recalculates when the actual message history changes, not when the live token stream updates.

## 2026-06-08 - Memoize MessageItem mapping during LLM streaming
**Learning:** Extracting an inline mapping body inside `messages.map` into a separate `MessageItem` component and wrapping it with `React.memo` drastically reduces O(N) re-renders. Every streamed token was previously recreating the inline components which led to expensive re-renders for every message in history. By passing primitive props to the memoized `MessageItem`, we effectively stop historical messages from rendering multiple times per second during live text streaming.
**Action:** Always extract mapping body to a separate component and wrap in `React.memo` with primitive props when dealing with high-frequency updates from streaming state.
