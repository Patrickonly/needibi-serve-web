import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from '@/lib/storage'

export const DEFAULT_GROUPS = [
  { id: 'products', name: 'Products', categories: ['agriculture', 'electronics', 'food-catering', 'home-furniture'] },
  { id: 'services', name: 'Services', categories: ['home-furniture', 'beauty', 'health', 'services', 'travel-tourism', 'custom-solutions'] },
  { id: 'properties', name: 'Properties', categories: ['real-estate'] },
  { id: 'vehicles', name: 'Vehicles', categories: ['automotive'] },
  { id: 'professionals', name: 'Professionals', categories: ['professional-talent', 'education'] },
]

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const useCategoryGroups = create(
  persist(
    (set) => ({
      groups: DEFAULT_GROUPS,
      add: (name) => set((s) => {
        const id = slugify(name) || `group-${Date.now().toString(36)}`
        if (!name.trim() || s.groups.some((g) => g.id === id)) return s
        return { groups: [...s.groups, { id, name: name.trim(), categories: [] }] }
      }),
      rename: (id, name) => set((s) => (name.trim() ? { groups: s.groups.map((g) => (g.id === id ? { ...g, name: name.trim() } : g)) } : s)),
      remove: (id) => set((s) => ({ groups: s.groups.filter((g) => g.id !== id) })),
      toggleCategory: (id, slug) => set((s) => ({
        groups: s.groups.map((g) => (g.id !== id ? g : { ...g, categories: g.categories.includes(slug) ? g.categories.filter((c) => c !== slug) : [...g.categories, slug] })),
      })),
      reset: () => set({ groups: DEFAULT_GROUPS }),
    }),
    { name: 'needibi-category-groups', storage: createJSONStorage(() => safeStorage) },
  ),
)

export const groupForCategory = (groups, slug) => groups.find((g) => g.categories.includes(slug))?.id ?? ''
