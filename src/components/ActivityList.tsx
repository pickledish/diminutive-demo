import type { ActivityEvent, ActivityKind } from '@/types'
import { useDemo } from '@/store'
import { cn, timeAgo } from '@/lib/utils'
import { AppIcon, Avatar } from './ui/identity'

export const ACTIVITY_META: Record<ActivityKind, { emoji: string; label: string; tone: string }> = {
  read: { emoji: '👀', label: 'Read', tone: 'bg-sky/40' },
  write: { emoji: '✏️', label: 'Changed', tone: 'bg-sun/50' },
  schema: { emoji: '🧬', label: 'Data shape', tone: 'bg-grape/50' },
  sharing: { emoji: '👥', label: 'Sharing', tone: 'bg-bubblegum/50' },
  update: { emoji: '⬆️', label: 'Update', tone: 'bg-mint/50' },
  backup: { emoji: '💾', label: 'Backup', tone: 'bg-tangerine/40' },
  install: { emoji: '📦', label: 'Install', tone: 'bg-lime/50' },
  export: { emoji: '📤', label: 'Export', tone: 'bg-white' },
}

export function ActivityItem({ e, showApp = true }: { e: ActivityEvent; showApp?: boolean }) {
  const app = useDemo((s) => (e.appId ? s.apps[e.appId] : undefined))
  const person = useDemo((s) => (e.who && e.who.startsWith('usr') ? s.people[e.who] : undefined))
  const meta = ACTIVITY_META[e.kind]
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="relative shrink-0">
        {showApp && app ? <AppIcon app={app} size="xs" /> : <span className={cn('flex size-7 items-center justify-center rounded-lg border-2 border-ink text-sm', meta.tone)}>{meta.emoji}</span>}
        {person && showApp && <Avatar person={person} size="xs" className="absolute -right-2 -bottom-2 size-[18px] border-[1.5px] text-[9px]" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-snug">{e.text}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-ink/45">
          <span>{meta.emoji}</span>
          {meta.label} · {timeAgo(e.at)}
        </div>
      </div>
    </div>
  )
}

export function ActivityList({ events, showApp = true, className }: { events: ActivityEvent[]; showApp?: boolean; className?: string }) {
  return (
    <div className={cn('divide-y-2 divide-ink/10', className)}>
      {events.map((e) => (
        <ActivityItem key={e.id} e={e} showApp={showApp} />
      ))}
    </div>
  )
}
