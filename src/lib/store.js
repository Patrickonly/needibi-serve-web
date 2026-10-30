import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from './storage'

export const DEMO_ACCOUNTS = [
  {
    id: 'u-aline', name: 'Aline Mukamana', firstName: 'Aline', email: 'aline@example.rw',
    roles: ['needer'], district: 'Gasabo', sector: 'Kimihurura', verified: true,
    avatarHue: 18,
  },
  {
    id: 'p-cleanpro', name: 'Diane Uwase', firstName: 'Diane', email: 'diane@cleanpro.rw',
    roles: ['partner', 'needer'], partnerId: 'pt-cleanpro', partnerName: 'CleanPro Rwanda',
    district: 'Kicukiro', sector: 'Niboye', verified: true, avatarHue: 150,
  },
  {
    id: 'u-eric', name: 'Eric Niyonzima', firstName: 'Eric', email: 'eric@example.rw',
    roles: ['agent', 'needer'], agentCode: 'AG-ERIC24', district: 'Nyarugenge', sector: 'Nyamirambo',
    verified: true, avatarHue: 210,
  },
  {
    id: 'u-admin', name: 'Patrick Kayitare', firstName: 'Patrick', email: 'patrick@needibi.com',
    roles: ['admin'], staffRole: 'Super admin', district: 'Gasabo', verified: true, avatarHue: 260,
  },
]

export const ROLE_HOME = {
  needer: '/app/needer/dashboard',
  partner: '/app/partner/home',
  agent: '/app/agent/home',
  admin: '/admin',
}

export const ROLE_LABEL = {
  visitor: 'Visitor', needer: 'Customer', partner: 'Service provider', agent: 'Agent', admin: 'Admin',
}

export const useAuth = create(
  persist(
    (set, get) => ({
      user: null,
      activeRole: 'visitor',
      assistedBy: null,
      login: (user, role) => set({ user, activeRole: role ?? user.roles[0], assistedBy: null }),
      logout: () => set({ user: null, activeRole: 'visitor', assistedBy: null }),
      startAssist: (client, role, to) => {
        const { user, activeRole, assistedBy } = get()
        if (!user || assistedBy) return
        set({ user: { ...client, roles: [role] }, activeRole: role, assistedBy: { user, activeRole }, assistTarget: to ?? null })
      },
      clearAssistTarget: () => set({ assistTarget: null }),
      endAssist: () => {
        const { assistedBy } = get()
        if (assistedBy) set({ user: assistedBy.user, activeRole: assistedBy.activeRole, assistedBy: null, assistTarget: null })
      },
      switchRole: (role) => {
        if (get().user?.roles.includes(role)) set({ activeRole: role })
      },
    }),
    { name: 'ns-auth', storage: createJSONStorage(() => safeStorage) },
  ),
)

export const useUI = create(
  persist(
    (set) => ({
      theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
      language: 'en',
      locationSet: false,
      country: '',
      countryName: '',
      district: '',
      sector: '',
      province: '',
      cell: '',
      village: '',
      street: '',
      sidebarCollapsed: false,
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      toggleTheme: () =>
        set((s) => {
          const theme = s.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.setAttribute('data-theme', theme)
          return { theme }
        }),
      setLanguage: (language) => set({ language }),
      setLocation: (district, sector, details = {}) => set({ locationSet: Boolean(details.country || district || sector), country: details.country ?? '', countryName: details.countryName ?? '', district, sector, province: details.province ?? '', cell: details.cell ?? '', village: details.village ?? '', street: details.street ?? '' }),
      setEnabledCountries: (enabledCountries) => set({ enabledCountries }),
      enabledCountries: ['RW'],
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'ns-ui',
      storage: createJSONStorage(() => safeStorage),
      version: 2,
      migrate: (persisted) => {
        if (typeof persisted?.locationSet === 'boolean') return persisted
        return { ...persisted, locationSet: false, country: '', countryName: '', district: '', sector: '', province: '', cell: '', village: '', street: '', enabledCountries: ['RW'] }
      },
      partialize: (s) => ({ theme: s.theme, language: s.language, locationSet: s.locationSet, country: s.country, countryName: s.countryName, district: s.district, sector: s.sector, province: s.province, cell: s.cell, village: s.village, street: s.street, enabledCountries: s.enabledCountries, sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
)

/** Sign-in gate: any gated action by a guest opens the modal and returns to the same item afterwards. */
export const useGate = create((set) => ({
  open: false,
  reason: '',
  returnTo: null,
  show: (reason = '', returnTo = null) => set({ open: true, reason, returnTo: returnTo ?? window.location.pathname + window.location.search }),
  close: () => set({ open: false }),
}))

let toastId = 0
export const useToasts = create((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, tone: 'success', duration: 5000, ...toast }] }))
    const duration = toast.duration ?? 5000
    if (duration > 0) setTimeout(() => get().dismiss(id), duration)
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = (message, opts = {}) => useToasts.getState().push({ message, ...opts })

/** Saved / loved items for the signed-in user (local only in the mock). */
export const useEngagement = create(
  persist(
    (set) => ({
      saved: {},
      loved: {},
      following: {},
      hidden: {},
      toggle: (bucket, key) =>
        set((s) => {
          const next = { ...s[bucket] }
          if (next[key]) delete next[key]
          else next[key] = Date.now()
          return { [bucket]: next }
        }),
    }),
    { name: 'ns-engagement', storage: createJSONStorage(() => safeStorage) },
  ),
)
