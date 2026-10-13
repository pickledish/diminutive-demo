import { useMemo } from 'react'
import { Link } from 'react-router'
import { useDemo } from '@/store'
import { appKb, isShared, myRole, spaceKb, spaceRowCount } from '@/store/selectors'
import { formatKb, timeAgo } from '@/lib/utils'
import { ActivityList } from '@/components/ActivityList'
import { RoleBadge, SealedBadge } from '@/components/Badges'
import { PermissionList } from '@/components/flows/InstallFlow'
import { AvatarStack } from '@/components/ui/identity'
import { Badge, Card, CardHeader, Stat } from '@/components/ui/primitives'

export function OverviewTab({ appId }: { appId: string }) {
  const app = useDemo((s) => s.apps[appId])
  const inst = useDemo((s) => s.installs[appId])
  const spaces = useDemo((s) => s.spaces)
  const installs = useDemo((s) => s.installs)
  const activity = useDemo((s) => s.activity)
  const backups = useDemo((s) => s.backups)
  const meId = useDemo((s) => s.meId)
  const people = useDemo((s) => s.people)

  const mine = inst.spaceIds.map((id) => spaces[id]).filter(Boolean)
  const rows = mine.reduce((n, sp) => n + spaceRowCount(sp), 0)
  const kb = appKb({ installs, spaces }, appId)
  const events = useMemo(() => activity.filter((e) => e.appId === appId).slice(0, 6), [activity, appId])
  const lastBackup = backups.find((b) => !b.appId || b.appId === appId)
  const sharedWith = new Set(mine.flatMap((sp) => sp.members.map((m) => m.personId)).filter((id) => id !== meId)).size

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Stored" value={formatKb(kb)} emoji="📦" />
          <Stat label="Rows" value={rows} emoji="🧾" tone="sun" />
          <Stat label="Shared with" value={sharedWith} sub={sharedWith === 1 ? 'person' : 'people'} emoji="👥" tone="pink" />
          <Stat label="Last backup" value={lastBackup ? timeAgo(lastBackup.createdAt).replace(' ago', '') : '—'} sub={lastBackup ? 'ago' : undefined} emoji="💾" tone="mint" />
        </div>

        <Card>
          <CardHeader title="Spaces" emoji="👥" subtitle="Each space is a separate pile of data. Shared ones are visible to everyone inside." action={<Link to={`/my/${appId}/spaces`} className="text-sm font-bold underline">Manage</Link>} />
          <div className="divide-y-2 divide-ink/10">
            {mine.map((sp) => {
              const role = myRole(sp, meId)
              return (
                <Link key={sp.id} to={`/my/${appId}/data?space=${sp.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-sun/20">
                  <span className="flex size-10 items-center justify-center rounded-xl border-2 border-ink bg-paper text-xl">{sp.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{sp.name}</div>
                    <div className="text-xs font-bold text-ink/55">
                      {spaceRowCount(sp)} rows · {formatKb(spaceKb(sp))} · {sp.ownerId === meId ? 'owned by you' : `owned by ${people[sp.ownerId]?.name}`}
                    </div>
                  </div>
                  {isShared(sp) ? <AvatarStack ids={sp.members.map((m) => m.personId)} size="xs" /> : <Badge tone="muted">just you</Badge>}
                  {role && <RoleBadge role={role} />}
                </Link>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent activity" emoji="📜" action={<Link to={`/my/${appId}/activity`} className="text-sm font-bold underline">Full log</Link>} />
          <div className="px-5 py-1">{events.length ? <ActivityList events={events} showApp={false} /> : <p className="py-4 text-sm text-ink/60">Nothing yet.</p>}</div>
        </Card>
      </div>

      <aside className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Version" emoji="🏷️" />
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-2xl font-extrabold">v{inst.version}</span>
              {inst.version === app.version ? <Badge tone="mint">Up to date</Badge> : <Badge tone="sun">v{app.version} available</Badge>}
            </div>
            <div className="mt-1 text-xs font-bold text-ink/55">
              Updated {timeAgo(inst.updatedAt)} · auto-updates {inst.autoUpdate ? 'on' : 'off'}
            </div>
            {app.changelog[0] && (
              <div className="mt-4 rounded-xl border-2 border-ink/15 bg-paper p-3 text-sm">
                <div className="font-mono text-xs font-extrabold">v{app.changelog[0].version}</div>
                <div className="mt-0.5">{app.changelog[0].notes}</div>
              </div>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="What it can do" emoji="🔑" action={<SealedBadge app={app} />} />
          <div className="p-5">
            <PermissionList app={app} compact />
          </div>
        </Card>
      </aside>
    </div>
  )
}
