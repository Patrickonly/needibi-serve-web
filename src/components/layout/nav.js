import {
  LayoutGrid, Plus, ClipboardList, Layers, Route, Inbox, CalendarCheck, Signature, Wallet, MessagesSquare, Bookmark,
  RotateCcwClock, Heart, Star, Gavel, LifeBuoy, Bell, User, Settings, House, Send, Briefcase, Globe2, Tag, CalendarDays, Banknote,
  PiggyBank, Clapperboard, Users, IdCard, Award, UserPlus, FolderOpen, ListChecks, Share, Percent, ShieldCheck, Shuffle,
  ShieldAlert, Flag, MessageSquareWarning, Grid, Network, Receipt, Landmark, FileCheck, HandCoins, BadgePercent, Ticket,
  Scale, BadgeCheck, ScrollText, Headset, Megaphone, BookOpen, ChartBar, FileText, Activity, SlidersHorizontal, Gift, KeyRound,
  CreditCard, HandHelping,
} from 'lucide-react'

// counts: keys resolved by the sidebar from live list totals
export const NAV = {
  needer: [
    { group: 'Start here', items: [
      { label: 'Dashboard', to: '/app/needer/dashboard', icon: LayoutGrid },
      { label: 'Post a Need', to: '/app/needer/post', icon: Plus, accent: true },
    ] },
    { group: 'My activity', items: [
      { label: 'My Needs', to: '/app/needer/needs', icon: ClipboardList, count: { resource: 'needs', params: { posterId: '$user', statusGroup: 'action_needed' } } },
      { label: 'Bundles', to: '/app/needer/bundles', icon: Layers },
      { label: 'Track progress', to: '/app/needer/tracking', icon: Route },
      { label: 'Offers', to: '/app/needer/offers', icon: Inbox, count: { resource: 'offers', params: { neederId: '$user', status: 'submitted,revised' } } },
      { label: 'Bookings', to: '/app/needer/bookings', icon: CalendarCheck },
      { label: 'My agreements', to: '/app/needer/agreements', icon: Signature },
      { label: 'Payments', to: '/app/needer/payments', icon: Wallet },
    ] },
    { group: 'Saved & messages', items: [
      { label: 'Messages', to: '/app/needer/messages', icon: MessagesSquare, count: { static: 3 } },
      { label: 'Saved', to: '/app/needer/saved', icon: Bookmark },
      { label: 'Past requests', to: '/app/needer/history', icon: RotateCcwClock },
      { label: 'Following', to: '/app/needer/following', icon: Heart },
      { label: 'Reviews', to: '/app/needer/reviews', icon: Star },
    ] },
    { group: 'Account & help', items: [
      { label: 'Disputes', to: '/app/needer/disputes', icon: Gavel },
      { label: 'Appeals', to: '/app/needer/appeals', icon: Scale },
      { label: 'Support', to: '/app/needer/support', icon: LifeBuoy },
      { label: 'Notifications', to: '/app/needer/notifications', icon: Bell, count: { static: 6 } },
      { label: 'Profile', to: '/app/needer/profile', icon: User },
      { label: 'Settings', to: '/app/needer/settings', icon: Settings },
    ] },
  ],
  partner: [
    { group: 'Work', items: [
      { label: 'Home', to: '/app/partner/home', icon: House },
      { label: 'Requests', to: '/app/partner/requests', icon: Send, count: { resource: 'needs', params: { matchedPartnerIds: '$partner', status: 'published,matching,offers_received' } } },
      { label: 'My Offers', to: '/app/partner/offers', icon: Inbox },
      { label: 'Jobs in progress', to: '/app/partner/jobs', icon: Briefcase, count: { resource: 'jobs', params: { partnerId: '$partner', stage: 'active' } } },
    ] },
    { group: 'My services', items: [
      { label: 'My Deals', to: '/app/partner/deals', icon: Tag },
      { label: 'Bookings', to: '/app/partner/bookings', icon: CalendarDays },
    ] },
    { group: 'Money', items: [
      { label: 'Earnings', to: '/app/partner/earnings', icon: PiggyBank },
      { label: 'Get paid', to: '/app/partner/payouts', icon: Banknote },
      { label: 'Agreements', to: '/app/partner/agreements', icon: Signature },
    ] },
    { group: 'People & profile', items: [
      { label: 'Messages', to: '/app/partner/messages', icon: MessagesSquare, count: { static: 4 } },
      { label: 'Reviews', to: '/app/partner/reviews', icon: Star },
      { label: 'My profile', to: '/app/partner/studio', icon: Clapperboard },
      { label: 'Partner groups', to: '/app/partner/guilds', icon: Users },
    ] },
    { group: 'Account & help', items: [
      { label: 'Verify my account', to: '/app/partner/verification', icon: IdCard },
      { label: 'My plan', to: '/app/partner/plan', icon: Award },
      { label: 'Disputes', to: '/app/partner/disputes', icon: Gavel },
      { label: 'Appeals', to: '/app/partner/appeals', icon: Scale },
      { label: 'Support', to: '/app/partner/support', icon: LifeBuoy },
      { label: 'Notifications', to: '/app/partner/notifications', icon: Bell },
    ] },
  ],
  agent: [
    { group: 'Today', items: [{ label: 'Home', to: '/app/agent/home', icon: House }] },
    { group: 'People I help', items: [
      { label: 'Act for someone', to: '/app/agent/assist', icon: HandHelping, accent: true },
      { label: 'People needing help', to: '/app/agent/needers', icon: UserPlus },
      { label: 'Partners I register', to: '/app/agent/partners', icon: Briefcase },
    ] },
    { group: 'Tasks & earnings', items: [
      { label: 'My cases', to: '/app/agent/cases', icon: FolderOpen, count: { resource: 'cases', params: { agentId: '$user' } } },
      { label: 'Tasks', to: '/app/agent/follow-ups', icon: ListChecks, count: { resource: 'followups', params: { agentId: '$user', status: 'open,overdue' } } },
      { label: 'People I referred', to: '/app/agent/referrals', icon: Share },
      { label: 'My rewards', to: '/app/agent/commissions', icon: Percent },
    ] },
    { group: 'Account & help', items: [
      { label: 'Messages', to: '/app/agent/messages', icon: MessagesSquare },
      { label: 'Support', to: '/app/agent/support', icon: LifeBuoy },
      { label: 'Notifications', to: '/app/agent/notifications', icon: Bell },
      { label: 'Profile', to: '/app/agent/profile', icon: User },
    ] },
  ],
  admin: [
    { group: 'Start here', items: [{ label: 'Home', to: '/admin', icon: LayoutGrid, end: true }] },
    { group: 'People', items: [
      { label: 'All users', to: '/admin/users', icon: Users },
      { label: 'Customers', to: '/admin/needers', icon: User },
      { label: 'Service providers', to: '/admin/partners', icon: Briefcase },
      { label: 'Agents', to: '/admin/agents', icon: UserPlus },
      { label: 'Verify accounts', to: '/admin/verification', icon: IdCard, count: { resource: 'verifications', params: { status: 'pending' } } },
      { label: 'Access settings', to: '/admin/roles', icon: KeyRound },
    ] },
    { group: 'Requests', items: [
      { label: 'Waiting for review', to: '/admin/review-queue', icon: ShieldCheck, count: { resource: 'needs', params: { status: 'submitted,under_review' } } },
      { label: 'All requests', to: '/admin/needs', icon: ClipboardList },
      { label: 'Bundles', to: '/admin/bundles', icon: Layers },
      { label: 'Deals', to: '/admin/deals', icon: Tag, count: { resource: 'deals', params: { status: 'pending' } } },
      { label: 'Assign requests', to: '/admin/matching', icon: Shuffle },
    ] },
    { group: 'Moderation', items: [
      { label: 'Messages', to: '/admin/moderation/messages', icon: MessageSquareWarning, count: { resource: 'messages', params: { status: 'pending' } } },
      { label: 'Reports', to: '/admin/moderation/reports', icon: Flag },
      { label: 'Reviews to check', to: '/admin/moderation/reviews', icon: Star },
      { label: 'Blocked words', to: '/admin/moderation/terms', icon: ShieldAlert },
    ] },
    { group: 'Catalogue', items: [
      { label: 'Categories', to: '/admin/categories', icon: Grid },
      { label: 'Main categories', to: '/admin/category-groups', icon: Grid },
      { label: 'Guilds', to: '/admin/guilds', icon: Network },
    ] },
    { group: 'Payments & fees', items: [
      { label: 'Payments', to: '/admin/payments', icon: CreditCard },
      { label: 'Money held safely', to: '/admin/escrow', icon: Landmark },
      { label: 'Payment proofs', to: '/admin/proofs', icon: FileCheck, count: { resource: 'proofs', params: { state: 'verifying' } } },
      { label: 'Pay providers', to: '/admin/payouts', icon: Banknote },
      { label: 'Pay agents', to: '/admin/commissions', icon: Banknote },
      { label: 'Payment accounts', to: '/admin/payment-accounts', icon: Landmark },
      { label: 'Fees & commissions', to: '/admin/fees', icon: HandCoins },
      { label: 'Agent rewards', to: '/admin/agent-rewards', icon: Gift },
      { label: 'Provider plans (subscriptions)', to: '/admin/subscriptions', icon: Receipt },
      { label: 'Promo codes', to: '/admin/promo-codes', icon: BadgePercent },
      { label: 'Referrals', to: '/admin/referrals', icon: Gift },
    ] },
    { group: 'Safety & support', items: [
      { label: 'Disputes', to: '/admin/disputes', icon: Gavel, count: { resource: 'disputes', params: { status: 'open' } } },
      { label: 'Appeals', to: '/admin/appeals', icon: Scale },
      { label: 'Badges', to: '/admin/badges', icon: BadgeCheck },
      { label: 'Contracts', to: '/admin/contracts', icon: ScrollText },
    ] },
    { group: 'Support', items: [
      { label: 'Tickets', to: '/admin/tickets', icon: Ticket, count: { resource: 'tickets', params: { status: 'open,escalated' } } },
      { label: 'Inbox', to: '/admin/inbox', icon: Headset },
    ] },
    { group: 'Content', items: [
      { label: 'Home merchandising', to: '/admin/home-merch', icon: Megaphone },
      { label: 'Careers', to: '/admin/careers', icon: Briefcase },
      { label: 'Help Centre', to: '/admin/help', icon: BookOpen },
    ] },
    { group: 'Reports & Logs', items: [
      { label: 'Reports', to: '/admin/reports', icon: ChartBar },
      { label: 'Audit logs', to: '/admin/audit-logs', icon: FileText },
      { label: 'Activity logs', to: '/admin/activity-logs', icon: Activity },
    ] },
    { group: 'Settings', items: [{ label: 'Platform settings', to: '/admin/settings', icon: SlidersHorizontal }, { label: 'Languages & countries', to: '/admin/locales', icon: Globe2 }] },
  ],
}
