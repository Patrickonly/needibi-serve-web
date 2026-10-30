import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicLayout, AuthLayout } from '@/components/layout/PublicLayout'
import { AppShell } from '@/components/layout/AppShell'
import { RouteError } from '@/features/public/RouteError'

// Route-level code splitting: each feature module loads on first visit.
// A failed page-file fetch (flaky network, idle tab) is retried a few times before the error page can appear.
const retry = async (loader, tries = 4) => {
  for (let i = 0; ; i++) {
    try {
      return await loader()
    } catch (err) {
      if (i >= tries - 1) throw err
      await new Promise((r) => setTimeout(r, 300 * (i + 1)))
    }
  }
}
const L = (loader, name) => lazy(() => retry(loader).then((m) => ({ default: m[name] })))

const pub = () => import('@/features/public/Home')
const boards = () => import('@/features/public/Boards')
const details = () => import('@/features/public/Details')
const info = () => import('@/features/public/Info')
const auth = () => import('@/features/auth/Auth')
const needer = () => import('@/features/needer/Needer')
const neederFlows = () => import('@/features/needer/Flows')
const post = () => import('@/features/needer/PostNeed')
const postWizard = () => import('@/features/needer/PostWizard')
const bundleWizard = () => import('@/features/needer/BundleWizard')
const shared = () => import('@/features/shared/Shared')
const chat = () => import('@/components/chat/Chat')
const partner = () => import('@/features/partner/Partner')
const agent = () => import('@/features/agent/Agent')
const admin = () => import('@/features/admin/Admin')
const adminTables = () => import('@/features/admin/AdminTables')
const adminConfig = () => import('@/features/admin/AdminConfig')
const adminLocales = () => import('@/features/admin/Locales')

const P = {
  Home: L(pub, 'Home'),
  NeedsBoard: L(boards, 'NeedsBoard'),
  BundlesGallery: L(boards, 'BundlesGallery'),
  DealsBoard: L(boards, 'DealsBoard'),
  Categories: L(boards, 'CategoriesPage'),
  Category: L(boards, 'CategoryPage'),
  Partners: L(boards, 'PartnersPage'),
  Search: L(boards, 'SearchPage'),
  Social: L(boards, 'SocialPage'),
  NeedDetail: L(details, 'NeedDetail'),
  BundleDetail: L(details, 'BundleDetail'),
  DealDetail: L(details, 'DealDetail'),
  PartnerProfile: L(details, 'PartnerProfile'),
  HowItWorks: L(info, 'HowItWorks'),
  BecomePartner: L(info, 'BecomePartner'),
  BecomeAgent: L(info, 'BecomeAgent'),
  Pricing: L(info, 'Pricing'),
  TrustSafety: L(info, 'TrustSafety'),
  About: L(info, 'About'),
  Contact: L(info, 'Contact'),
  Careers: L(info, 'Careers'),
  Help: L(info, 'HelpCentre'),
  HelpArticle: L(info, 'HelpArticle'),
  Faq: L(info, 'FaqPage'),
  Manual: L(info, 'ManualPage'),
  Legal: L(info, 'LegalPage'),
  PublicRequest: L(info, 'PublicRequest'),
  NotFound: L(info, 'NotFound'),
  ServerError: L(info, 'ServerError'),
  Maintenance: L(info, 'Maintenance'),
}
const A = {
  Login: L(auth, 'Login'),
  Register: L(auth, 'Register'),
  Otp: L(auth, 'Otp'),
  Forgot: L(auth, 'Forgot'),
  Reset: L(auth, 'Reset'),
  ChooseRole: L(auth, 'ChooseRole'),
  PartnerOnboarding: L(auth, 'PartnerOnboarding'),
}
const N = {
  Dashboard: L(needer, 'NeederDashboard'),
  MyNeeds: L(needer, 'MyNeeds'),
  NeedOwner: L(neederFlows, 'NeedOwnerDetail'),
  Bundles: L(needer, 'MyBundles'),
  BundleOwner: L(neederFlows, 'BundleOwnerDetail'),
  Tracking: L(needer, 'Tracking'),
  Offers: L(needer, 'NeederOffers'),
  Bookings: L(needer, 'NeederBookings'),
  Agreements: L(shared, 'AgreementsPage'),
  AgreementViewer: L(shared, 'AgreementViewer'),
  Payments: L(needer, 'NeederPayments'),
  Checkout: L(neederFlows, 'Checkout'),
  Saved: L(needer, 'Saved'),
  History: L(needer, 'HistoryPage'),
  Following: L(needer, 'Following'),
  Reviews: L(needer, 'NeederReviews'),
  Disputes: L(shared, 'DisputesPage'),
  DisputeDetail: L(shared, 'DisputeDetail'),
  Appeals: L(shared, 'AppealsPage'),
  Support: L(shared, 'SupportPage'),
  Notifications: L(shared, 'NotificationsPage'),
  Profile: L(needer, 'NeederProfile'),
  Settings: L(shared, 'SettingsPage'),
  Post: L(postWizard, 'PostNeed'),
  PostSuccess: L(post, 'PostSuccess'),
  BundleBuilder: L(bundleWizard, 'BundleBuilder'),
  Messages: L(chat, 'ChatInbox'),
}
const PT = {
  Home: L(partner, 'PartnerHome'),
  Requests: L(partner, 'PartnerRequests'),
  Offers: L(partner, 'PartnerOffers'),
  Jobs: L(partner, 'PartnerJobs'),
  Deals: L(partner, 'PartnerDeals'),
  DealEditor: L(partner, 'DealEditor'),
  Bookings: L(partner, 'PartnerBookings'),
  Earnings: L(partner, 'PartnerEarnings'),
  Payouts: L(partner, 'PartnerPayouts'),
  Reviews: L(partner, 'PartnerReviews'),
  Studio: L(partner, 'PartnerStudio'),
  Guilds: L(partner, 'PartnerGuilds'),
  Verification: L(partner, 'PartnerVerification'),
  Plan: L(partner, 'PartnerPlan'),
}
const AG = {
  Home: L(agent, 'AgentHome'),
  Needers: L(agent, 'AgentNeeders'),
  Partners: L(agent, 'AgentPartners'),
  Assist: L(agent, 'AgentAssist'),
  Cases: L(agent, 'AgentCases'),
  FollowUps: L(agent, 'AgentFollowUps'),
  Referrals: L(agent, 'AgentReferrals'),
  Commissions: L(agent, 'AgentCommissions'),
  Profile: L(agent, 'AgentProfile'),
}
const AD = {
  Overview: L(admin, 'AdminOverview'),
  ReviewQueue: L(admin, 'ReviewQueue'),
  Roles: L(adminConfig, 'RolesMatrix'),
  Matching: L(adminConfig, 'MatchingSettings'),
  Fees: L(adminConfig, 'FeesPage'),
  PaymentAccounts: L(adminConfig, 'PaymentAccountsPage'),
  CareersAdmin: L(adminConfig, 'CareersAdminPage'),
  Locales: L(adminLocales, 'LocalesPage'),
  Subscriptions: L(adminConfig, 'SubscriptionsPage'),
  Badges: L(adminConfig, 'BadgesPage'),
  BannedTerms: L(adminConfig, 'BannedTerms'),
  CategoryGroups: L(adminConfig, 'CategoryGroupsPage'),
  AgentRewards: L(adminConfig, 'AgentRewardsPage'),
  HomeMerch: L(adminConfig, 'HomeMerch'),
  HelpEditor: L(adminConfig, 'HelpEditor'),
  Reports: L(admin, 'ReportsPage'),
  Settings: L(adminConfig, 'PlatformSettings'),
  ContractEditor: L(adminConfig, 'ContractEditor'),
  Table: L(adminTables, 'AdminTablePage'),
}

const sharedChild = (role) => [
  { path: 'agreements', element: <N.Agreements role={role} /> },
  { path: 'agreements/:code', element: <N.AgreementViewer role={role} /> },
  { path: 'support', element: <N.Support role={role} /> },
  { path: 'notifications', element: <N.Notifications role={role} /> },
  { path: 'messages', element: <N.Messages role={role} /> },
  { path: 'disputes', element: <N.Disputes role={role} /> },
  { path: 'disputes/:code', element: <N.DisputeDetail role={role} /> },
  { path: 'appeals', element: <N.Appeals role={role} /> },
]

const ADMIN_TABLES = ['users', 'needers', 'partners', 'agents', 'verification', 'needs', 'bundles', 'deals', 'moderation/messages', 'moderation/reports', 'moderation/reviews', 'categories', 'guilds', 'payments', 'escrow', 'proofs', 'payouts', 'promo-codes', 'referrals', 'disputes', 'appeals', 'contracts', 'tickets', 'audit-logs', 'activity-logs', 'commissions']

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <P.Home /> },
      { path: 'needs', element: <P.NeedsBoard /> },
      { path: 'needs/:code', element: <P.NeedDetail /> },
      { path: 'bundles', element: <P.BundlesGallery /> },
      { path: 'bundles/:code', element: <P.BundleDetail /> },
      { path: 'deals', element: <P.DealsBoard /> },
      { path: 'deals/:slug', element: <P.DealDetail /> },
      { path: 'categories', element: <P.Categories /> },
      { path: 'categories/:slug', element: <P.Category /> },
      { path: 'partners', element: <P.Partners /> },
      { path: 'partners/:handle', element: <P.PartnerProfile /> },
      { path: 'search', element: <P.Search /> },
      { path: 'social', element: <P.Social /> },
      { path: 'reels', element: <P.Social reels /> },
      { path: 'how-it-works', element: <P.HowItWorks /> },
      { path: 'become-a-partner', element: <P.BecomePartner /> },
      { path: 'become-an-agent', element: <P.BecomeAgent /> },
      { path: 'pricing', element: <P.Pricing /> },
      { path: 'trust-safety', element: <P.TrustSafety /> },
      { path: 'about', element: <P.About /> },
      { path: 'contact', element: <P.Contact /> },
      { path: 'careers', element: <P.Careers /> },
      { path: 'help', element: <P.Help /> },
      { path: 'help/:article', element: <P.HelpArticle /> },
      { path: 'faq', element: <P.Faq /> },
      { path: 'manual', element: <P.Manual /> },
      { path: 'legal/:doc', element: <P.Legal /> },
      { path: 'request', element: <P.PublicRequest /> },
      { path: '500', element: <P.ServerError /> },
      { path: 'maintenance', element: <P.Maintenance /> },
      { path: '*', element: <P.NotFound /> },
    ],
  },
  {
    path: 'auth',
    element: <AuthLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: <A.Login /> },
      { path: 'register', element: <A.Register /> },
      { path: 'otp', element: <A.Otp /> },
      { path: 'forgot', element: <A.Forgot /> },
      { path: 'reset', element: <A.Reset /> },
      { path: 'choose-role', element: <A.ChooseRole /> },
      { path: 'partner-onboarding', element: <A.PartnerOnboarding /> },
    ],
  },
  {
    path: 'app/needer',
    element: <AppShell role="needer" />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <N.Dashboard /> },
      { path: 'post', element: <N.Post /> },
      { path: 'post/success/:code', element: <N.PostSuccess /> },
      { path: 'needs', element: <N.MyNeeds /> },
      { path: 'needs/:code', element: <N.NeedOwner /> },
      { path: 'bundles', element: <N.Bundles /> },
      { path: 'bundles/new', element: <N.BundleBuilder /> },
      { path: 'bundles/:code', element: <N.BundleOwner /> },
      { path: 'tracking', element: <N.Tracking /> },
      { path: 'offers', element: <N.Offers /> },
      { path: 'bookings', element: <N.Bookings /> },
      { path: 'payments', element: <N.Payments /> },
      { path: 'checkout/:code', element: <N.Checkout /> },
      { path: 'saved', element: <N.Saved /> },
      { path: 'history', element: <N.History /> },
      { path: 'following', element: <N.Following /> },
      { path: 'reviews', element: <N.Reviews /> },
      { path: 'profile', element: <N.Profile /> },
      { path: 'settings', element: <N.Settings role="needer" /> },
      ...sharedChild('needer'),
    ],
  },
  {
    path: 'app/partner',
    element: <AppShell role="partner" />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: 'home', element: <PT.Home /> },
      { path: 'requests', element: <PT.Requests /> },
      { path: 'offers', element: <PT.Offers /> },
      { path: 'jobs', element: <PT.Jobs /> },
      { path: 'deals', element: <PT.Deals /> },
      { path: 'deals/new', element: <PT.DealEditor /> },
      { path: 'deals/:slug/edit', element: <PT.DealEditor /> },
      { path: 'bookings', element: <PT.Bookings /> },
      { path: 'earnings', element: <PT.Earnings /> },
      { path: 'payouts', element: <PT.Payouts /> },
      { path: 'reviews', element: <PT.Reviews /> },
      { path: 'profile', element: <PT.Studio /> },
      { path: 'studio', element: <PT.Studio /> },
      { path: 'guilds', element: <PT.Guilds /> },
      { path: 'verification', element: <PT.Verification /> },
      { path: 'plan', element: <PT.Plan /> },
      { path: 'settings', element: <N.Settings role="partner" /> },
      ...sharedChild('partner'),
    ],
  },
  {
    path: 'app/agent',
    element: <AppShell role="agent" />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: 'home', element: <AG.Home /> },
      { path: 'needers', element: <AG.Needers /> },
      { path: 'needers/post', element: <N.Post onBehalf /> },
      { path: 'partners', element: <AG.Partners /> },
      { path: 'assist', element: <AG.Assist /> },
      { path: 'cases', element: <AG.Cases /> },
      { path: 'follow-ups', element: <AG.FollowUps /> },
      { path: 'referrals', element: <AG.Referrals /> },
      { path: 'commissions', element: <AG.Commissions /> },
      { path: 'profile', element: <AG.Profile /> },
      { path: 'settings', element: <N.Settings role="agent" /> },
      ...sharedChild('agent'),
    ],
  },
  {
    path: 'admin',
    element: <AppShell role="admin" />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <AD.Overview /> },
      { path: 'review-queue', element: <AD.ReviewQueue /> },
      { path: 'roles', element: <AD.Roles /> },
      { path: 'matching', element: <AD.Matching /> },
      { path: 'fees', element: <AD.Fees /> },
      { path: 'payment-accounts', element: <AD.PaymentAccounts /> },
      { path: 'careers', element: <AD.CareersAdmin /> },
      { path: 'locales', element: <AD.Locales /> },
      { path: 'subscriptions', element: <AD.Subscriptions /> },
      { path: 'badges', element: <AD.Badges /> },
      { path: 'moderation/terms', element: <AD.BannedTerms /> },
      { path: 'home-merch', element: <AD.HomeMerch /> },
      { path: 'category-groups', element: <AD.CategoryGroups /> },
      { path: 'agent-rewards', element: <AD.AgentRewards /> },
      { path: 'help', element: <AD.HelpEditor /> },
      { path: 'reports', element: <AD.Reports /> },
      { path: 'settings', element: <AD.Settings /> },
      { path: 'contracts/:id', element: <AD.ContractEditor /> },
      { path: 'disputes/:code', element: <N.DisputeDetail role="admin" /> },
      { path: 'inbox', element: <N.Messages role="admin" /> },
      { path: 'notifications', element: <N.Notifications role="admin" /> },
      ...ADMIN_TABLES.map((t) => ({ path: t, element: <AD.Table key={t} table={t} /> })),
    ],
  },
])
