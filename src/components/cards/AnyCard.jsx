import { NeedCard, BundleCard } from './NeedCard'
import { DealCard } from './DealCard'
import { PartnerCard } from './PartnerCard'

/** Picks the right card for a mixed-feed item. */
export function AnyCard({ item, context }) {
  if (item.kind === 'bundle') return <BundleCard bundle={item} context={context} />
  if (item.kind === 'deal') return <DealCard deal={item} context={context} />
  if (item.kind === 'partner') return <PartnerCard partner={item} />
  return <NeedCard need={item} context={context} />
}

export const CARD_GRID = 'card-stagger grid grid-cols-1 gap-4 sm:grid-cols-2'
// Inside the app shell the content is narrower than the viewport, so size by card width instead
export const APP_CARD_GRID = 'card-stagger grid gap-4 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))]'
