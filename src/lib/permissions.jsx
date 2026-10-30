import { useAuth } from './store'

// The UI only hides actions — the server re-checks every permission.
export const ROLE_PERMISSIONS = {
  visitor: ['content.view'],
  needer: ['content.view', 'needs.create', 'needs.reneed', 'offers.decide', 'payments.pay', 'reviews.write', 'disputes.raise', 'tickets.create', 'messages.post'],
  partner: ['content.view', 'needs.serve', 'needs.reject', 'chat.start', 'deals.publish', 'jobs.manage', 'payouts.view', 'messages.post', 'messages.approve', 'tickets.create', 'needs.create'],
  agent: ['content.view', 'needs.create.onBehalf', 'partners.onboard', 'cases.assigned', 'chat.start', 'tickets.create', 'messages.post'],
  admin: ['*'],
}

export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] ?? []
  return perms.includes('*') || perms.includes(permission)
}

export function usePermission(permission) {
  const role = useAuth((s) => s.activeRole)
  return hasPermission(role, permission)
}

export function Can({ permission, children, fallback = null }) {
  return usePermission(permission) ? children : fallback
}
