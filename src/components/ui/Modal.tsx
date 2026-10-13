import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColorKey } from '@/types'
import { bg } from '@/lib/colors'

export function Modal({
  open,
  onClose,
  title,
  emoji,
  children,
  footer,
  tone = 'sun',
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  emoji?: string
  children: ReactNode
  footer?: ReactNode
  tone?: ColorKey | 'white'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'brut relative flex max-h-[calc(100vh-1.5rem)] w-full animate-pop flex-col overflow-hidden rounded-2xl bg-paper sm:max-h-[calc(100vh-3rem)]',
          { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size],
        )}
        style={{ boxShadow: '8px 8px 0 0 #141414' }}
      >
        <div className={cn('flex items-center justify-between gap-3 border-b-[3px] border-ink px-5 py-3.5', tone === 'white' ? 'bg-white' : bg[tone])}>
          <h2 className="flex min-w-0 items-center gap-2 text-xl font-extrabold leading-tight">
            {emoji && <span className="text-2xl">{emoji}</span>}
            <span className="truncate">{title}</span>
          </h2>
          <button onClick={onClose} className="brut-xs press shrink-0 rounded-lg bg-white p-1" aria-label="Close">
            <X size={18} strokeWidth={3} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t-[3px] border-ink bg-white px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
