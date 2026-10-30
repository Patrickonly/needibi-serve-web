# Design decisions

Decisions taken where the Master Prompt v2.1 was silent, ambiguous or in conflict with the project setup. Each entry: **decision** — why.

## Stack

- **JavaScript/JSX, not TypeScript.** — Project owner's instruction. The Section 11 types are expressed as data shapes in `src/mocks/seed.js`.
- **Vite SPA, not Next.js.** — The repo was already a Vite app. Public pages are client-rendered; for SEO, `/needs`, `/deals` and `/bundles` render crawlable page links under the infinite feed. Moving public routes to SSR is the main follow-up if search traffic matters.
- **React 19 (spec says 18).** — Already installed; nothing in the spec depends on 18.
- **Library versions pinned to the spec's majors:** TanStack Table 8, MSW 2, @hookform/resolvers 5. Newer majors were available but are untested against this code.
- **No framer-motion.** — All motion is 150–250 ms CSS (`animate-pop`, `slide-in`, shimmer) and is disabled under `prefers-reduced-motion`.
- **Storybook not set up.** — Components are isolated and prop-driven, ready for stories. This is the largest open deliverable (see "Not done").

## Brand & tokens — palette rationale (v2.x: designer chooses the colours)

**Navy structure · Trust Blue action · Green trust.** Light theme is the default; dark is opt-in from the theme toggle and remembered.

| Role | Token | Light | Why |
|---|---|---|---|
| Primary (structure: header, sidebar, headings) | `--primary-900` | `#0B1F3A` navy | Feels safe and institutional, like a bank, which suits a platform holding money in escrow. Keeps strong contrast in bright outdoor light. |
| Action (Post a Need, Serve, Book, Pay, current page) | `--action` / `--action-600` | `#1D4ED8` blue, white text 6.7:1 | One unmistakable, clickable colour. Blue on navy reads as a single trustworthy family instead of competing hues. It is used only for primary actions and active states. |
| Trust (Verified, Escrow, Paid, Completed) | `--trust-600/700` | `#16A34A` / `#15803D` green | Reserved for trust signals, never decoration or buttons, so "safe" always means the same thing. |
| Info | `--info-600/700` | teal `#0D9488` / `#0F766E` | Kept clearly apart from the blue action colour, so an info badge never looks clickable. |
| Warning | `--warn-500/700` | burnt orange `#EA580C` / `#C2410C` | No yellow, as requested. Orange still escalates clearly towards danger on the urgency scale (grey → teal → orange → red). |
| Danger | `--danger-600` | `#DC2626` red | Disputed, Failed, Rejected, Urgent. |

- **Changed on request:** the earlier orange/yellow action colour and yellow warnings are gone, and the action colour is now blue. Payment-method chips no longer use brand yellows; they are neutral chips with the name.
- **No gradients anywhere.** Illustrations, the app-download banner, voice-note tiles and the skeleton loader all use flat fills. The loader is a flat opacity pulse.
- **Originality:** navy + blue + green does not copy Amazon (black/orange), Alibaba (orange), Jumia (orange/black) or MTN (yellow).
- **Accessibility:** every text token meets 4.5:1 on its background in both themes. White on action blue is 6.7:1 (light) and 5.2:1 (dark). Solid warning fills use `--warn-700` so white text passes.
- **Token names follow the prompt's roles:** `primary-*`, `action-*`, `trust-*`, `info-*`, `warn-*`, `danger-*`, plus semantic `bg`, `surface`, `surface-2`, `border`, `text`, `text-muted`, `focus-ring`. They live only in `src/index.css`; no component holds a colour value.
- **Bundle label** is an outlined blue chip, so NEED (solid navy), BUNDLE (blue outline, stacked-paper card edge) and DEAL (solid green) stay distinct in a mixed feed.
- **Inter Display** is approximated with Inter Variable's optical-size axis. Swap in Inter Display if licensed.
- **Imagery:** there are no real photos yet. Media slots show flat category illustrations in the palette; real photography plugs into `media[].url`.

## Ranking

- **Never rank by popularity alone.** Needs, Bundles and Deals carry a relevance score:
  - Needs and Bundles: urgency, freshness, open offer slots, plus a small, capped popularity term.
  - Deals: rating, verified Partner, level, discount, freshness, plus a capped bookings term.
- "For You", "Best match" (the default Deals sort), Popular Bundles and Recommended all use it. "Most booked" remains as an explicit sort option.

## Cards

- **Need card:** two action rows. Row 1 holds the single filled orange button plus Re-need and Re-request; row 2 holds icon buttons with counts (Message, Love, Save, Share) and ⋯. The single-row layout in the spec doesn't fit at 240 px card width.
- **The primary action depends on the viewer.** Guests and Partners see **Serve**; Needers see **Re-request**, since Needers can't serve. When slots are full, Serve becomes **Notify me** (outline).
- **Distinguishable at a glance:** NEED is a navy label, BUNDLE an orange label with stacked-paper edges and a progress bar, DEAL a green label with price, strikethrough and countdown.
- **Chat 🔒** stays focusable while disabled, so its tooltip explains why ("unlocks once it's confirmed you'll serve").

## Matching & offers (defaults from "Decisions to confirm")

- 3 offer slots per Need; Bundles default to 3 whole-Bundle plus 3 per item.
- Offer slots use **optimistic allocation**: the slot fills immediately, and on a 409 it rolls back and shows "Offers are full".
- Accepting an offer closes only **incompatible offers in the same scope** (same Need, or same Bundle item).
- Re-need publishes instantly unless the user has re-needed more than 3 times in the session, or the source was rejected; then it goes to review.
- Chat: Partners and Admins open it, and Needers can only reply. Contact details unlock after the agreement is signed. Partners only see Needers whose approved requests they serve.
- Admins can create **group chats** for a Bundle (Needer plus 2 or more Partners). The admin inbox shows SLA countdowns per thread (30 min), a breach count and response stats.
- **Notifications are role-specific** and limited to events that need attention, following the role table in section 10.10.

## Tables & feeds

- A single generic list endpoint covers every **[T]** route, and a config map (`features/admin/AdminTables.jsx`) declares the 26 admin tables.
- The URL holds `page`, `size`, `sort` (`sort=none` clears the default), `q`, `tab` and filters. Page size is remembered per table in localStorage, wrapped in try/catch.
- Phone: rows become stacked cards. History-style lists (History, Payments, My activity) use **Load more**; the others use the compact `‹ Page n of N ›` control.
- "Select all N" selects every matching row server-side, and bulk actions receive `{ allMatching, params }`.

## Content & i18n

- The header, navigation, actions, hero, trust copy, journey, table chrome and urgency labels are translated into all four languages. **Page body copy is English only** for now. Strings are ready for extraction; the Kinyarwanda, French and Swahili text needs a native-speaker review.
- **Kinyarwanda number words** count as disguised phone numbers in the contact filter, alongside English and French.

## Not done / follow-ups

1. Storybook stories for each component, and Playwright E2E tests inside the repo. Flows were verified with an external Playwright script against the production build; the repo only has Vitest unit tests.
2. A real backend (permissions are enforced server-side; the UI only hides actions). Realtime (WebSocket) is simulated in chat with a typing indicator and auto-reply.
3. SSR for public pages; image CDN (WebP/AVIF); real photography.
4. Lighthouse not yet measured (target ≥ 90 mobile, a11y ≥ 95).
5. Remaining open decisions from the prompt: agent reward rules and the final privacy matrix. The matrix is editable in `/admin/settings`; the current defaults are a proposal.
