import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from '@/lib/storage'

export const DEFAULT_JOBS = [
  { id: 'job-react', title: 'Senior React Engineer', team: 'Engineering', location: 'Kigali', type: 'Hybrid', description: 'Build the web app that thousands of Needers and Partners use every day.', open: true },
  { id: 'job-moderator', title: 'Trust & Safety Moderator (RW/EN)', team: 'Operations', location: 'Kigali', type: 'On-site', description: 'Review requests, messages and reports in Kinyarwanda and English.', open: true },
  { id: 'job-success', title: 'Partner Success Lead', team: 'Growth', location: 'Kigali', type: 'On-site', description: 'Help new Partners get verified, listed and booked.', open: true },
  { id: 'job-agent', title: 'Field Agent Coordinator', team: 'Community', location: 'Musanze', type: 'Field', description: 'Lead our community agents across the Northern Province.', open: true },
]

export const JOB_TYPES = ['On-site', 'Hybrid', 'Remote', 'Field', 'Part-time']

export const useCareers = create(
  persist(
    (set) => ({
      jobs: DEFAULT_JOBS,
      save: (job) => set((s) => {
        const id = job.id ?? `job-${Date.now().toString(36)}`
        const next = { ...job, id }
        return { jobs: s.jobs.some((j) => j.id === id) ? s.jobs.map((j) => (j.id === id ? next : j)) : [...s.jobs, next] }
      }),
      toggle: (id) => set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, open: !j.open } : j)) })),
      remove: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),
      reset: () => set({ jobs: DEFAULT_JOBS }),
    }),
    { name: 'needibi-careers', storage: createJSONStorage(() => safeStorage) },
  ),
)
