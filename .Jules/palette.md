## 2025-05-29 - Added ARIA Label to Wisdom Icon\n**Learning:** The ChatBubble component uses icon-only buttons for interactive elements (like the wisdom card popup) that lack screen reader context.\n**Action:** Ensure all interactive elements relying on emojis or icons have a descriptive aria-label.

## 2026-06-01 - Missing Keyboard Focus States on Custom Buttons
**Learning:** Tailwind's CSS reset strips default outline styles from `button` elements. Because the codebase uses custom card-like buttons (e.g., `ChoiceButton`, `LanguageToggle`) without explicitly adding `focus-visible` classes, the app becomes completely unnavigable for keyboard-only users who rely on tab focus indicators.
**Action:** When building interactive components or replacing native buttons with styled cards, always explicitly define keyboard focus styles using Tailwind's `focus-visible:ring-*` and `focus-visible:outline-none` utilities.
