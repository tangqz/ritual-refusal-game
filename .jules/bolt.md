## 2026-05-29 - Memoize MarkdownText during LLM streaming
**Learning:** In a chat interface with live LLM streaming, continuously updating a `liveText` state in the parent component causes the entire list of past messages to re-render. If past messages use a custom markdown parser that uses expensive RegExp execution, this generates significant CPU overhead on every single token streamed.
**Action:** Wrap the pure, static presentation component (`MarkdownText`) with `React.memo` to prevent re-renders of older, finalized messages when the parent component updates its streaming state.

## 2026-06-03 - Memoize FIM prompt string calculation during streaming
**Learning:** During LLM live streaming, `app/game/[scenario]/page.tsx` re-renders on every token. A helper function `getFimPrompt()` was computing a context string by stringifying and joining the past message array on *every render*. Because this string was passed as a prop to a child component, it recreated the `fetchGhost` callback and caused unnecessary hook evaluations hundreds of times per second.
**Action:** Wrap complex prompt/string generation derived from state in `useMemo` when the parent component is subject to high-frequency re-renders (like streaming), ensuring it only recalculates when the actual message history changes, not when the live token stream updates.

## 2026-06-04 - Memoize map body during LLM streaming
**Learning:** Even when inner components like `ChatBubble` are wrapped in `React.memo()`, passing inline function closures (like `() => togglePsychology(m.id)`) inside a `messages.map` body creates new function references on every render, completely defeating the memoization. During LLM streaming, this triggers an O(N) re-render of all messages on every token.
**Action:** Extract map bodies that render frequently updated lists into separate components wrapped in `React.memo` (e.g. `MemoizedMessageItem`). Pass primitive values (e.g. `isNoteExpanded={expandedNotes.has(m.id)}`) and stable callback functions to ensure the inner component's props don't change unnecessarily, preserving memoization.
