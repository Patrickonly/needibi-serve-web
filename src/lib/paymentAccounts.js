import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from '@/lib/storage'

export const ACCOUNT_TYPES = {
  momo: { label: 'MTN MoMo Pay', numberLabel: 'Merchant code' },
  airtel: { label: 'Airtel Money', numberLabel: 'Phone number' },
  bank: { label: 'Bank deposit', numberLabel: 'Account number' },
}

// Demo details: admins replace these on the Payment accounts page.
export const DEFAULT_ACCOUNTS = [
  { id: 'momo-1', type: 'momo', provider: 'MTN MoMo Pay', accountName: 'NEEDIBI ONLINE SERVICES LTD', number: '012345', note: '', active: true },
  { id: 'airtel-1', type: 'airtel', provider: 'Airtel Money', accountName: 'NEEDIBI ONLINE SERVICES LTD', number: '0733 000 000', note: '', active: true },
  { id: 'bank-1', type: 'bank', provider: 'Bank of Kigali', accountName: 'NEEDIBI ONLINE SERVICES LTD', number: '000-0000000-00', note: 'Use the reference shown at checkout.', active: true },
]

export const usePaymentAccounts = create(
  persist(
    (set) => ({
      accounts: DEFAULT_ACCOUNTS,
      save: (acc) => set((s) => {
        const id = acc.id ?? `${acc.type}-${Date.now().toString(36)}`
        const next = { ...acc, id }
        const exists = s.accounts.some((a) => a.id === id)
        return { accounts: exists ? s.accounts.map((a) => (a.id === id ? next : a)) : [...s.accounts, next] }
      }),
      toggle: (id) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, active: !a.active } : a)) })),
      duplicate: (id) => set((s) => {
        const i = s.accounts.findIndex((a) => a.id === id)
        if (i < 0) return s
        const src = s.accounts[i]
        const copy = { ...src, id: `${src.type}-${Date.now().toString(36)}`, provider: `${src.provider} (copy)` }
        return { accounts: [...s.accounts.slice(0, i + 1), copy, ...s.accounts.slice(i + 1)] }
      }),
      move: (id, dir) => set((s) => {
        const i = s.accounts.findIndex((a) => a.id === id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= s.accounts.length) return s
        const next = [...s.accounts]
        ;[next[i], next[j]] = [next[j], next[i]]
        return { accounts: next }
      }),
      remove: (id) => set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),
      reset: () => set({ accounts: DEFAULT_ACCOUNTS }),
    }),
    { name: 'needibi-payment-accounts', storage: createJSONStorage(() => safeStorage) },
  ),
)
