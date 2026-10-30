import { create } from 'zustand'

/** Global host for card-level overlays so cards stay lightweight. */
export const useCardActions = create((set) => ({
  serve: null, // need | bundle being served
  reneed: null,
  reject: null, // { item, as: 'partner' | 'admin' | 'deal' }
  approve: null,
  quickView: null,
  assign: null,
  report: null,
  review: null,
  comments: null, // item whose comment thread is open
  verifyPartner: null, // { item, mode: 'become' | 'pending' }
  open: (key, value) => set({ [key]: value }),
  close: (key) => set({ [key]: null }),
}))

export const detailPath = (item, { owner } = {}) => {
  if (!item) return '/'
  if (item.kind === 'deal') return `/deals/${item.slug}`
  if (item.kind === 'partner') return `/partners/${item.handle}`
  if (item.kind === 'bundle') return owner ? `/app/needer/bundles/${item.code}` : `/bundles/${item.code}`
  return owner ? `/app/needer/needs/${item.code}` : `/needs/${item.code}`
}
