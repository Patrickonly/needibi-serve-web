// One place that maps every status in the product to { label, tone, icon }.
// Colour is never used alone: badges always render the icon + label too.

const T = (label, tone, icon) => ({ label, tone, icon })

export const STATUS = {
  // need / bundle lifecycle
  submitted: T('Submitted', 'grey', 'Send'),
  under_review: T('Pending review', 'grey', 'Hourglass'),
  changes_requested: T('Changes requested', 'serve', 'Pencil'),
  published: T('Live', 'info', 'CircleDot'),
  matching: T('Matching', 'info', 'Shuffle'),
  offers_received: T('Offers received', 'serve', 'Inbox'),
  negotiating: T('Negotiating', 'serve', 'MessagesSquare'),
  agreement_signed: T('Agreement signed', 'info', 'Signature'),
  awaiting_payment: T('Awaiting payment', 'serve', 'Wallet'),
  payment_verified: T('Paid · in escrow', 'trust', 'ShieldCheck'),
  in_service: T('In service', 'info', 'Wrench'),
  delivered: T('Delivered', 'serve', 'Truck'),
  completed: T('Completed', 'trust', 'CircleCheck'),
  closed: T('Closed', 'grey', 'Archive'),
  rejected: T('Rejected', 'danger', 'Ban'),
  expired: T('Expired', 'danger', 'Timer'),
  cancelled: T('Cancelled', 'grey', 'CircleX'),
  disputed: T('Disputed', 'danger', 'Gavel'),
  archived: T('Archived', 'grey', 'Archive'),
  draft: T('Draft', 'grey', 'Pencil'),
  pending: T('Pending review', 'grey', 'Hourglass'),
  paused: T('Paused', 'grey', 'Pause'),

  // status groups
  action_needed: T('Action needed', 'serve', 'CircleAlert'),
  in_progress: T('In progress', 'info', 'Activity'),
  done: T('Done', 'trust', 'CircleCheck'),
  problem: T('Problem', 'danger', 'TriangleAlert'),

  // offers
  clarification: T('Clarification needed', 'serve', 'CircleQuestionMark'),
  revised: T('Revised', 'info', 'RefreshCw'),
  accepted: T('Accepted', 'trust', 'CircleCheck'),
  withdrawn: T('Withdrawn', 'grey', 'Undo'),
  auto_closed: T('Auto-closed', 'grey', 'CircleSlash'),

  // bookings / jobs
  requested: T('Requested', 'grey', 'Send'),
  confirmed: T('Confirmed', 'info', 'CircleCheck'),
  scheduled: T('Scheduled', 'info', 'CalendarDays'),
  quote_pending: T('Quote pending', 'serve', 'FileText'),
  incoming: T('Incoming', 'serve', 'Inbox'),
  active: T('Active', 'info', 'Activity'),

  // payments / escrow
  paid: T('Paid', 'trust', 'CircleCheck'),
  verifying: T('Verifying', 'warn', 'Hourglass'),
  failed: T('Failed', 'danger', 'CircleX'),
  refunded: T('Refunded', 'grey', 'Undo'),
  held: T('Held in escrow', 'trust', 'ShieldCheck'),
  released: T('Released', 'trust', 'BanknoteCheck'),
  partial: T('Partial release', 'warn', 'Scale'),
  none: T('—', 'grey', 'Minus'),
  processing: T('Processing', 'warn', 'LoaderCircle'),

  // agreements
  awaiting_signature: T('Awaiting signature', 'serve', 'Signature'),
  signed: T('Signed', 'trust', 'Signature'),

  // disputes / tickets / appeals
  open: T('Open', 'serve', 'CircleDot'),
  assigned: T('Assigned', 'info', 'UserCheck'),
  awaiting_user: T('Awaiting user', 'warn', 'Hourglass'),
  awaiting_evidence: T('Awaiting evidence', 'warn', 'Paperclip'),
  escalated: T('Escalated', 'danger', 'Siren'),
  resolved: T('Resolved', 'trust', 'CircleCheck'),
  appealed: T('Appealed', 'warn', 'Scale'),
  upheld: T('Upheld', 'trust', 'CircleCheck'),
  overturned: T('Overturned', 'warn', 'RefreshCw'),

  // moderation / kyc / accounts
  approved: T('Approved', 'trust', 'CircleCheck'),
  info_requested: T('Info requested', 'serve', 'CircleQuestionMark'),
  flagged: T('Flagged', 'danger', 'Flag'),
  actioned: T('Actioned', 'trust', 'CircleCheck'),
  dismissed: T('Dismissed', 'grey', 'CircleSlash'),
  suspended: T('Suspended', 'danger', 'Ban'),

  // referrals / followups
  signed_up: T('Signed up', 'grey', 'UserPlus'),
  verified: T('Verified', 'info', 'BadgeCheck'),
  first_transaction: T('First transaction', 'trust', 'CircleCheck'),
  earned: T('Earned', 'trust', 'Gift'),
  overdue: T('Overdue', 'danger', 'Timer'),
  recorded: T('Recorded', 'trust', 'CircleCheck'),
}

export function statusMeta(status) {
  return STATUS[status] ?? T(String(status ?? '—').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()), 'grey', 'CircleDot')
}

export const URGENCY = {
  low: T('Low', 'grey', 'ChevronDown'),
  medium: T('Medium', 'info', 'Minus'),
  high: T('High', 'warn', 'ArrowUp'),
  urgent: T('Urgent', 'danger', 'Siren'),
}

export const PRIORITY = {
  low: T('Low', 'grey', 'ChevronDown'),
  normal: T('Normal', 'info', 'Minus'),
  high: T('High', 'warn', 'ArrowUp'),
  urgent: T('Urgent', 'danger', 'Siren'),
  critical: T('Critical', 'danger', 'Siren'),
  action: T('Action required', 'serve', 'CircleAlert'),
  reminder: T('Reminder', 'info', 'BellRing'),
  info: T('Info', 'grey', 'Info'),
  medium: T('Medium', 'info', 'Minus'),
}

export const NEED_STATUS_TABS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'action_needed', label: 'Action needed' },
  { value: 'matching', label: 'Matching' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'problem', label: 'Problem' },
]

export const PAYMENT_METHODS = {
  momo: { label: 'MTN MoMo', short: 'MoMo' },
  airtel: { label: 'Airtel Money', short: 'Airtel' },
  card: { label: 'Card', short: 'Card' },
  proof: { label: 'Proof of payment', short: 'Proof' },
}
