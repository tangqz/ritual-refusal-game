## 2025-05-29 - Added ARIA Label to Wisdom Icon\n**Learning:** The ChatBubble component uses icon-only buttons for interactive elements (like the wisdom card popup) that lack screen reader context.\n**Action:** Ensure all interactive elements relying on emojis or icons have a descriptive aria-label.

## 2026-06-02 - Added Keyboard Focus Styles to Custom Buttons
**Learning:** Tailwind's CSS reset strips default outlines from `button` elements, causing custom interactive components (like ChoiceButton and LanguageToggle) to lack clear focus states for keyboard users.
**Action:** When building custom interactive components or replacing native buttons in this project, explicitly define keyboard focus styles using Tailwind's `focus-visible:ring-*` and `focus-visible:outline-none` utilities to maintain accessibility.
