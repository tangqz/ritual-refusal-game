## 2025-05-29 - Added ARIA Label to Wisdom Icon\n**Learning:** The ChatBubble component uses icon-only buttons for interactive elements (like the wisdom card popup) that lack screen reader context.\n**Action:** Ensure all interactive elements relying on emojis or icons have a descriptive aria-label.
## 2026-05-30 - Added Keyboard Focus Ring Styles
**Learning:** Several interactive button components across the application (like LanguageToggle, JourneyMap cards, ChoiceButton) were lacking explicit focus visible styles, making keyboard navigation difficult.
**Action:** When adding new interactive elements like buttons, always include focus-visible utility classes (e.g. `focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none`) to ensure accessibility for keyboard users.
## 2026-06-04 - Keyboard Focus Ring Styles on More Elements
**Learning:** More button components across the application (like in page.tsx, NarrativeIntro.tsx, DebriefPanel.tsx) were lacking explicit focus visible styles, hindering keyboard navigation.
**Action:** Consistently apply `focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none` and appropriate `rounded` classes (e.g., `rounded-lg`) to all custom button elements.
