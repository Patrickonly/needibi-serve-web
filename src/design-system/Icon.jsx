import {
  Activity, Archive, ArrowUp, BadgeCheck, Ban, BanknoteCheck, BellRing, Briefcase, Building, CalendarDays, Car,
  ChevronDown, CircleAlert, CircleCheck, CircleDot, CircleQuestionMark, CircleSlash, CircleX, Cpu, FileText, Flag,
  Gavel, Gift, GraduationCap, HeartPulse, Hourglass, Inbox, Info, Lightbulb, LoaderCircle, MessagesSquare, Minus,
  Paperclip, Pause, Pencil, Plane, RefreshCw, Scale, Send, ShieldCheck, Shuffle, Signature, Siren, Sofa, Sparkles,
  Sprout, Timer, TriangleAlert, Truck, Undo, UserCheck, UserPlus, UtensilsCrossed, Wallet, Wrench,
} from 'lucide-react'

// Explicit map keeps the bundle tree-shaken while letting data refer to icons by name.
const ICONS = {
  Activity, Archive, ArrowUp, BadgeCheck, Ban, BanknoteCheck, BellRing, Briefcase, Building, CalendarDays, Car,
  ChevronDown, CircleAlert, CircleCheck, CircleDot, CircleQuestionMark, CircleSlash, CircleX, Cpu, FileText, Flag,
  Gavel, Gift, GraduationCap, HeartPulse, Hourglass, Inbox, Info, Lightbulb, LoaderCircle, MessagesSquare, Minus,
  Paperclip, Pause, Pencil, Plane, RefreshCw, Scale, Send, ShieldCheck, Shuffle, Signature, Siren, Sofa, Sparkles,
  Sprout, Timer, TriangleAlert, Truck, Undo, UserCheck, UserPlus, UtensilsCrossed, Wallet, Wrench,
}

export function Icon({ name, size = 16, strokeWidth = 1.75, ...props }) {
  const C = ICONS[name] ?? CircleDot
  return <C size={size} strokeWidth={strokeWidth} aria-hidden="true" {...props} />
}
