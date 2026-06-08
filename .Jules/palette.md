## 2025-05-29 - Added ARIA Label to Wisdom Icon\n**Learning:** The ChatBubble component uses icon-only buttons for interactive elements (like the wisdom card popup) that lack screen reader context.\n**Action:** Ensure all interactive elements relying on emojis or icons have a descriptive aria-label.
## 2026-05-30 - Added Keyboard Focus Ring Styles
**Learning:** Several interactive button components across the application (like LanguageToggle, JourneyMap cards, ChoiceButton) were lacking explicit focus visible styles, making keyboard navigation difficult.
**Action:** When adding new interactive elements like buttons, always include focus-visible utility classes (e.g. `focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none`) to ensure accessibility for keyboard users.

## 2026-06-08 - [Keyboard Focus States]
**Learning:** Tailwind CSS reset completely removes default focus outlines from buttons. When replacing native browser focus, we must actively add `focus-visible:ring-*` styles to maintain keyboard navigation accessibility, especially on custom icon-only or text-only buttons that don't have built-in visual state changes.
**Action:** Always check `button` and `a` tags for `focus-visible` styling when reviewing UI components, particularly in custom Next.js/Tailwind codebases. Ensure `aria-expanded` is used for toggles and `aria-label` for icon-only buttons.
