# Accessibility report (WCAG 2.2 AA)

Status: built to AA from the start, checked manually and with automated smoke tests. Not yet audited with axe or Lighthouse — run both before release.

## In place

| Area | What we did |
|---|---|
| Contrast | All text tokens meet 4.5:1 on their backgrounds in light and dark. Status text uses dedicated `*-fg` tokens on tinted backgrounds. White text on the blue action colour is 6.7:1. |
| Colour alone | Every status, urgency, priority and escrow state is a badge with icon and text. Slot meters also say "2 of 3" or "Offers full". Charts have legends with values. |
| Keyboard | Everything is reachable with Tab. Radix handles focus trapping and return for dialogs, drawers, menus and popovers. Search suggestions support ↑/↓/Enter/Esc. The OTP inputs auto-advance and handle Backspace. Bundle items can be reordered with buttons as well as drag. |
| Focus | 2 px blue focus ring with offset on every interactive element. "Skip to content" link in both layouts. |
| Names & roles | Icon buttons have `aria-label` (with counts, e.g. "Love (12)"). Toggles use `aria-pressed`. Segmented controls and choice cards use `radiogroup`/`radio`. Sortable headers expose `aria-sort`. Pagination sits in `nav[aria-label=Pagination]` with `aria-current="page"`. |
| Live regions | Toasts, the table result counter, the Message composer warning, chat messages, the OTP timer and the MoMo countdown are announced. |
| Forms | Every field has a label and hint/error linked with `aria-describedby`; invalid fields get `aria-invalid`. Rejections always ask for a reason. Destructive actions confirm first. |
| Disabled-with-reason | Locked actions (e.g. Chat) stay focusable and show a tooltip explaining why. |
| Media | Videos note available captions. Voice notes have a "Show transcript" option. Decorative illustrations are `aria-hidden`. |
| Motion | `prefers-reduced-motion` disables animations and smooth scrolling. Counters jump straight to the final value. |
| Touch & layout | Primary controls are 44 px high (36 px for secondary icon buttons inside cards). No horizontal scroll at 360 px (tested at 360 and 390). |
| Language | `<html lang>` follows the selected language. |

## Known gaps

- Some secondary icon buttons inside cards are 36 × 36 px. That passes WCAG 2.2 target size (24 px) but is below the 44 px touch guideline.
- Translations cover the shell and key actions. Page body copy is English only.
- Charts have legends and an image label, but no data-table alternative.
- Not yet tested with NVDA, VoiceOver or TalkBack.
