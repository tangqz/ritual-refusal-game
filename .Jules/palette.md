## 2025-05-29 - Added ARIA Label to Wisdom Icon\n**Learning:** The ChatBubble component uses icon-only buttons for interactive elements (like the wisdom card popup) that lack screen reader context.\n**Action:** Ensure all interactive elements relying on emojis or icons have a descriptive aria-label.
## 2026-05-30 - Added Keyboard Focus Ring Styles
**Learning:** Several interactive button components across the application (like LanguageToggle, JourneyMap cards, ChoiceButton) were lacking explicit focus visible styles, making keyboard navigation difficult.
**Action:** When adding new interactive elements like buttons, always include focus-visible utility classes (e.g. `focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none`) to ensure accessibility for keyboard users.
## 2026-06-06 - Enhanced ProgressBar Accessibility
**Learning:** The ProgressBar component lacked essential WAI-ARIA attributes, meaning screen readers could not interpret its state or purpose.
**Action:** Always include appropriate ARIA attributes (e.g., `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`) when implementing custom UI components that convey dynamic status information, such as progress bars. Ensure to replace hardcoded, inline implementations with these reusable, accessible components.
