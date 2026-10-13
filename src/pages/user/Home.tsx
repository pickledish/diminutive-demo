import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Plus } from 'lucide-react'
import { useDemo, useMe } from '@/store'
import { PLANS } from '@/data/constants'
import { appKb, isShared, totalKb } from '@/store/selectors'
import { formatKb, plural, timeAgo } from '@/lib/utils'
import { bg } from '@/lib/colors'
import { InstalledTile } from '@/components/InstalledTile'
import { InviteCard } from '@/components/InviteCard'
import { ActivityList } from '@/components/ActivityList'
import { AppRow } from '@/components/AppCard'
import { UpdateReviewModal } from '@/components/flows/UpdateReview'
import { AppIcon } from '@/components/ui/identity'
import { Button, Card, CardHeader, LinkButton, Meter } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'

function UpdateCard({ appId }: { appId: string }) {
  const upd = useDemo((s) => s.pendingUpdates[appId])
  const app = useDemo((s) => s.apps[appId])
  const [open, setOpen] = useState(false)
  if (!upd || !app) return null
  const changesData = upd.dataSummary.length > 0
  return (
    <div className="brut flex flex-col rounded-2xl bg-sun p-4">
      <div className="flex items-start gap-3">
        <AppIcon app={app} size="md" />
        <div className="min-w-0">
          <div className="leading-snug font-bold">
            {app.name} {upd.toVersion} {changesData ? 'wants to update your data' : 'is ready'}
          </div>
          <div className="mt-0.5 text-xs font-bold text-ink/60">
            {upd.snoozed ? 'Snoozed · ' : ''}released {timeAgo(upd.releasedAt)}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-snug">{upd.dataSummary[0] ?? upd.notes}</p>
      <div className="mt-auto flex gap-2 pt-4">
        <Button variant="dark" className="flex-1" onClick={() => setOpen(true)}>
          Review update
        </Button>
      </div>
      <UpdateReviewModal appId={appId} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export function Home() {
  const me = useMe()
  const installs = useDemo((s) => s.installs)
  const spaces = useDemo((s) => s.spaces)
  const invites = useDemo((s) => s.invites)
  const pending = useDemo((s) => s.pendingUpdates)
  const activity = useDemo((s) => s.activity)
  const apps = useDemo((s) => s.apps)
  const backups = useDemo((s) => s.backups)
  const plan = useDemo((s) => s.plan)
  const autoBackup = useDemo((s) => s.autoBackup)
  const createBackup = useDemo((s) => s.createBackup)

  const list = Object.values(installs).sort((a, b) => (b.lastOpenedAt ?? '').localeCompare(a.lastOpenedAt ?? ''))
  const used = totalKb({ installs, spaces })
  const limit = PLANS[plan].storageKb
  const sharedCount = Object.values(spaces).filter((sp) => installs[sp.appId]?.spaceIds.includes(sp.id) && isShared(sp)).length
  const pendingIds = Object.keys(pending).filter((id) => installs[id])
  const needsYou = pendingIds.length + invites.length
  const suggestions = Object.values(apps)
    .filter((a) => a.published && !installs[a.id])
    .sort((a, b) => b.installs - a.installs)
    .slice(0, 4)
  const byApp = list.map((i) => ({ app: apps[i.appId], kb: appKb({ installs, spaces }, i.appId) })).sort((a, b) => b.kb - a.kb)
  const lastBackup = backups[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Hey there' : 'Good evening'

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            {greeting}, {me.name.split(' ')[0]} <span className="inline-block animate-wiggle">👋</span>
          </h1>
          <p className="mt-2 text-lg text-ink/70">
            {plural(list.length, 'app')} on your shelf · {plural(sharedCount, 'shared space')} · {formatKb(used)} stored
          </p>
        </div>
        <LinkButton to="/explore" variant="white">
          Find more apps <ArrowRight size={16} strokeWidth={3} />
        </LinkButton>
      </div>

      {needsYou > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-extrabold">
            Needs you <span className="rounded-full border-2 border-ink bg-cherry px-2 text-sm">{needsYou}</span>
          </h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pendingIds.map((id) => (
              <UpdateCard key={id} appId={id} />
            ))}
            {invites.map((inv) => (
              <InviteCard key={inv.id} invite={inv} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="mb-4 text-2xl font-extrabold">Your shelf</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((i) => (
              <InstalledTile key={i.appId} install={i} />
            ))}
            <Link
              to="/explore"
              className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-ink/35 text-ink/55 transition-colors hover:border-ink hover:bg-white hover:text-ink"
            >
              <span className="flex size-12 items-center justify-center rounded-full border-[3px] border-current">
                <Plus size={24} strokeWidth={3} />
              </span>
              <span className="font-display text-lg font-extrabold">Add an app</span>
            </Link>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-2xl font-extrabold">Your people also use</h2>
              <div className="grid gap-1 rounded-2xl border-[3px] border-ink bg-paper p-2 sm:grid-cols-2">
                {suggestions.map((a) => (
                  <AppRow key={a.id} app={a} right={<span className="text-xs font-bold text-ink/50">View →</span>} />
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Storage" emoji="📦" action={<Link to="/account" className="text-xs font-bold underline">{PLANS[plan].name} plan</Link>} />
            <div className="p-5">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-display text-2xl font-extrabold">{formatKb(used)}</span>
                <span className="text-sm font-bold text-ink/55">of {formatKb(limit)}</span>
              </div>
              <Meter
                value={used}
                max={limit}
                segments={byApp.map(({ app, kb }) => ({ value: Math.max(kb, limit * 0.004), className: bg[app.color], label: `${app.name}: ${formatKb(kb)}` }))}
              />
              <div className="mt-4 flex flex-col gap-2">
                {byApp.slice(0, 4).map(({ app, kb }) => (
                  <div key={app.id} className="flex items-center gap-2 text-sm">
                    <span className={`size-3 rounded-sm border-2 border-ink ${bg[app.color]}`} />
                    <span className="flex-1 truncate font-bold">{app.name}</span>
                    <span className="text-ink/60">{formatKb(kb)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Backups" emoji="💾" action={<Link to="/data" className="text-xs font-bold underline">All backups</Link>} />
            <div className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full border-2 border-ink bg-mint text-lg">✓</span>
                <div>
                  <div className="font-bold">Last backup {lastBackup ? timeAgo(lastBackup.createdAt) : 'never'}</div>
                  <div className="text-xs text-ink/60">Automatic: {autoBackup === 'off' ? 'off' : autoBackup}</div>
                </div>
              </div>
              <Button
                variant="white"
                size="sm"
                className="mt-4 w-full"
                onClick={() => {
                  createBackup(undefined, 'Manual backup')
                  toast({ emoji: '💾', title: 'Backed up everything', body: 'Snapshot saved. Restore it anytime from Data & backups.', tone: 'success' })
                }}
              >
                Back up everything now
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="What’s been happening" emoji="📜" subtitle="Every read, write and share, logged." />
            <div className="px-5 py-2">
              <ActivityList events={activity.slice(0, 7)} />
            </div>
            <div className="border-t-2 border-ink/10 px-5 py-3 text-center">
              <Link to="/data" className="text-sm font-bold underline">
                See the full log
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
