import { useEffect, useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon, Video, Mic, Square, RotateCcw, Play, Pause, FileText, LocateFixed, CircleCheck, CircleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { api } from '@/lib/api'
import { DISTRICTS } from '@/mocks/seed'
import { Input, Select, Field, Button, ProgressBar, Waveform } from '@/design-system'

/** RWF amount with thousands separators; value is a number. */
export function MoneyInput({ value, onChange, placeholder = '0', id, size, ...props }) {
  const [text, setText] = useState(value ? formatNumber(value) : '')
  useEffect(() => {
    setText(value ? formatNumber(value) : '')
  }, [value])
  return (
    <Input
      id={id}
      size={size}
      inputMode="numeric"
      leading={<span className="text-sm font-bold text-text">RWF</span>}
      className="[&_input]:tabular [&_input]:pl-14 [&_input]:font-semibold"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
        setText(digits ? formatNumber(Number(digits)) : '')
        onChange?.(digits ? Number(digits) : 0)
      }}
      {...props}
    />
  )
}

/** +250 phone picker — stores the 9 local digits. */
export function PhoneInput({ value = '', onChange, id, ...props }) {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  const pretty = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join(' ')
  return (
    <div className="flex">
      <span className="flex h-11 items-center gap-1.5 rounded-l-[10px] border border-r-0 border-border-strong bg-surface-2 px-3 text-sm font-semibold text-text">
        <span className="text-xs font-bold text-muted">RW</span> +250
      </span>
      <Input id={id} inputMode="tel" autoComplete="tel-national" placeholder="788 123 456" className="rounded-l-none" value={pretty} onChange={(e) => onChange?.(e.target.value.replace(/\D/g, '').replace(/^0/, '').slice(0, 9))} {...props} />
    </div>
  )
}

const LIMITS = { image: 5, video: 100, audio: 30, doc: 10 }

/** Drag-and-drop uploader with per-file progress bars and size limits. */
export function FileUploader({ files, onChange, accept = 'image/*,video/*', multiple = true, label = 'Add photos or a video', hint = 'Photos up to 5 MB each · one video up to 100 MB', compact }) {
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState('')

  const add = (list) => {
    setError('')
    const next = []
    for (const f of list) {
      const kind = f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'doc'
      if (f.size > LIMITS[kind] * 1024 * 1024) {
        setError(`${f.name} is larger than ${LIMITS[kind]} MB`)
        continue
      }
      next.push({ id: `${f.name}-${f.size}-${Date.now()}`, name: f.name, size: f.size, kind, url: kind === 'image' ? URL.createObjectURL(f) : '', progress: 0 })
    }
    const merged = [...files, ...next]
    onChange(merged)
    // simulate upload progress
    next.forEach((nf) => {
      let p = 0
      const t = setInterval(() => {
        p = Math.min(100, p + 15 + Math.random() * 25)
        onChange((cur) => cur.map((x) => (x.id === nf.id ? { ...x, progress: p } : x)))
        if (p >= 100) clearInterval(t)
      }, 220)
    })
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          add(e.dataTransfer.files)
        }}
        className={cn('flex flex-col items-center justify-center rounded-card border-2 border-dashed text-center transition-colors', compact ? 'p-4' : 'p-6', drag ? 'border-action-500 bg-action-soft' : 'border-border-strong bg-surface-2')}
      >
        <Upload size={compact ? 20 : 26} className="text-muted" aria-hidden="true" />
        <p className="mt-2 text-sm font-semibold text-text">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => inputRef.current?.click()}>
          Choose files
        </Button>
        <input ref={inputRef} type="file" className="sr-only" accept={accept} multiple={multiple} onChange={(e) => add(e.target.files)} tabIndex={-1} aria-hidden="true" />
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-danger-fg" role="alert">
          {error}
        </p>
      )}
      {files.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2 text-muted">
                {f.url ? <img src={f.url} alt="" className="h-full w-full object-cover" /> : f.kind === 'video' ? <Video size={20} /> : f.kind === 'audio' ? <Mic size={20} /> : f.kind === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-text">{f.name}</span>
                <span className="text-xs text-muted">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                {f.progress < 100 && <ProgressBar value={f.progress} size="sm" tone="serve" className="mt-1" label={`Uploading ${f.name}`} />}
              </span>
              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((x) => x.id !== f.id))}>
                <X size={16} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** 🎤 Voice note: record (real mic when allowed, simulated otherwise), waveform, play, re-record. Max 30 MB. */
export function VoiceRecorder({ value, onChange }) {
  const [state, setState] = useState(value ? 'done' : 'idle')
  const [secs, setSecs] = useState(value?.durationSec ?? 0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const rec = useRef(null)
  const timer = useRef(null)

  useEffect(() => () => clearInterval(timer.current), [])

  const start = async () => {
    setSecs(0)
    setState('recording')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const chunks = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = (e) => chunks.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: 'audio/webm' })
        rec.current.url = URL.createObjectURL(blob)
      }
      mr.start()
      rec.current = { mr }
    } catch {
      rec.current = { simulated: true }
    }
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000)
  }

  const stop = () => {
    clearInterval(timer.current)
    rec.current?.mr?.stop()
    setState('done')
    setTimeout(() => onChange?.({ id: `voice-${Date.now()}`, kind: 'audio', durationSec: Math.max(1, secs), url: rec.current?.url ?? '' }), 50)
  }

  const play = () => {
    if (rec.current?.url) {
      const a = new Audio(rec.current.url)
      a.play()
    }
    setPlaying(true)
    setProgress(0)
    const total = Math.max(1, secs) * 1000
    const t0 = Date.now()
    const t = setInterval(() => {
      const p = (Date.now() - t0) / total
      setProgress(p)
      if (p >= 1) {
        clearInterval(t)
        setPlaying(false)
      }
    }, 100)
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="rounded-card border border-action-500/25 bg-action-soft p-4 text-text">
      <div className="flex items-center gap-3">
        {state === 'recording' ? (
          <Button variant="danger" size="icon" aria-label="Stop recording" onClick={stop} className="rounded-full">
            <Square size={18} fill="currentColor" />
          </Button>
        ) : state === 'done' ? (
          <Button variant="primary" size="icon" aria-label={playing ? 'Pause' : 'Play voice note'} onClick={play} className="rounded-full">
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
          </Button>
        ) : (
          <Button variant="primary" size="icon" aria-label="Start recording a voice note" onClick={start} className="rounded-full">
            <Mic size={20} />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          {state === 'idle' ? (
            <p className="text-sm font-semibold">Record a voice note</p>
          ) : (
            <Waveform className={cn('w-full text-action-fg', state === 'recording' && 'animate-pulse')} seed={secs % 7} progress={progress} />
          )}
        </div>
        <span className="tabular w-12 text-right text-sm font-semibold" aria-live="polite">
          {state !== 'idle' && fmt(secs)}
        </span>
      </div>
      {state === 'done' && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="xs" onClick={() => { setState('idle'); onChange?.(null) }}>
            <RotateCcw size={14} /> Re-record
          </Button>
        </div>
      )}
    </div>
  )
}

/** Service area: GPS or district/sector, with a live coverage check. Exact address is never public. */
export function LocationFields({ value, onChange }) {
  const [coverage, setCoverage] = useState(null)
  const district = value?.district ?? 'Gasabo'
  useEffect(() => {
    let alive = true
    api.post('/api/coverage', { district }).then((r) => alive && setCoverage(r))
    return () => {
      alive = false
    }
  }, [district])
  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={() => onChange({ district: 'Gasabo', sector: 'Kimihurura', gps: true })}>
        <LocateFixed size={16} /> Use my location
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="District">
          {(p) => (
            <Select {...p} value={district} onChange={(e) => onChange({ district: e.target.value, sector: DISTRICTS[e.target.value][0] })}>
              {Object.keys(DISTRICTS).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Sector">
          {(p) => (
            <Select {...p} value={value?.sector ?? DISTRICTS[district][0]} onChange={(e) => onChange({ ...value, district, sector: e.target.value })}>
              {DISTRICTS[district].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <p className="text-sm" aria-live="polite">
        {coverage?.covered ? (
          <span className="flex items-center gap-1.5 font-medium text-trust-fg">
            <CircleCheck size={16} /> {coverage.partners} verified Partners serve {district}
          </span>
        ) : coverage ? (
          <span className="flex items-center gap-1.5 font-medium text-warn-fg">
            <CircleAlert size={16} /> Limited coverage — we'll still try to match you
          </span>
        ) : null}
      </p>
      <p className="text-xs text-muted">Only the sector is shown publicly. Your exact address is shared with your chosen Partner after you agree.</p>
    </div>
  )
}
