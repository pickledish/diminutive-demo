import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { useDemo } from '@/store'
import { describeOps, lintSql } from '@/lib/sql'
import { headSchema, nextMigrationPrefix } from '@/lib/dev'
import { cn, sleep, slugify } from '@/lib/utils'
import { Modal } from '../ui/Modal'
import { AppIcon } from '../ui/identity'
import { Badge, Button, Input, Label, Textarea } from '../ui/primitives'
import { toast } from '../ui/toast'

type DryRun = { state: 'idle' } | { state: 'running' } | { state: 'pass'; ms: number } | { state: 'fail'; reason: string }

export function NewMigrationModal({ appId, open, onClose }: { appId: string; open: boolean; onClose: () => void }) {
  const app = useDemo((s) => s.apps[appId])
  const dev = useDemo((s) => s.devApps[appId])
  const add = useDemo((s) => s.addMigration)
  const schema = useMemo(() => headSchema(app, dev), [app, dev])
  const prefix = nextMigrationPrefix(dev)

  const t = schema[0]
  const col = t?.columns.find((c) => !c.pk && c.type === 'text')?.name ?? 'name'
  const examples = useMemo(
    () => [
      ['➕ Add a column', `alter table ${t?.name ?? 'items'} add column notes text;`, 'add_notes'],
      ['🆕 Add a table', `create table favorites (\n  id uuid primary key,\n  label text not null,\n  added_by cubby_user,\n  created_at timestamp default now()\n);`, 'favorites'],
      ['✏️ Rename', `alter table ${t?.name ?? 'items'} rename column ${col} to title;`, `rename_${col}`],
      ['💣 Drop a column', `alter table ${t?.name ?? 'items'} drop column ${col};`, `drop_${col}`],
      ['🙈 Oops', `alter table ${t?.name ?? 'items'} add column priority int not null;`, 'priority'],
    ],
    [t, col],
  )

  const [name, setName] = useState('')
  const [sql, setSql] = useState('')
  const [summary, setSummary] = useState('')
  const [touched, setTouched] = useState(false)
  const [dry, setDry] = useState<DryRun>({ state: 'idle' })

  useEffect(() => {
    if (!open) return
    setName(examples[0][2])
    setSql(`-- Users never see this SQL. They read the summary below.\n${examples[0][1]}`)
    setSummary('')
    setTouched(false)
    setDry({ state: 'idle' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const lint = useMemo(() => lintSql(sql, schema), [sql, schema])
  const suggested = describeOps(lint.ops).join('\n')
  const shownSummary = touched ? summary : suggested
  const lines = shownSummary
    .split('\n')
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
  const blocking = lint.checks.filter((c) => c.blocking)
  const filename = `${prefix}_${slugify(name).replace(/-/g, '_') || 'change'}.sql`
  const canSave = lint.statements > 0 && !blocking.length && lines.length > 0

  const runDry = async () => {
    setDry({ state: 'running' })
    await sleep(1100)
    if (blocking.length) setDry({ state: 'fail', reason: blocking[0].text })
    else setDry({ state: 'pass', ms: 400 + Math.round(Math.random() * 900) })
  }

  const save = () => {
    add(appId, { filename, sql: sql.trim(), summary: lines, ops: lint.ops, destructive: lint.destructive, reversible: lint.reversible })
    toast({ emoji: '🧬', title: `Saved ${filename}`, body: 'It ships with your next release. Nobody’s data changes until then.', tone: 'success' })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New migration"
      emoji="🧬"
      tone="grape"
      size="xl"
      footer={
        <>
          <span className="mr-auto text-xs text-ink/55">{blocking.length ? 'Fix the red ✕ issues to save.' : !lines.length ? 'Write a summary for users to save.' : 'Saved migrations ship with your next release.'}</span>
          <Button variant="white" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="blue" onClick={runDry} disabled={dry.state === 'running' || !lint.statements}>
            {dry.state === 'running' ? 'Running…' : '🧪 Dry run'}
          </Button>
          <Button onClick={save} disabled={!canSave}>
            Save migration
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <Label>File name</Label>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border-2 border-ink bg-ink px-2 py-2 font-mono text-sm text-paper">{prefix}_</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="font-mono" />
              <span className="font-mono text-sm text-ink/50">.sql</span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold">SQL</div>
              <div className="flex flex-wrap gap-1">
                {examples.map(([label, code, n]) => (
                  <button
                    key={label}
                    onClick={() => {
                      setSql(code)
                      setName(n)
                      setTouched(false)
                      setDry({ state: 'idle' })
                    }}
                    className="rounded-md border-2 border-ink/20 bg-white px-1.5 py-0.5 text-[11px] font-bold hover:border-ink"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={sql}
              onChange={(e) => {
                setSql(e.target.value)
                setDry({ state: 'idle' })
              }}
              spellCheck={false}
              rows={8}
              className="w-full rounded-xl border-2 border-ink bg-ink p-3 font-mono text-[13px] leading-relaxed text-paper outline-none focus:shadow-brut-sm"
            />
          </div>
          <div>
            <div className="mb-1.5 text-sm font-bold">Cubby’s safety check</div>
            <div className="flex flex-col gap-1.5">
              {lint.checks.map((c, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2 rounded-lg border-2 px-3 py-2 text-sm',
                    c.level === 'ok' ? 'border-ink/15 bg-mint/25' : c.level === 'warn' ? 'border-ink/15 bg-sun/35' : 'border-ink bg-cherry/25',
                  )}
                >
                  {c.level === 'ok' ? (
                    <CheckCircle2 size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                  ) : c.blocking ? (
                    <XCircle size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                  )}
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
          {dry.state !== 'idle' && (
            <div
              className={cn(
                'animate-pop rounded-xl border-2 border-ink p-3 text-sm',
                dry.state === 'running' ? 'bg-sky/30' : dry.state === 'pass' ? 'bg-mint/50' : 'bg-cherry/40',
              )}
            >
              {dry.state === 'running' && <b>🧪 Spinning up 3 synthetic cubbies shaped like your schema…</b>}
              {dry.state === 'pass' && (
                <>
                  <b>✅ Passed on 3 of 3 synthetic cubbies</b> in {(dry.ms / 1000).toFixed(1)}s: empty, typical (≈240 rows) and huge (50,000 rows).
                </>
              )}
              {dry.state === 'fail' && (
                <>
                  <b>❌ Failed on 2 of 3 synthetic cubbies.</b> {dry.reason} Real installs would have rolled back automatically.
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Label hint="Plain words, one change per line. This is all users see.">Summary for users</Label>
            <Textarea
              rows={4}
              value={shownSummary}
              onChange={(e) => {
                setTouched(true)
                setSummary(e.target.value)
              }}
              placeholder="Adds a notes field to each item"
            />
            {touched && suggested && (
              <button onClick={() => setTouched(false)} className="mt-1 text-xs font-bold underline">
                Reset to Cubby’s suggestion
              </button>
            )}
          </div>
          <div>
            <div className="mb-1.5 text-xs font-extrabold tracking-wider text-ink/50 uppercase">What users will see</div>
            <div className="brut-sm rounded-2xl bg-white p-4">
              <div className="flex items-center gap-2">
                <AppIcon app={app} size="xs" />
                <div className="font-display leading-tight font-extrabold">{app.name} wants to update your data</div>
              </div>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {lines.length ? lines.map((l) => <li key={l}>• {l}</li>) : <li className="text-ink/40">• …</li>}
              </ul>
              {lint.destructive && <div className="mt-3 rounded-lg border-2 border-ink bg-cherry/30 px-2 py-1.5 text-xs font-bold">⚠️ Some existing data will be permanently removed.</div>}
              <div className="mt-3 flex items-center gap-1.5 text-xs text-ink/55">💾 Cubby backs up first. If anything goes wrong, it undoes itself.</div>
              <div className="mt-3 flex gap-2">
                <span className="flex-1 rounded-lg border-2 border-ink bg-sun py-1 text-center text-xs font-bold">Update</span>
                <span className="flex-1 rounded-lg border-2 border-ink/30 py-1 text-center text-xs font-bold text-ink/50">Not now</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lint.destructive ? <Badge tone="cherry">destructive</Badge> : <Badge tone="mint">additive</Badge>}
            {lint.reversible ? <Badge tone="white">↩ reversible</Badge> : <Badge tone="tangerine">one-way</Badge>}
            <Badge tone="white">
              {lint.statements} statement{lint.statements === 1 ? '' : 's'}
            </Badge>
          </div>
        </div>
      </div>
    </Modal>
  )
}
