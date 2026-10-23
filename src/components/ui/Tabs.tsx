import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

export interface TabDef {
  to: string
  label: ReactNode
  badge?: ReactNode
  end?: boolean
}

export function Tabs({ tabs, className }: { tabs: TabDef[]; className?: string }) {
  return (
    <nav className={cn('scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pt-1 pb-2', className)}>
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          replace
          className={({ isActive }) =>
            cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-3.5 py-1.5 text-sm font-bold transition-all',
              isActive ? 'border-ink bg-accent shadow-brut-sm' : 'border-transparent text-ink/70 hover:border-ink/20 hover:bg-white',
            )
          }
        >
          {t.label}
          {t.badge}
        </NavLink>
      ))}
    </nav>
  )
}
