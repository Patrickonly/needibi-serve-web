import { useNavigate } from 'react-router-dom'
import { Repeat, FilePen, Lock, MessagesSquare, X, Check, BellRing, UserCog, HandHelping, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { useSession, useGatedAction } from '@/lib/hooks'
import { toast, useAuth } from '@/lib/store'
import { Button, IconButton, Tooltip, DisabledReason } from '@/design-system'
import { useCardActions, detailPath } from './actionsStore'
import { CardToolbar, PILL, SOFT_PILL } from './CardParts'

export const CHAT_UNLOCKED_STATUSES = ['negotiating', 'agreement_signed', 'awaiting_payment', 'payment_verified', 'in_service', 'delivered']

const OFFER_STATUSES = ['published', 'matching', 'offers_received']

export function partnerCanChat(item, partnerId) {
  return CHAT_UNLOCKED_STATUSES.includes(item.status) && item.assignedPartnerId === partnerId
}

/**
 * Role-aware action row for Need and Bundle cards (Section 6.6), in one clean line:
 * exactly one filled button, everything else icon buttons with tooltips.
 */
export function NeedActions({ item, context = 'public', size = 'sm', className, withEngagement = true, onDetail = false }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, role } = useSession()
  const gate = useGatedAction()
  const open = useCardActions((s) => s.open)
  const acceptingOffers = !item.status || OFFER_STATUSES.includes(item.status)
  const full = acceptingOffers && item.offerSlots && item.offerSlots.used >= item.offerSlots.limit
  const label = item.kind === 'bundle' ? 'Bundle' : 'Need'

  const switchRole = useAuth((s) => s.switchRole)
  // Only verified Partners can serve: everyone else is asked to verify first.
  const serve = gate(() => {
    if (!user.roles.includes('partner')) return open('verifyPartner', { item, mode: 'become' })
    if (user.verified === false) return open('verifyPartner', { item, mode: 'pending' })
    if (role !== 'partner') {
      switchRole('partner')
      toast('Switched to your Partner account')
    }
    open('serve', item)
  }, { reason: `Sign in as a verified Partner to serve this ${label}` })
  const notify = gate(() => toast("We'll notify you if a slot frees up"), { reason: 'Sign in to get notified' })
  const reneed = gate(() => open('reneed', item), { roles: ['needer', 'agent'], reason: 'Sign in to repost this' })
  const rerequest = gate(() => navigate(`/app/needer/post?from=${item.code}`), { roles: ['needer', 'agent'], reason: 'Sign in to re-request' })

  const viewDetails = (
    <Button size={size} variant="outline" className="flex-1 px-2" onClick={() => navigate(detailPath(item))}>
      {t('actions.viewDetails')}
    </Button>
  )
  const reExtras = [
    { label: `${t('actions.reneed')} — put it back up as it is`, icon: <Repeat />, onSelect: reneed },
    { label: `${t('actions.rerequest')} — change it, then ask again`, icon: <FilePen />, onSelect: rerequest },
  ]

  if (context === 'partner') {
    const canChat = partnerCanChat(item, user?.partnerId)
    return (
      <div className={cn('relative z-[2] space-y-2', className)}>
        <div className="flex gap-1.5">
          {!acceptingOffers ? (
            <Button size={size} variant="outline" className="flex-1 px-2" disabled>
              Closed
            </Button>
          ) : full ? (
            <Button size={size} variant="outline" className="flex-1 px-2" onClick={notify}>
              <BellRing size={14} /> Notify me
            </Button>
          ) : (
            <Button size={size} variant="primary" className="flex-1 px-2" onClick={serve}>
              <HandHelping size={15} /> {t('actions.serve')}
            </Button>
          )}
          {viewDetails}
          {canChat ? (
            <Tooltip content={t('actions.chat')}>
              <IconButton label={t('actions.chat')} variant="outline" onClick={() => navigate(`/app/partner/messages?ref=${item.code}`)}>
                <MessagesSquare size={15} />
              </IconButton>
            </Tooltip>
          ) : (
            <DisabledReason reason="Chat unlocks once it's confirmed you'll serve this request">
              <IconButton label={`${t('actions.chat')} (locked)`} variant="outline" aria-disabled="true" tabIndex={-1}>
                <Lock size={14} />
              </IconButton>
            </DisabledReason>
          )}
          <Tooltip content={t('actions.reject')}>
            <IconButton label={t('actions.reject')} variant="outline" className="text-danger-fg hover:bg-danger-100" onClick={() => open('reject', { item, as: 'partner' })}>
              <X size={15} />
            </IconButton>
          </Tooltip>
        </div>
        <CardToolbar item={item} extra={reExtras} />
      </div>
    )
  }

  if (context === 'admin') {
    return (
      <div className={cn('relative z-[2] space-y-2', className)}>
        <div className="flex gap-1.5">
          <Button size={size} variant="primary" className="flex-1 px-2" onClick={() => open('approve', item)}>
            <Check size={14} /> {t('actions.approve')}
          </Button>
          {viewDetails}
          {item.kind === 'bundle' && (
            <Tooltip content={t('actions.assign')}>
              <IconButton label={t('actions.assign')} variant="outline" onClick={() => open('assign', item)}>
                <UserCog size={15} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip content={t('actions.reject')}>
            <IconButton label={t('actions.reject')} variant="outline" className="text-danger-fg hover:bg-danger-100" onClick={() => open('reject', { item, as: 'admin' })}>
              <X size={15} />
            </IconButton>
          </Tooltip>
        </div>
        <CardToolbar item={item} extra={[{ label: `${t('actions.chat')} with poster`, icon: <MessagesSquare />, onSelect: () => navigate(`/admin/inbox?ref=${item.code}`) }, ...reExtras]} />
      </div>
    )
  }

  // public / needer — mobile-app layout: Serve · Repost · Re-request pills, then ♡ 💬 🔖 ↗ · 👁 ⋯
  return (
    <div className={cn('@container relative z-[2] space-y-2.5', className)}>
      {/* Narrow cards (phones, tight grids): Repost / Re-request collapse to icon pills so nothing overflows */}
      <div className="flex gap-2">
        {!acceptingOffers ? (
          <Button variant="outline" className={cn(PILL, 'min-w-0 flex-1 px-3')} disabled>
            Closed
          </Button>
        ) : full ? (
          <Button variant="outline" className={cn(PILL, 'min-w-0 flex-1 px-3')} onClick={notify} title="Offers are full — Notify me">
            <BellRing size={15} /> Notify me
          </Button>
        ) : (
          <Button variant="primary" className={cn(PILL, 'min-w-0 flex-1 px-3')} onClick={serve}>
            <UserRound size={16} /> {t('actions.serve')}
          </Button>
        )}
        <Button variant="subtle" className={cn(SOFT_PILL, 'w-9 shrink-0 px-0 @[23rem]:w-auto @[23rem]:px-3.5')} onClick={reneed} title="Repost — put it back up as it is" aria-label={t('actions.reneed')}>
          <Repeat size={15} /> <span className="hidden @[23rem]:inline">{t('actions.reneed')}</span>
        </Button>
        <Button variant="subtle" className={cn(SOFT_PILL, 'w-9 shrink-0 px-0 @[23rem]:w-auto @[23rem]:px-3.5')} onClick={rerequest} title="Re-request — change it, then ask again" aria-label={t('actions.rerequest')}>
          <FilePen size={15} /> <span className="hidden @[23rem]:inline">{t('actions.rerequest')}</span>
        </Button>
      </div>
      {withEngagement && <CardToolbar item={item} hideView={onDetail} />}
    </div>
  )
}
