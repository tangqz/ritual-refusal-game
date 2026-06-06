## 2026-05-29 - Memoize MarkdownText during LLM streaming
**Learning:** In a chat interface with live LLM streaming, continuously updating a `liveText` state in the parent component causes the entire list of past messages to re-render. If past messages use a custom markdown parser that uses expensive RegExp execution, this generates significant CPU overhead on every single token streamed.
**Action:** Wrap the pure, static presentation component (`MarkdownText`) with `React.memo` to prevent re-renders of older, finalized messages when the parent component updates its streaming state.

## 2026-06-03 - Memoize FIM prompt string calculation during streaming
**Learning:** During LLM live streaming, `app/game/[scenario]/page.tsx` re-renders on every token. A helper function `getFimPrompt()` was computing a context string by stringifying and joining the past message array on *every render*. Because this string was passed as a prop to a child component, it recreated the `fetchGhost` callback and caused unnecessary hook evaluations hundreds of times per second.
**Action:** Wrap complex prompt/string generation derived from state in `useMemo` when the parent component is subject to high-frequency re-renders (like streaming), ensuring it only recalculates when the actual message history changes, not when the live token stream updates.

## 2026-06-05 - Avoid inline callbacks defeating memoization during streaming
**Learning:** Even when `ChatBubble` was wrapped in `React.memo`, passing inline functions like `onWisdomClick={() => showWisdomPopup(m.wisdomCard!)}` during the list mapping within `messages.map` defeated the memoization. This caused O(N) re-renders of the entire message history during high-frequency live text streaming state updates in the parent component.
**Action:** Extract list item rendering logic into a separate `MemoizedMessageItem` component wrapped in `React.memo`. Pass down primitive values (e.g. `expandedNotes.has(m.id)`) and stable `useCallback` references from the parent, handling any item-specific logic inside the memoized child component's own `useCallback` hooks.
