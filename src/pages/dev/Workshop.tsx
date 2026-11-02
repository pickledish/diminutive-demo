import { useMemo } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Plus } from 'lucide-react'
import type { DevApp } from '@/types'
import { useDemo } from '@/store'
import { getAnalytics } from '@/lib/analytics'
import { hex } from '@/lib/colors'
import { compact, money, timeAgo } from '@/lib/utils'
import { Sparkline } from '@/components/ui/Charts'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { AppIcon } from '@/components/ui/identity'
import { Badge, Card, CardHeader, LinkButton, PageHeader, Stars, Stat } from '@/components/ui/primitives'

export function StatusBadge({ status }: { status: DevApp['status'] }) {
  if (status === 'live') return <Badge tone="mint">● Live in Explore</Badge>
  if (status === 'unlisted') return <Badge tone="white">🔗 Unlisted</Badge>
  return <Badge tone="muted">✏️ Draft</Badge>
}

function DevAppCard({ dev }: { dev: DevApp }) {
  const app = useDemo((s) => s.apps[dev.appId])
  const a = useMemo(() => getAnalytics(app, dev, 30), [app, dev])
  const live = dev.releases.find((r) => r.channel === 'live')
  const newBugs = dev.bugReports.filter((b) => b.status === 'new').length
  return (
    <Link to={`/workshop/${dev.appId}/releases`} className="brut lift flex flex-col rounded-2xl bg-white">
      <div className="flex items-start gap-3 p-4">
        <AppIcon app={app} size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-xl font-extrabold">{app.name}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <StatusBadge status={dev.status} />
            {live && <Badge tone="white">v{live.version}</Badge>}
            {newBugs > 0 && <Badge tone="cherry">🐛 {newBugs} new</Badge>}
          </div>
        </div>
      </div>
      {dev.status === 'draft' ? (
        <div className="mx-4 mb-4 rounded-xl border-2 border-dashed border-ink/30 bg-surface-2 p-3 text-sm">
          <div className="font-bold">Not published yet</div>
          <div className="text-ink/60">{dev.releases.length ? `${dev.releases.length} preview release · only you can open it` : 'Deploy your first build to get started'}</div>
        </div>
      ) : (
        <div className="px-4">
          <Sparkline values={a.series.map((d) => d.installs)} fill={hex[app.color]} />
          <div className="mt-2 grid grid-cols-3 gap-2 pb-4 text-center">
            <div>
              <div className="font-display text-xl font-extrabold">{compact(app.installs)}</div>
              <div className="text-[11px] font-bold text-ink/55">installs</div>
            </div>
            <div>
              <div className="font-display text-xl font-extrabold">+{compact(a.totals.newInRange)}</div>
              <div className="text-[11px] font-bold text-ink/55">last 30d</div>
            </div>
            <div>
              <div className="font-display text-xl font-extrabold">{app.rating ? app.rating.toFixed(1) : '—'}</div>
              <div className="text-[11px] font-bold text-ink/55">rating</div>
            </div>
          </div>
        </div>
      )}
      <div className="mt-auto flex items-center justify-between border-t-2 border-ink/10 px-4 py-2.5 text-sm font-bold">
        <span className="text-ink/55">Updated {timeAgo(app.updatedAt)}</span>
        <span className="flex items-center gap-1">
          Manage <ArrowRight size={14} strokeWidth={3} />
        </span>
      </div>
    </Link>
  )
}

export function Workshop() {
  const devApps = useDemo((s) => s.devApps)
  const apps = useDemo((s) => s.apps)
  const list = Object.values(devApps).sort((a, b) => apps[b.appId].installs - apps[a.appId].installs)
  const live = list.filter((d) => d.status !== 'draft')
  const installs = live.reduce((n, d) => n + apps[d.appId].installs, 0)
  const tips = list.reduce((n, d) => n + d.tipsCents, 0)
  const active = live.reduce((n, d) => n + getAnalytics(apps[d.appId], d, 7).totals.active7, 0)
  const rated = live.filter((d) => apps[d.appId].ratingCount)
  const avg = rated.length ? rated.reduce((n, d) => n + apps[d.appId].rating, 0) / rated.length : 0
  const feedback = list
    .flatMap((d) => [
      ...apps[d.appId].reviews.slice(0, 2).map((r) => ({ id: r.id, appId: d.appId, at: r.date, text: r.text, who: `${r.authorEmoji} ${r.authorName}`, kind: `${'★'.repeat(r.rating)}` })),
      ...d.bugReports.map((b) => ({ id: b.id, appId: d.appId, at: b.at, text: b.text, who: b.from, kind: '🐛 bug report' })),
    ])
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5)

  return (
    <div>
      <PageHeader
        emoji="🛠️"
        title="Your Workshop"
        subtitle="Ship apps to real people. Diminutive handles login, data, sharing and backups, and you never touch anyone’s data."
        action={
          <>
            <LinkButton to="/workshop/docs" variant="white">
              📚 Docs & SDK
            </LinkButton>
            <LinkButton to="/workshop/new">
              <Plus size={16} strokeWidth={3} /> New app
            </LinkButton>
          </>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total installs" value={compact(installs)} emoji="🏠" tone="accent" sub="across your published apps" />
        <Stat label="Active this week" value={compact(active)} emoji="⚡" sub="opened at least once" />
        <Stat label="Tips received" value={money(tips)} emoji="💛" tone="pink" sub="100% yours, Diminutive takes 0%" />
        <Stat label="Average rating" value={avg ? avg.toFixed(1) : '—'} emoji="⭐" tone="mint" sub={<Stars value={avg} size={11} />} />
      </div>

      <div className="grid items-start gap-x-8 gap-y-4 lg:grid-cols-[1fr_340px]">
        <h2 className="text-2xl font-extrabold">Your apps</h2>
        <section className="lg:col-start-1">
          <div className="grid gap-5 sm:grid-cols-2">
            {list.map((d) => (
              <DevAppCard key={d.appId} dev={d} />
            ))}
            <Link
              to="/workshop/new"
              className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-ink/35 text-ink/55 transition-colors hover:border-ink hover:bg-white hover:text-ink"
            >
              <span className="flex size-12 items-center justify-center rounded-full border-[3px] border-current">
                <Plus size={24} strokeWidth={3} />
              </span>
              <span className="font-display text-lg font-extrabold">Start a new app</span>
              <span className="text-sm">Takes about 30 seconds</span>
            </Link>
          </div>
        </section>
        <aside className="flex flex-col gap-6 lg:col-start-2 lg:row-start-2">
          <Card>
            <CardHeader title="Latest feedback" emoji="💬" />
            <div className="divide-y-2 divide-ink/10">
              {feedback.map((f) => (
                <Link key={f.id} to={`/workshop/${f.appId}/feedback`} className="flex gap-3 px-5 py-3 hover:bg-accent/20">
                  <AppIcon app={apps[f.appId]} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm leading-snug">{f.text}</div>
                    <div className="mt-0.5 text-[11px] font-bold text-ink/50">
                      {f.kind} · {f.who} · {timeAgo(f.at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
          <div>
            <div className="mb-2 font-display text-lg font-extrabold">Ship from your terminal</div>
            <CodeBlock
              lang="sh"
              code={`npx diminutive login
npx diminutive deploy        # uploads dist/ + migrations/
npx diminutive deploy --beta # ship to beta testers first`}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
