## 2026-05-29 - Memoize MarkdownText during LLM streaming
**Learning:** In a chat interface with live LLM streaming, continuously updating a `liveText` state in the parent component causes the entire list of past messages to re-render. If past messages use a custom markdown parser that uses expensive RegExp execution, this generates significant CPU overhead on every single token streamed.
**Action:** Wrap the pure, static presentation component (`MarkdownText`) with `React.memo` to prevent re-renders of older, finalized messages when the parent component updates its streaming state.

## 2026-06-03 - Memoize FIM prompt string calculation during streaming
**Learning:** During LLM live streaming, `app/game/[scenario]/page.tsx` re-renders on every token. A helper function `getFimPrompt()` was computing a context string by stringifying and joining the past message array on *every render*. Because this string was passed as a prop to a child component, it recreated the `fetchGhost` callback and caused unnecessary hook evaluations hundreds of times per second.
**Action:** Wrap complex prompt/string generation derived from state in `useMemo` when the parent component is subject to high-frequency re-renders (like streaming), ensuring it only recalculates when the actual message history changes, not when the live token stream updates.

## 2026-06-03 - Memoize MessageItem to prevent re-renders during streaming
**Learning:** Even if a child component (`ChatBubble`) is wrapped in `React.memo`, inline function closures (e.g., `() => togglePsychology(m.id)`) and rendering JSX as `children` in a `.map` loop create new references on every render. During high-frequency state updates like live text streaming, this defeats the memoization, causing the entire history list to re-render constantly.
**Action:** Extract the `.map` body into a separate, dedicated `MemoizedMessageItem` component wrapped in `React.memo`. Pass primitive values (`isExpandedNote={expandedNotes.has(m.id)}`) instead of complex objects (like the whole Set) to ensure stable props and effective memoization.
