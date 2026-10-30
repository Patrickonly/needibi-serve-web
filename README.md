# Needibi Serve — Web (React + JSX)

*Get Your Needs Served.* A request-driven marketplace for Rwanda: Needers describe what they need, KYC-verified Partners serve offers, payment is held in escrow and released when the Needer confirms.

This repo is the complete front end from the Master Design & Build Prompt v2.1. Every route runs against a mocked API (MSW) seeded with realistic Rwandan data.

## Run it

```bash
npm install --legacy-peer-deps   # one optional peer of @hookform/resolvers conflicts; safe to ignore
npm run dev                      # http://localhost:5173
npm run build && npm run preview # production build on http://localhost:4173
npm test                         # Vitest unit tests
npm run lint                     # oxlint
```

### Demo accounts

Use the demo buttons on `/auth/login` or in any sign-in prompt. For the full form, sign in with any of the emails below, password `needibi123`, then OTP `123456`.

| Account | Roles | Lands on |
|---|---|---|
| Aline Mukamana (`aline@example.rw`) | Needer | `/app/needer/dashboard` |
| Diane Uwase — CleanPro Rwanda (`diane@cleanpro.rw`) | Partner + Needer | `/app/partner/home` |
| Eric Niyonzima (`eric@example.rw`) | Agent + Needer | `/app/agent/home` |
| Patrick Kayitare (`patrick@needibi.com`) | Admin | `/admin` |

Five wrong passwords lock sign-in for 60 seconds, so you can try the lockout.

## Stack

React 19 · Vite 8 · **JavaScript/JSX only (no TypeScript)** · Tailwind CSS 4 with design tokens · React Router 7 · TanStack Query 5 · TanStack Table 8 · Zustand · React Hook Form + Zod · Radix UI primitives · Recharts · i18next (EN / RW / FR / SW) · lucide-react · MSW 2.

## Structure

```
src/
  app/            App providers + router (route-level code splitting)
  design-system/  tokens-only primitives: Button, Badge, Form, Overlay, Menu, Feedback, Media, Card, Stepper, Logo
  components/
    cards/        NeedCard, BundleCard, DealCard, PartnerCard, OfferCard, ActionHost (Serve drawer, Re-need, Reject…)
    tables/       DataTable, Pagination, column helpers
    feed/         InfiniteFeed, Carousel
    forms/        MoneyInput, PhoneInput, FileUploader, VoiceRecorder, LocationFields
    chat/         three-pane private chat with pinned Price panel
    payments/     EscrowBanner, PaymentMethodPicker, FeeBreakdown, Receipt
    charts/       Recharts wrappers (token colours)
    layout/       PublicHeader, Footer, BottomTabBar, AppShell, role sidebars (nav.js)
    messages/     moderated public Messages
  features/       public · auth · needer · partner · agent · admin · shared
  lib/            api client, stores, permissions (<Can>), formatters, contact filter, i18n, status map
  locales/        en, rw, fr, sw
  mocks/          seed.js (deterministic data) + handlers.js (generic paginated API + flows)
docs/             DESIGN_DECISIONS.md, ACCESSIBILITY.md
```

## Mock API

`GET /api/r/:resource?page&pageSize&sort&q&tab&tabField&<field>=a,b&<field>_gte=…` returns `{ data, meta: { page, pageSize, total, totalPages, counts } }`. This one endpoint serves every management table. Special flows have their own handlers: Serve with atomic slots (409 when full), Re-need eligibility, moderated Messages (422 for contact details), payments with a MoMo approval wait, login with lockout, and OTP.

Data volumes: 140 Needs, 40 Bundles, 80 Deals, 30 Partners, 1,240 payments, 640 audit logs, and more. MSW runs in production builds too, until a real backend replaces it (`src/main.jsx`).
