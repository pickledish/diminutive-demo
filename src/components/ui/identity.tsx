import type { AppListing, ColorKey, Person } from '@/types'
import { bg } from '@/lib/colors'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store'

const iconSizes = {
  xs: 'size-7 text-base rounded-lg border-2',
  sm: 'size-10 text-xl rounded-xl border-2',
  md: 'size-14 text-3xl rounded-2xl border-[3px]',
  lg: 'size-20 text-5xl rounded-[22px] border-[3px]',
  xl: 'size-28 text-7xl rounded-[28px] border-[3px]',
}

export function AppIcon({
  app,
  emoji,
  color,
  size = 'md',
  className,
  shadow = true,
}: {
  app?: Pick<AppListing, 'emoji' | 'color'>
  emoji?: string
  color?: ColorKey | 'white'
  size?: keyof typeof iconSizes
  className?: string
  shadow?: boolean
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 select-none items-center justify-center border-ink leading-none',
        iconSizes[size],
        color === 'white' ? 'bg-white' : bg[color ?? app?.color ?? 'sun'],
        shadow && (size === 'xs' || size === 'sm' ? 'shadow-brut-xs' : 'shadow-brut-sm'),
        className,
      )}
    >
      <span className="drop-shadow-[0_1px_0_rgba(0,0,0,0.15)]">{emoji ?? app?.emoji}</span>
    </div>
  )
}

const avatarSizes = {
  xs: 'size-6 text-xs',
  sm: 'size-8 text-base',
  md: 'size-10 text-xl',
  lg: 'size-14 text-3xl',
}

export function Avatar({ person, size = 'sm', className, ring = false }: { person?: Pick<Person, 'emoji' | 'color' | 'name'>; size?: keyof typeof avatarSizes; className?: string; ring?: boolean }) {
  if (!person) return null
  return (
    <span
      title={person.name}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full border-2 border-ink leading-none',
        avatarSizes[size],
        bg[person.color],
        ring && 'ring-2 ring-paper',
        className,
      )}
    >
      {person.emoji}
    </span>
  )
}

export function AvatarStack({ ids, max = 4, size = 'sm' }: { ids: string[]; max?: number; size?: keyof typeof avatarSizes }) {
  const people = useDemo((s) => s.people)
  const shown = ids.slice(0, max)
  const extra = ids.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((id, i) => (
        <Avatar key={id} person={people[id]} size={size} ring className={i > 0 ? '-ml-2' : ''} />
      ))}
      {extra > 0 && (
        <span className={cn('-ml-2 inline-flex items-center justify-center rounded-full border-2 border-ink bg-white text-xs font-bold ring-2 ring-paper', avatarSizes[size])}>
          +{extra}
        </span>
      )}
    </div>
  )
}

export function PersonChip({ id, className }: { id: string; className?: string }) {
  const person = useDemo((s) => s.people[id])
  const meId = useDemo((s) => s.meId)
  if (!person) return <span className="font-mono text-xs text-ink/50">{id}</span>
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-ink bg-white py-0.5 pr-2 pl-0.5 text-xs font-bold', className)}>
      <Avatar person={person} size="xs" className="size-5 border text-[10px]" />
      {id === meId ? 'You' : person.name.split(' ')[0]}
    </span>
  )
}

export function Logo({ className, withText = true, size = 34 }: { className?: string; withText?: boolean; size?: number }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
        <rect x="4" y="4" width="56" height="56" rx="13" fill="#FFD23F" stroke="#141414" strokeWidth="5" />
        <rect x="14" y="22" width="36" height="28" rx="7" fill="#141414" />
        <circle cx="25.5" cy="35" r="5" fill="#FFFCF5" />
        <circle cx="38.5" cy="35" r="5" fill="#FFFCF5" />
        <circle cx="26.5" cy="36" r="2.2" fill="#141414" />
        <circle cx="39.5" cy="36" r="2.2" fill="#141414" />
      </svg>
      {withText && <span className="font-display text-2xl font-extrabold tracking-tight">cubby</span>}
    </span>
  )
}
