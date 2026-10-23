import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { crossesMode, startModeSwitch } from '@/lib/mode'
import { ChevronDown } from 'lucide-react'
import { useDemo } from '@/store'
import type { TourStep } from '@/types'
import { cn } from '@/lib/utils'

const STEPS: { id: TourStep; label: string; to: string; side: 'user' | 'maker' }[] = [
  { id: 'update', label: 'Review Grocery Goblin’s data update', to: '/home', side: 'user' },
  { id: 'peek', label: 'Peek at the raw data an app keeps', to: '/my/grocery-goblin/data', side: 'user' },
  { id: 'invite', label: 'Join a shared space from the notification bell', to: '/home', side: 'user' },
  { id: 'install', label: 'Install something new from Explore', to: '/explore', side: 'user' },
  { id: 'restore', label: 'Delete a row, then restore it from a backup', to: '/my/grocery-goblin/data', side: 'user' },
  { id: 'ship', label: 'Ship a release that changes data, then approve it as a user', to: '/workshop/grocery-goblin/migrations', side: 'maker' },
  { id: 'create', label: 'Start a brand-new app in the Workshop', to: '/workshop/new', side: 'maker' },
]

export function TourWidget() {
  const tour = useDemo((s) => s.tour)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const done = STEPS.filter((s) => tour[s.id]).length

  return (
    <div className="fixed bottom-4 left-4 z-[80] print:hidden">
      {open && (
        <div className="brut mb-3 w-[min(340px,calc(100vw-2rem))] animate-pop overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-sky px-4 py-2.5">
            <div>
              <div className="font-display font-extrabold">Things to try</div>
              <div className="text-xs font-bold text-ink/70">A little tour of the demo</div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-ink/10" aria-label="Collapse">
              <ChevronDown size={18} strokeWidth={3} />
            </button>
          </div>
          <div className="p-2">
            {(['user', 'maker'] as const).map((side) => (
              <div key={side}>
                <div className="px-2 pt-2 pb-1 text-[11px] font-extrabold tracking-wider text-ink/50 uppercase">{side === 'user' ? '🏠 As an app user' : '🛠️ As a maker'}</div>
                {STEPS.filter((s) => s.side === side).map((s) => (
                  <Link
                    key={s.id}
                    to={s.to}
                    onClick={(e) => {
                      setOpen(false)
                      if (crossesMode(pathname, s.to)) startModeSwitch(e, navigate, s.to)
                    }}
                    className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-accent/30"
                  >
                    <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-ink text-xs font-extrabold', tour[s.id] ? 'bg-mint' : 'bg-white')}>
                      {tour[s.id] ? '✓' : ''}
                    </span>
                    <span className={cn('leading-snug font-bold', tour[s.id] && 'text-ink/45 line-through')}>{s.label}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="brut-sm press flex items-center gap-2 rounded-full bg-sky px-4 py-2 text-sm font-extrabold">
        🧭 Things to try
        <span className="rounded-full border-2 border-ink bg-white px-1.5 text-xs">
          {done}/{STEPS.length}
        </span>
      </button>
    </div>
  )
}
