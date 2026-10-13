import { Link } from 'react-router'
import type { AppListing } from '@/types'
import { useDemo } from '@/store'
import { compact, cn } from '@/lib/utils'
import { AppIcon } from './ui/identity'
import { Badge, Stars, Sticker } from './ui/primitives'
import { SealedBadge } from './Badges'

export function AppCard({ app, className }: { app: AppListing; className?: string }) {
  const dev = useDemo((s) => s.developers[app.developerId])
  const installed = useDemo((s) => !!s.installs[app.id])
  const isNew = Date.now() - new Date(app.createdAt).getTime() < 40 * 86_400_000
  return (
    <Link to={`/apps/${app.id}`} className={cn('brut lift group relative flex flex-col rounded-2xl bg-white p-4', className)}>
      {app.staffPick && (
        <Sticker tone="pink" rotate={4} className="absolute -top-3 right-3">
          ★ Staff pick
        </Sticker>
      )}
      {!app.staffPick && isNew && (
        <Sticker tone="lime" rotate={-4} className="absolute -top-3 right-3">
          New!
        </Sticker>
      )}
      <div className="flex items-start gap-3">
        <AppIcon app={app} size="md" className="transition-transform group-hover:-rotate-6" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-extrabold leading-tight">{app.name}</div>
          <div className="truncate text-sm text-ink/60">by {dev?.name}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
            <Stars value={app.rating} size={12} />
            <span>{app.rating.toFixed(1)}</span>
            <span className="text-ink/45">· {compact(app.installs)} installs</span>
          </div>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 flex-1 text-[15px] leading-snug text-ink/80">{app.tagline}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {installed && <Badge tone="sun">✓ Installed</Badge>}
        <SealedBadge app={app} />
        {app.supportsSpaces ? <Badge tone="white">👥 Shareable</Badge> : <Badge tone="white">🙋 Personal</Badge>}
      </div>
    </Link>
  )
}

export function AppRow({ app, right, to }: { app: AppListing; right?: React.ReactNode; to?: string }) {
  const dev = useDemo((s) => s.developers[app.developerId])
  return (
    <Link to={to ?? `/apps/${app.id}`} className="flex items-center gap-3 rounded-xl border-2 border-transparent p-2 transition-colors hover:border-ink hover:bg-white">
      <AppIcon app={app} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold leading-tight">{app.name}</div>
        <div className="truncate text-xs text-ink/60">{app.tagline || `by ${dev?.name}`}</div>
      </div>
      {right}
    </Link>
  )
}
