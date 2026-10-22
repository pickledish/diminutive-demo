import { useMemo } from 'react'
import { Link } from 'react-router'
import { Trash2 } from 'lucide-react'
import type { Migration } from '@/types'
import { useDemo } from '@/store'
import { headSchema } from '@/lib/dev'
import { formatDate } from '@/lib/utils'
import { StackedBar } from '@/components/ui/Charts'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { Badge, Button, Callout, Card, EmptyState } from '@/components/ui/primitives'
import { SchemaCards } from '@/components/SchemaCards'
import { toast } from '@/components/ui/toast'

function SafetyBadges({ m }: { m: Migration }) {
  return (
    <>
      {m.destructive ? <Badge tone="cherry">destructive</Badge> : <Badge tone="mint">additive</Badge>}
      {m.reversible ? <Badge tone="white">↩ reversible</Badge> : <Badge tone="tangerine">one-way</Badge>}
    </>
  )
}

function SqlToggle({ m }: { m: Migration }) {
  return (
    <details className="group mt-3">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg border-2 border-ink/20 bg-white px-2 py-0.5 text-xs font-bold select-none hover:border-ink">
        <span className="group-open:hidden">Show SQL</span>
        <span className="hidden group-open:inline">Hide SQL</span>
      </summary>
      <CodeBlock lang="sql" code={m.sql} className="mt-2" />
    </details>
  )
}

function MigrationCard({ m, appId, index }: { m: Migration; appId: string; index: number }) {
  const total = m.stats.applied + m.stats.pending + m.stats.failed
  const live = useDemo((s) => s.devApps[appId].releases.some((r) => r.channel !== 'beta' && r.channel !== 'preview' && r.migrationIds.includes(m.id)))
  return (
    <div className="relative pl-10">
      <div className="absolute top-0 left-0 flex size-8 items-center justify-center rounded-full border-[3px] border-ink bg-white font-mono text-xs font-extrabold">{index}</div>
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-extrabold">{m.filename}</span>
          <Badge tone="grape">v{m.releaseVersion}</Badge>
          <SafetyBadges m={m} />
          <span className="ml-auto text-xs font-bold text-ink/50">{formatDate(m.createdAt)}</span>
        </div>
        <div className="mt-3 rounded-xl border-2 border-dashed border-ink/25 bg-paper px-3 py-2 text-sm">
          <div className="mb-0.5 text-[11px] font-extrabold tracking-wide text-ink/45 uppercase">Users were told</div>
          {m.summary.map((s) => (
            <div key={s}>• {s}</div>
          ))}
        </div>

        {total > 0 ? (
          <div className="mt-4">
            <StackedBar
              parts={[
                { label: `Updated (${m.stats.applied.toLocaleString()})`, value: m.stats.applied, className: 'bg-mint' },
                { label: `Waiting for OK (${m.stats.pending.toLocaleString()})`, value: m.stats.pending, className: 'bg-sun' },
                { label: `Rolled back (${m.stats.failed})`, value: m.stats.failed, className: 'bg-cherry' },
              ]}
            />
          </div>
        ) : (
          <div className="mt-3 text-sm text-ink/55">{live ? 'No installs yet.' : 'Only in a beta or preview so far. Real installs haven’t seen it.'}</div>
        )}

        {m.failures.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="text-xs font-extrabold tracking-wide text-ink/50 uppercase">Failures · anonymous, no data attached</div>
            {m.failures.map((f) => (
              <div key={f.code} className="rounded-xl border-2 border-ink bg-cherry/15 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded bg-ink px-1.5 py-0.5 font-mono text-xs text-paper">{f.code}</code>
                  <span className="font-bold">
                    {f.count} install{f.count > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-1">{f.message}</div>
                <div className="mt-1 text-ink/65">↩️ {f.resolution}</div>
              </div>
            ))}
          </div>
        )}
        <SqlToggle m={m} />
      </Card>
    </div>
  )
}

export function MigrationsTab({ appId, onDeploy }: { appId: string; onDeploy: () => void }) {
  const app = useDemo((s) => s.apps[appId])
  const dev = useDemo((s) => s.devApps[appId])
  const del = useDemo((s) => s.deleteMigration)
  const unreleased = dev.migrations.filter((m) => !m.releaseVersion)
  const released = dev.migrations.filter((m) => m.releaseVersion)
  const schema = useMemo(() => headSchema(app, dev), [app, dev])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-extrabold">Migrations</h2>
        <p className="mt-1 text-ink/70">
          Migrations are SQL files you commit in your repo, and they ship inside a release. Cubby carries each one to every install with your summary, a backup, and automatic undo if anything breaks.{' '}
          <Link to="/workshop/docs" className="font-bold underline">
            How it works
          </Link>
        </p>
      </div>

      {unreleased.length > 0 && (
        <Card className="overflow-hidden border-dashed bg-grape/15">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink px-5 py-3">
            <div>
              <div className="font-display text-lg font-extrabold">📦 Waiting on a release</div>
              <div className="text-sm text-ink/65">Committed in your repo. They go out with your next release.</div>
            </div>
            <Button size="sm" onClick={onDeploy}>
              🚀 Ship in a release
            </Button>
          </div>
          <div className="flex flex-col gap-3 p-5">
            {unreleased.map((m) => (
              <div key={m.id} className="rounded-xl border-2 border-ink bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-extrabold">{m.filename}</span>
                  <SafetyBadges m={m} />
                  <Button
                    size="xs"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => {
                      del(appId, m.id)
                      toast({ emoji: '🗑️', title: `Deleted ${m.filename}` })
                    }}
                  >
                    <Trash2 size={14} strokeWidth={2.5} /> Delete
                  </Button>
                </div>
                <div className="mt-2 text-sm">
                  {m.summary.map((s) => (
                    <div key={s}>• {s}</div>
                  ))}
                </div>
                <SqlToggle m={m} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <h3 className="mb-4 text-xl font-extrabold">History</h3>
          {released.length ? (
            <div className="relative flex flex-col gap-5 before:absolute before:top-4 before:bottom-4 before:left-[15px] before:w-[3px] before:bg-ink/15">
              {[...released].reverse().map((m) => (
                <MigrationCard key={m.id} m={m} appId={appId} index={dev.migrations.indexOf(m) + 1} />
              ))}
            </div>
          ) : (
            <EmptyState emoji="🧬" title="No migrations yet">
              Add a <span className="font-mono">migrations/0001_*.sql</span> file and include it in a release. That first file creates the tables your app remembers.
            </EmptyState>
          )}
        </section>
        <aside className="flex flex-col gap-4">
          <h3 className="text-xl font-extrabold">Schema now</h3>
          <SchemaCards schema={schema} color={app.color} stacked />
          <Callout emoji="🙈" tone="white">
            This is the <b>shape</b> of every install’s data. You’ll never see what’s inside.
          </Callout>
        </aside>
      </div>
    </div>
  )
}
