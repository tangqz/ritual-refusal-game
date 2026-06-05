## 2026-05-29 - Memoize MarkdownText during LLM streaming
**Learning:** In a chat interface with live LLM streaming, continuously updating a `liveText` state in the parent component causes the entire list of past messages to re-render. If past messages use a custom markdown parser that uses expensive RegExp execution, this generates significant CPU overhead on every single token streamed.
**Action:** Wrap the pure, static presentation component (`MarkdownText`) with `React.memo` to prevent re-renders of older, finalized messages when the parent component updates its streaming state.

## 2026-06-03 - Memoize FIM prompt string calculation during streaming
**Learning:** During LLM live streaming, `app/game/[scenario]/page.tsx` re-renders on every token. A helper function `getFimPrompt()` was computing a context string by stringifying and joining the past message array on *every render*. Because this string was passed as a prop to a child component, it recreated the `fetchGhost` callback and caused unnecessary hook evaluations hundreds of times per second.
**Action:** Wrap complex prompt/string generation derived from state in `useMemo` when the parent component is subject to high-frequency re-renders (like streaming), ensuring it only recalculates when the actual message history changes, not when the live token stream updates.

## 2026-06-05 - Avoid O(N) Re-Renders in Lists with High-Frequency Parent Updates
**Learning:** During LLM live streaming, `app/game/[scenario]/page.tsx` updates its streaming state (like `liveNpc`) hundreds of times per second. Mapping a list of messages inline inside this parent component with complex elements and inline function closures (e.g. `onToggle={() => toggle(id)}`) defeats `React.memo` on child components because the inline closures change on every render, causing the entire history to re-render.
**Action:** Extract the body of the `map` into a standalone component (`MemoizedMessageItem`) and wrap it in `React.memo`. Pass primitive props (or strictly memoized callbacks like `useCallback`) and pass IDs to children so that closures aren't needed in the `map`.
