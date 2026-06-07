## 2025-05-29 - Added ARIA Label to Wisdom Icon\n**Learning:** The ChatBubble component uses icon-only buttons for interactive elements (like the wisdom card popup) that lack screen reader context.\n**Action:** Ensure all interactive elements relying on emojis or icons have a descriptive aria-label.
## 2026-05-30 - Added Keyboard Focus Ring Styles
**Learning:** Several interactive button components across the application (like LanguageToggle, JourneyMap cards, ChoiceButton) were lacking explicit focus visible styles, making keyboard navigation difficult.
**Action:** When adding new interactive elements like buttons, always include focus-visible utility classes (e.g. `focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none`) to ensure accessibility for keyboard users.
## 2026-06-07 - Added ARIA Label and Focus to Wisdom Popup Close Button
**Learning:** The popup component in `app/game/[scenario]/page.tsx` used a standard `button` tag with an 'X' icon for closing the wisdom popup but lacked an `aria-label` and `focus-visible` styling, making it inaccessible to screen reader and keyboard users.
**Action:** When adding or maintaining modal/popup dismiss buttons, ensure they have descriptive `aria-label`s and proper `focus-visible` ring utility classes (e.g., `focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none`) implemented.
