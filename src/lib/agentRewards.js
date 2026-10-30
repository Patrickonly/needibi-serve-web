import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from '@/lib/storage'

export const DEFAULT_REWARDS = {
  neederBookingPct: 2,
  partnerDealPct: 1.5,
  assistedPayoutCap: 50000,
  referralSignup: 500,
  referralVerified: 1500,
  referralFirstTransaction: 3000,
  partnerOnboarded: 5000,
  tiers: [
    { id: 'bronze', name: 'Bronze', target: 0, bonusPct: 0 },
    { id: 'silver', name: 'Silver', target: 20, bonusPct: 10 },
    { id: 'gold', name: 'Gold', target: 50, bonusPct: 25 },
  ],
  minPayout: 5000,
}

export const useAgentRewards = create(
  persist(
    (set) => ({
      ...DEFAULT_REWARDS,
      update: (patch) => set(patch),
      updateTier: (id, patch) => set((s) => ({ tiers: s.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      reset: () => set(DEFAULT_REWARDS),
    }),
    { name: 'needibi-agent-rewards', storage: createJSONStorage(() => safeStorage) },
  ),
)

export const tierFor = (tiers, conversions) => [...tiers].sort((a, b) => b.target - a.target).find((t) => conversions >= t.target) ?? tiers[0]
