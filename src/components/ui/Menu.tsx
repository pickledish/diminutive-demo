import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Menu({ trigger, children, align = 'right', className }: { trigger: (open: boolean) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>
      {open && (
        <div
          className={cn(
            'brut absolute top-full z-50 mt-2 min-w-56 animate-pop overflow-hidden rounded-xl bg-white',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ onClick, children, danger, emoji }: { onClick?: () => void; children: ReactNode; danger?: boolean; emoji?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-bold hover:bg-accent/40', danger && 'text-[#c42b2b] hover:bg-cherry/25')}
    >
      {emoji && <span className="w-5 text-center">{emoji}</span>}
      {children}
    </button>
  )
}

export const MenuDivider = () => <div className="h-[2px] bg-ink/15" />
