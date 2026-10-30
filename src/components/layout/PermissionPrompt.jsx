import { useEffect, useState } from 'react'
import { Bell, MapPin, X } from 'lucide-react'
import { Logo, Button } from '@/design-system'
import { useUI } from '@/lib/store'
import { locationDetails, parseLocation, provinceForDistrict, reverseGeocode } from '@/lib/location'

const KEY = 'needibi.permissions.prompted'

export function PermissionPrompt() {
  const [open, setOpen] = useState(false)
  const [location, setLocation] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const saveLocation = useUI((s) => s.setLocation)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setOpen(true)
  }, [])

  if (!open) return null
  const allowLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const parsed = parseLocation(await reverseGeocode(coords))
        if (!parsed.country) throw new Error('No country found')
        const fallback = locationDetails(parsed.district, parsed.sector)
        saveLocation(parsed.district, parsed.sector, {
          ...parsed,
          province: parsed.province || provinceForDistrict(parsed.district),
          cell: parsed.cell || fallback.cell,
          village: parsed.village || fallback.village,
          street: parsed.street || fallback.street,
        })
        setLocation(true)
      } catch {
        setLocation(false)
      }
    }, () => setLocation(false), { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 })
  }
  const allowNotifications = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setNotifications(result === 'granted')
  }
  const close = () => {
    localStorage.setItem(KEY, '1')
    setOpen(false)
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
      <section role="dialog" aria-modal="true" aria-labelledby="permission-title" className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-border bg-surface shadow-modal">
        <header className="flex items-start justify-between border-b border-border bg-action px-6 py-5 text-white">
          <div><Logo onDark size="sm" /><h2 id="permission-title" className="mt-5 text-2xl font-extrabold">Get the best of Needibi Serve</h2><p className="mt-1 text-sm text-white/90">Two quick permissions to make shopping easier. You can change them any time in your browser settings.</p></div>
          <button type="button" onClick={close} className="rounded-lg p-2 text-white/85 hover:bg-white/15 hover:text-white" aria-label="Close"><X size={20} /></button>
        </header>
        <div className="space-y-3 p-6">
          <PermissionRow icon={<MapPin />} title="Location" text="Finds your country and shows the Deals and delivery options available there." done={location} onAllow={allowLocation} />
          <PermissionRow icon={<Bell />} title="Notifications" text="Order updates, delivery tracking and deals you saved." done={notifications} onAllow={allowNotifications} />
        </div>
        <footer className="flex items-center justify-between border-t border-border px-6 py-4">
          <button type="button" onClick={close} className="px-3 py-2 text-sm font-semibold text-muted hover:text-text">Not now</button>
          <Button variant="outline" onClick={close}>Continue shopping</Button>
        </footer>
      </section>
    </div>
  )
}

function PermissionRow({ icon, title, text, done, onAllow }) {
  return <div className="flex items-center gap-4 rounded-xl border border-border p-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-action-soft text-action-fg">{icon}</span><div className="min-w-0 flex-1"><h3 className="font-bold text-text">{title}</h3><p className="text-sm text-muted">{text}</p></div><Button size="sm" variant={done ? 'outline' : 'primary'} onClick={onAllow}>{done ? 'Allowed' : 'Allow'}</Button></div>
}
