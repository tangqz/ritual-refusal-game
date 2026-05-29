## 2026-05-29 - Memoize MarkdownText during LLM streaming
**Learning:** In a chat interface with live LLM streaming, continuously updating a `liveText` state in the parent component causes the entire list of past messages to re-render. If past messages use a custom markdown parser that uses expensive RegExp execution, this generates significant CPU overhead on every single token streamed.
**Action:** Wrap the pure, static presentation component (`MarkdownText`) with `React.memo` to prevent re-renders of older, finalized messages when the parent component updates its streaming state.
