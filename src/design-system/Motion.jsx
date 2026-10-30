import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Fades its children up the first time they scroll into view.
 * `delay` (ms) staggers siblings. Reduced-motion users get the content instantly (see index.css).
 */
export function Reveal({ as: Tag = 'div', delay = 0, className, style, children, ...props }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = ref.current
    if (!el || shown) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        io.disconnect()
      },
      { rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shown])
  return (
    <Tag ref={ref} className={cn(shown ? 'animate-fade-up' : 'opacity-0', className)} style={{ animationDelay: `${delay}ms`, ...style }} {...props}>
      {children}
    </Tag>
  )
}
