import { Link, useNavigate, useParams } from 'react-router'
import { startModeSwitch } from '@/lib/mode'
import { ArrowLeft } from 'lucide-react'
import { useDemo } from '@/store'
import { bg } from '@/lib/colors'
import { cn, compact, formatDate } from '@/lib/utils'
import { AppCard } from '@/components/AppCard'
import { Avatar } from '@/components/ui/identity'
import { LinkButton, Stat, Sticker } from '@/components/ui/primitives'
import { NotFound } from '../NotFound'

export function Maker() {
  const navigate = useNavigate()
  const { handle } = useParams()
  const dev = useDemo((s) => Object.values(s.developers).find((d) => d.handle === handle))
  const apps = useDemo((s) => s.apps)
  if (!dev) return <NotFound />
  const theirs = Object.values(apps).filter((a) => a.developerId === dev.id && a.published)
  const installs = theirs.reduce((n, a) => n + a.installs, 0)
  const rated = theirs.filter((a) => a.ratingCount)
  const avg = rated.length ? rated.reduce((n, a) => n + a.rating, 0) / rated.length : 0

  return (
    <div>
      <Link to="/explore" className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink">
        <ArrowLeft size={16} strokeWidth={3} /> Explore
      </Link>
      <div className={cn('brut mb-8 flex flex-col gap-6 rounded-[28px] p-8 sm:flex-row sm:items-center', bg[dev.color])}>
        <Avatar person={dev} size="lg" className="size-24 border-[3px] text-6xl shadow-brut" />
        <div className="flex-1">
          {dev.isMe && (
            <Sticker tone="white" className="mb-2">
              That’s you!
            </Sticker>
          )}
          <h1 className="text-5xl font-extrabold">{dev.name}</h1>
          <div className="mt-1 font-mono font-bold text-ink/65">@{dev.handle}</div>
          <p className="mt-3 max-w-xl text-lg">{dev.bio}</p>
          <div className="mt-2 text-sm font-bold text-ink/60">Making things on Cubby since {formatDate(dev.joinedAt, { month: 'long', year: 'numeric' })}</div>
        </div>
        {dev.isMe && (
          <LinkButton to="/workshop" variant="white" onClick={(e) => startModeSwitch(e, navigate, '/workshop')}>
            🛠️ Open your Workshop
          </LinkButton>
        )}
      </div>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Apps" value={theirs.length} emoji="📦" />
        <Stat label="Total installs" value={compact(installs)} emoji="🏠" tone="sun" />
        <Stat label="Average rating" value={avg ? avg.toFixed(1) : '—'} emoji="⭐" tone="mint" />
      </div>
      <h2 className="mb-5 text-2xl font-extrabold">Apps by {dev.name}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {theirs.map((a) => (
          <AppCard key={a.id} app={a} />
        ))}
      </div>
    </div>
  )
}
