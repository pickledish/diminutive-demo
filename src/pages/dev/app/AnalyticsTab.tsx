import { useMemo, useState } from 'react'
import { useDemo } from '@/store'
import { getAnalytics, kAnon } from '@/lib/analytics'
import { formatKb } from '@/lib/utils'
import { BarChart, HBar, StackedBar } from '@/components/ui/Charts'
import { TabIntro, Card, CardHeader, EmptyState, Segmented, Stat } from '@/components/ui/primitives'

const RANGES = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
] as const

export function AnalyticsTab({ appId }: { appId: string }) {
  const app = useDemo((s) => s.apps[appId])
  const dev = useDemo((s) => s.devApps[appId])
  const [range, setRange] = useState<'7' | '30' | '90'>('30')
  const a = useMemo(() => getAnalytics(app, dev, Number(range)), [app, dev, range])

  if (app.installs === 0) {
    return (
      <EmptyState emoji="📊" title="No numbers yet" className="bg-white">
        Once people install {app.name}, you’ll see counts here. Always aggregated, never personal, and hidden below 10 installs so nobody can be singled out.
      </EmptyState>
    )
  }

  const labelFmt = (d: string) => (range === '7' ? new Date(d).toLocaleDateString('en-US', { weekday: 'short' }) : d.slice(5).replace('-', '/'))
  const maxReads = Math.max(1, ...a.tables.map((t) => t.reads))
  const net = a.totals.newInRange - a.totals.uninstallsInRange

  return (
    <div className="flex flex-col gap-6">
      <TabIntro action={<Segmented value={range} onChange={setRange} options={[...RANGES]} />}>
        Counts, not people. Anything based on fewer than 10 installs shows as “&lt;10”.
      </TabIntro>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="New installs" value={`+${kAnon(a.totals.newInRange)}`} emoji="🌱" tone="mint" sub={`in the last ${range} days`} />
        <Stat label="Uninstalls" value={kAnon(a.totals.uninstallsInRange)} emoji="👋" sub={`net ${net >= 0 ? '+' : ''}${net.toLocaleString()}`} />
        <Stat label="Opens per day" value={kAnon(a.totals.opensPerDay)} emoji="⚡" tone="accent" sub="average" />
        <Stat label="Errors" value={a.totals.errorsPer1k} emoji="🐛" sub="per 1,000 sessions" />
      </div>

      <Card>
        <CardHeader title="New installs per day" emoji="📈" subtitle="Pink bars are release days." />
        <div className="p-5">
          <BarChart
            data={a.series.map((d) => ({
              label: labelFmt(d.date),
              value: d.installs,
              highlight: dev.releases.some((r) => r.channel !== 'preview' && r.createdAt.slice(0, 10) === d.date),
            }))}
            barClass="bg-accent"
            height={190}
            format={kAnon}
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Versions in use" emoji="🧩" subtitle="Installs approve data changes at their own pace." />
          <div className="p-5">
            <StackedBar parts={a.versions.map((v) => ({ label: v.version === 'older' ? 'older' : `v${v.version}`, value: v.pct }))} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Do people stick around?" emoji="🧲" subtitle="Share of installs still opening it after…" />
          <div className="grid grid-cols-3 gap-3 p-5 text-center">
            {(
              [
                ['1 day', a.retention.d1, 'bg-mint'],
                ['1 week', a.retention.d7, 'bg-sky'],
                ['1 month', a.retention.d30, 'bg-grape'],
              ] as const
            ).map(([l, v, c]) => (
              <div key={l} className="flex flex-col items-center gap-2">
                <div className="relative h-24 w-14 overflow-hidden rounded-xl border-2 border-ink bg-white">
                  <div className={`absolute inset-x-0 bottom-0 border-t-2 border-ink ${c}`} style={{ height: `${v}%` }} />
                </div>
                <div className="font-display text-2xl font-extrabold">{v}%</div>
                <div className="text-xs font-bold text-ink/55">{l}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader title="Activity by table" emoji="🗄️" subtitle="Reads and writes per day. Volume only, no contents." />
          <div className="flex flex-col gap-2.5 p-5">
            {a.tables.map((t) => (
              <div key={t.name} className="flex flex-col gap-1">
                <HBar label={t.name} value={t.reads} max={maxReads} className="bg-sky" right={`${kAnon(t.reads)} r`} />
                <HBar label="" value={t.writes} max={maxReads} className="bg-bubblegum" right={`${kAnon(t.writes)} w`} />
              </div>
            ))}
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="font-display text-lg font-extrabold">👥 Sharing</div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <div className="font-display text-3xl font-extrabold">{kAnon(a.totals.sharedSpaces)}</div>
                <div className="text-xs font-bold text-ink/55">shared spaces</div>
              </div>
              <div>
                <div className="font-display text-3xl font-extrabold">{a.totals.avgMembers}</div>
                <div className="text-xs font-bold text-ink/55">people per space, on average</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="font-display text-lg font-extrabold">💾 Storage per install</div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <div className="font-display text-3xl font-extrabold">{formatKb(a.totals.medianKb)}</div>
                <div className="text-xs font-bold text-ink/55">typical</div>
              </div>
              <div>
                <div className="font-display text-3xl font-extrabold">{formatKb(a.totals.p90Kb)}</div>
                <div className="text-xs font-bold text-ink/55">biggest 10%</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-ink/55">Storage counts against your users’ plans, not yours. Small apps are polite apps.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
