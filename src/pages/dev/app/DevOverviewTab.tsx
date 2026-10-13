import { useMemo } from 'react'
import { Link } from 'react-router'
import { Check } from 'lucide-react'
import { useDemo } from '@/store'
import { getAnalytics, kAnon } from '@/lib/analytics'
import { liveRelease } from '@/lib/dev'
import { celebrate } from '@/lib/fx'
import { cn, compact, formatDate, money, timeAgo } from '@/lib/utils'
import { BarChart, StackedBar } from '@/components/ui/Charts'
import { Badge, Button, Callout, Card, CardHeader, LinkButton, Stars, Stat } from '@/components/ui/primitives'
import { ChannelBadge } from '@/components/Badges'
import { toast } from '@/components/ui/toast'

function Checklist({ appId, onDeploy }: { appId: string; onDeploy: () => void }) {
  const app = useDemo((s) => s.apps[appId])
  const dev = useDemo((s) => s.devApps[appId])
  const setStatus = useDemo((s) => s.setDevStatus)
  const live = liveRelease(dev)
  const base = `/workshop/${appId}`

  const publish = () => {
    setStatus(appId, 'live')
    celebrate('big')
    toast({ emoji: '🎉', title: `${app.name} is in Explore!`, body: 'Anyone can install it now. Go tell your group chat.', tone: 'success' })
  }

  const items = [
    { done: true, title: 'Create your app', body: 'You did it. It has a name and everything.' },
    {
      done: dev.migrations.length > 0,
      title: 'Describe your data',
      body: 'Write a migration that creates your tables.',
      action: <LinkButton to={`${base}/migrations`} size="sm" variant="white">Open migrations</LinkButton>,
    },
    {
      done: dev.releases.length > 0,
      title: 'Deploy a build',
      body: 'Upload your static files. A preview only you can see is fine.',
      action: <Button size="sm" variant="white" onClick={onDeploy}>Deploy</Button>,
    },
    {
      done: app.description.length > app.tagline.length + 20,
      title: 'Write your store listing',
      body: 'A couple of sentences about who it’s for.',
      action: <LinkButton to={`${base}/listing`} size="sm" variant="white">Edit listing</LinkButton>,
    },
    {
      done: !!live,
      title: 'Ship a live release',
      body: 'Promote your preview, or deploy straight to “Everyone”.',
      action: <LinkButton to={`${base}/releases`} size="sm" variant="white">Releases</LinkButton>,
    },
    {
      done: false,
      title: 'Publish to Explore',
      body: live ? 'Ready when you are!' : 'Needs a live release first.',
      action: (
        <Button size="sm" disabled={!live} onClick={publish}>
          🎉 Publish
        </Button>
      ),
    },
  ]
  const doneCount = items.filter((i) => i.done).length

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Getting to launch" emoji="🗺️" subtitle={`${doneCount} of ${items.length} done`} className="bg-sun" />
      <div className="divide-y-2 divide-ink/10">
        {items.map((it, i) => {
          const next = !it.done && items.slice(0, i).every((x) => x.done)
          return (
            <div key={it.title} className={cn('flex items-center gap-4 px-5 py-3.5', next && 'bg-sun/20')}>
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full border-[3px] border-ink font-extrabold', it.done ? 'bg-mint' : 'bg-white')}>
                {it.done ? <Check size={16} strokeWidth={4} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className={cn('font-bold', it.done && 'text-ink/50 line-through')}>{it.title}</div>
                <div className="text-sm text-ink/60">{it.body}</div>
              </div>
              {!it.done && it.action}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function DevOverviewTab({ appId, onDeploy }: { appId: string; onDeploy: () => void }) {
  const app = useDemo((s) => s.apps[appId])
  const dev = useDemo((s) => s.devApps[appId])
  const a = useMemo(() => getAnalytics(app, dev, 30), [app, dev])
  const live = liveRelease(dev)
  const beta = dev.releases.find((r) => r.channel === 'beta')
  const rolling = dev.migrations.filter((m) => m.releaseVersion && m.stats.pending + m.stats.failed > 0)
  const week = a.series.slice(-7).reduce((n, d) => n + d.installs, 0)
  const feedback = [
    ...app.reviews.map((r) => ({ id: r.id, at: r.date, text: r.text, meta: `${'★'.repeat(r.rating)} · ${r.authorName}`, todo: !r.reply })),
    ...dev.bugReports.map((b) => ({ id: b.id, at: b.at, text: b.text, meta: `🐛 ${b.from}`, todo: b.status === 'new' })),
  ]
    .sort((x, y) => y.at.localeCompare(x.at))
    .slice(0, 4)

  if (dev.status === 'draft') {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Checklist appId={appId} onDeploy={onDeploy} />
        <div className="flex flex-col gap-4">
          <Callout emoji="✏️" tone="white">
            <b>Drafts are private.</b> Only you (and collaborators) can open preview releases. Nothing shows up in Explore until you publish.
          </Callout>
          <Callout emoji="🧪" tone="sky">
            Testing sharing? Run <code className="font-mono">npx cubby dev --people 3</code> to fake a household of three.
          </Callout>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Installs" value={compact(app.installs)} emoji="🏠" tone="sun" />
        <Stat label="Active this week" value={kAnon(a.totals.active7)} emoji="⚡" />
        <Stat label="New this week" value={`+${kAnon(week)}`} emoji="🌱" tone="mint" />
        <Stat label="Rating" value={app.rating ? app.rating.toFixed(1) : '—'} emoji="⭐" sub={<Stars value={app.rating} size={11} />} />
        <Stat label="Tips" value={money(dev.tipsCents)} emoji="💛" tone="pink" className="col-span-2 lg:col-span-1" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="New installs" subtitle="Last 30 days" emoji="📈" action={<LinkButton to={`/workshop/${appId}/analytics`} size="sm" variant="white">More</LinkButton>} />
            <div className="p-5">
              <BarChart data={a.series.map((d) => ({ label: d.date.slice(5), value: d.installs }))} barClass="bg-sun" height={150} format={kAnon} />
            </div>
          </Card>

          <Card>
            <CardHeader title="What’s out there" emoji="🚀" action={<Button size="sm" variant="grape" onClick={onDeploy}>Deploy</Button>} />
            <div className="divide-y-2 divide-ink/10">
              {[live, beta].filter((r) => r !== undefined).map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <ChannelBadge channel={r.channel} />
                  <span className="font-mono font-bold">v{r.version}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink/70">{r.notes}</span>
                  <span className="text-xs font-bold text-ink/50">
                    {r.channel === 'beta' ? `${dev.betaTesters} testers` : r.rolloutPct < 100 ? `${r.rolloutPct}% rollout` : 'everyone'} · {timeAgo(r.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {rolling.map((m) => (
            <Card key={m.id} className="p-5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="font-mono text-sm font-extrabold">{m.filename}</div>
                <Badge tone="white">v{m.releaseVersion}</Badge>
              </div>
              <div className="mb-3 text-sm text-ink/65">Rolling out since {formatDate(m.createdAt)}</div>
              <StackedBar
                parts={[
                  { label: 'Updated', value: m.stats.applied, className: 'bg-mint' },
                  { label: 'Waiting for OK', value: m.stats.pending, className: 'bg-sun' },
                  { label: 'Rolled back', value: m.stats.failed, className: 'bg-cherry' },
                ]}
              />
              <Link to={`/workshop/${appId}/migrations`} className="mt-3 inline-block text-sm font-bold underline">
                See details
              </Link>
            </Card>
          ))}

          <Card>
            <CardHeader title="Recent feedback" emoji="💬" action={<LinkButton to={`/workshop/${appId}/feedback`} size="sm" variant="white">All</LinkButton>} />
            <div className="divide-y-2 divide-ink/10">
              {feedback.length ? (
                feedback.map((f) => (
                  <div key={f.id} className="px-5 py-3">
                    <div className="line-clamp-2 text-sm">{f.text}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-ink/50">
                      {f.meta} · {timeAgo(f.at)}
                      {f.todo && <Badge tone="sun" className="py-0 text-[10px]">needs you</Badge>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-6 text-center text-sm text-ink/55">No feedback yet. Quiet is good, probably.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
