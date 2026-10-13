import { Link } from 'react-router'
import { Play } from 'lucide-react'
import type { Install } from '@/types'
import { useDemo } from '@/store'
import { bg } from '@/lib/colors'
import { cn, formatKb, timeAgo } from '@/lib/utils'
import { appKb } from '@/store/selectors'
import { AppIcon, AvatarStack } from './ui/identity'
import { LinkButton, Sticker } from './ui/primitives'

export function InstalledTile({ install }: { install: Install }) {
  const app = useDemo((s) => s.apps[install.appId])
  const spaces = useDemo((s) => s.spaces)
  const kb = useDemo((s) => appKb(s, install.appId))
  const pending = useDemo((s) => s.pendingUpdates[install.appId])
  const meId = useDemo((s) => s.meId)
  if (!app) return null
  const mySpaces = install.spaceIds.map((id) => spaces[id]).filter(Boolean)
  const people = [...new Set(mySpaces.flatMap((sp) => sp.members.map((m) => m.personId)).filter((id) => id !== meId))]

  return (
    <div className="brut lift group relative flex flex-col overflow-hidden rounded-2xl bg-white">
      {pending && (
        <Sticker tone="pink" rotate={3} className="absolute top-2 right-2 z-10">
          Update ready
        </Sticker>
      )}
      <Link to={`/my/${app.id}`} className={cn('flex items-center gap-3 border-b-[3px] border-ink p-4', bg[app.color])}>
        <AppIcon app={app} size="md" color="white" className="bg-white transition-transform group-hover:-rotate-6" />
        <div className="min-w-0">
          <div className="truncate font-display text-xl font-extrabold leading-tight">{app.name}</div>
          <div className="text-xs font-bold text-ink/65">
            v{install.version} · {formatKb(kb)}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          {mySpaces.map((sp) => (
            <Link
              key={sp.id}
              to={`/my/${app.id}/spaces`}
              className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-paper px-2 py-0.5 text-xs font-bold hover:bg-sun"
            >
              {sp.emoji} {sp.name}
              {sp.members.length > 1 && <span className="text-ink/50">· {sp.members.length}</span>}
            </Link>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {people.length ? <AvatarStack ids={people} size="xs" max={4} /> : <span className="text-xs font-bold text-ink/45">Just you</span>}
          <span className="text-[11px] font-bold text-ink/45">{install.lastOpenedAt ? `opened ${timeAgo(install.lastOpenedAt)}` : 'never opened'}</span>
        </div>
      </div>
      <div className="flex gap-2 border-t-2 border-ink/10 p-3">
        <LinkButton to={`/run/${app.id}`} size="sm" variant="mint" className="flex-1">
          <Play size={14} strokeWidth={3} className="fill-ink" /> Open
        </LinkButton>
        <LinkButton to={`/my/${app.id}`} size="sm" variant="white" className="flex-1">
          Manage
        </LinkButton>
      </div>
    </div>
  )
}
