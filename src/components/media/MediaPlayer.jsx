import { create } from 'zustand'
import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Mic, X, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Waveform } from '@/design-system/Media'

/**
 * One playing item at a time, app-wide. The inline player owns the <audio>/<video>
 * element; this store only remembers which one it is so the others pause and so the
 * floating dock can control it once the inline player scrolls out of view.
 */
export const useMediaPlayer = create((set) => ({
  activeId: null,
  title: '',
  kind: 'audio',
  playing: false,
  current: 0,
  duration: 0,
  docked: false,
  controls: null,
  start: (id, { title, kind, controls }) => set({ activeId: id, title, kind, controls, playing: true }),
  setProgress: (current, duration) => set({ current, duration }),
  setPlaying: (playing) => set({ playing }),
  setDocked: (docked) => set({ docked }),
  clear: (id) => set((s) => (id && s.activeId !== id ? s : { activeId: null, playing: false, docked: false, controls: null, current: 0, duration: 0 })),
}))

const fmt = (s) => {
  const n = Math.max(0, Math.floor(s || 0))
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
}

/**
 * Inline player for a voice note or a short video. Real controls, keyboard
 * reachable, and it registers itself so playback survives scrolling away.
 */
export function MediaPlayer({ media, title = 'Attachment', poster, className }) {
  const ref = useRef(null)
  const wrapRef = useRef(null)
  const id = media?.id ?? 'media'
  const isVideo = media?.kind === 'video'
  const [ready, setReady] = useState(false)
  const [muted, setMuted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(media?.durationSec ?? 0)
  const store = useMediaPlayer()
  const active = store.activeId === id
  const playing = active && store.playing

  // Another item started: stop this one.
  useEffect(() => {
    if (!active && ref.current && !ref.current.paused) ref.current.pause()
  }, [active])

  // Dock the mini-player once the inline one is off screen, and only while playing.
  useEffect(() => {
    const el = wrapRef.current
    if (!el || !active) return
    const io = new IntersectionObserver(([e]) => useMediaPlayer.getState().setDocked(!e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => {
      io.disconnect()
      useMediaPlayer.getState().setDocked(false)
    }
  }, [active])

  const toggle = () => {
    const el = ref.current
    if (!el) return
    if (el.paused) {
      useMediaPlayer.getState().start(id, {
        title,
        kind: media?.kind ?? 'audio',
        controls: {
          toggle: () => (el.paused ? el.play() : el.pause()),
          seek: (t) => { el.currentTime = t },
          stop: () => { el.pause(); el.currentTime = 0 },
        },
      })
      el.play().catch(() => useMediaPlayer.getState().setPlaying(false))
    } else {
      el.pause()
    }
  }

  const onTime = () => {
    const el = ref.current
    if (!el) return
    setCurrent(el.currentTime)
    if (useMediaPlayer.getState().activeId === id) useMediaPlayer.getState().setProgress(el.currentTime, el.duration || duration)
  }

  // The seeded demo media has no real file behind it; keep the controls honest
  // rather than showing a player that can never play.
  const playable = Boolean(media?.url)
  const progress = duration ? Math.min(1, current / duration) : 0

  const mediaEl = playable
    ? (isVideo ? (
        <video
          ref={ref}
          src={media.url}
          poster={poster}
          playsInline
          controls
          preload="metadata"
          className="h-full w-full rounded-[var(--radius-card)] bg-black object-contain"
          onPlay={(e) => { const el = e.currentTarget; if (useMediaPlayer.getState().activeId !== id) useMediaPlayer.getState().start(id, { title, kind: media?.kind ?? 'audio', controls: { toggle: () => (el.paused ? el.play() : el.pause()), seek: (t) => { el.currentTime = t }, stop: () => { el.pause(); el.currentTime = 0 } } }); else useMediaPlayer.getState().setPlaying(true) }}
          onPause={() => useMediaPlayer.getState().setPlaying(false)}
          onTimeUpdate={onTime}
          onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); setReady(true) }}
          onEnded={() => useMediaPlayer.getState().clear(id)}
        >
          <track kind="captions" />
        </video>
      ) : (
        <audio
          ref={ref}
          src={media.url}
          preload="metadata"
          onPlay={(e) => { const el = e.currentTarget; if (useMediaPlayer.getState().activeId !== id) useMediaPlayer.getState().start(id, { title, kind: media?.kind ?? 'audio', controls: { toggle: () => (el.paused ? el.play() : el.pause()), seek: (t) => { el.currentTime = t }, stop: () => { el.pause(); el.currentTime = 0 } } }); else useMediaPlayer.getState().setPlaying(true) }}
          onPause={() => useMediaPlayer.getState().setPlaying(false)}
          onTimeUpdate={onTime}
          onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); setReady(true) }}
          onEnded={() => useMediaPlayer.getState().clear(id)}
        />
      ))
    : null

  if (isVideo) {
    return (
      <div ref={wrapRef} className={cn('overflow-hidden rounded-[var(--radius-card)] border border-border bg-black', className)}>
        {playable ? (
          <div className="aspect-video">{mediaEl}</div>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-primary-900 text-white/80">
            <Play size={30} aria-hidden="true" />
            <p className="text-sm font-semibold">Video · {fmt(media?.durationSec ?? 0)}</p>
            <p className="text-xs text-white/60">Captions available · EN, RW</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={wrapRef} className={cn('rounded-[var(--radius-card)] border border-border bg-surface p-3', className)}>
      {mediaEl}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!playable}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-action-500 text-on-action shadow-btn transition hover:bg-action-600 disabled:opacity-45"
        >
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-text">
            <Mic size={14} className="shrink-0 text-muted" aria-hidden="true" /> {title}
          </p>
          <Waveform className="mt-1 w-full text-border-strong" seed={(id.length ?? 3) + 2} progress={progress} />
        </div>
        <span className="tabular shrink-0 text-xs font-medium text-muted">{fmt(playing || current ? current : duration)}</span>
        {playable && (
          <button
            type="button"
            onClick={() => { const el = ref.current; if (el) { el.muted = !el.muted; setMuted(el.muted) } }}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:bg-surface-2 hover:text-text"
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        )}
      </div>
      {!playable && <p className="mt-2 text-xs text-muted">Recording attached by the customer — open on the detail page to listen.</p>}
      {ready && <span className="sr-only">Duration {fmt(duration)}</span>}
    </div>
  )
}

/** Floating dock: keeps playback going once the inline player is off screen. */
export function MediaDock() {
  const { activeId, docked, playing, title, kind, current, duration, controls, clear } = useMediaPlayer()
  if (!activeId || !docked || !controls) return null
  const pct = duration ? (current / duration) * 100 : 0
  return (
    <div
      role="region"
      aria-label="Now playing"
      className="fixed inset-x-3 bottom-20 z-40 animate-pop rounded-[var(--radius-card)] border border-border bg-surface p-2.5 shadow-modal sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[340px] md:bottom-5"
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => controls.toggle()}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-action-500 text-on-action transition hover:bg-action-600"
        >
          {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} className="ml-0.5" fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-text">{title}</p>
          <p className="tabular text-[11px] text-muted">{kind === 'video' ? 'Video' : 'Voice note'} · {fmt(current)} / {fmt(duration)}</p>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.floor(duration))}
          value={Math.floor(current)}
          onChange={(e) => controls.seek(Number(e.target.value))}
          aria-label="Seek"
          className="h-1 w-20 shrink-0 cursor-pointer accent-[var(--action-500)]"
        />
        <button
          type="button"
          onClick={() => { controls.stop(); clear() }}
          aria-label="Close player"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <X size={15} />
        </button>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <div className="h-full rounded-full bg-action-500 transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
