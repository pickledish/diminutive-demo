import { create } from 'zustand'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'default' | 'success' | 'warn' | 'danger'

interface Toast {
  id: number
  emoji?: string
  title: string
  body?: string
  tone: Tone
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id' | 'tone'> & { tone?: Tone }) => void
  dismiss: (id: number) => void
}

let counter = 0

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++counter
    set((s) => ({ toasts: [...s.toasts.slice(-3), { tone: 'default', ...t, id }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4200)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))

export const toast = (t: Omit<Toast, 'id' | 'tone'> & { tone?: Tone }) => useToasts.getState().push(t)

const toneBg: Record<Tone, string> = {
  default: 'bg-white',
  success: 'bg-mint',
  warn: 'bg-sun',
  danger: 'bg-cherry',
}

export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn('brut pointer-events-auto flex animate-slide-up items-start gap-3 rounded-2xl p-3 pr-2', toneBg[t.tone])}
        >
          {t.emoji && <div className="text-2xl leading-none">{t.emoji}</div>}
          <div className="min-w-0 flex-1">
            <div className="font-display font-bold leading-tight">{t.title}</div>
            {t.body && <div className="mt-0.5 text-sm text-ink/75">{t.body}</div>}
          </div>
          <button onClick={() => dismiss(t.id)} className="rounded-md p-1 hover:bg-ink/10" aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
