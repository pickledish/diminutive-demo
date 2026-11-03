import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Download, Search, Trash2 } from 'lucide-react'
import type { Cell, Column, Row } from '@/types'
import { useDemo } from '@/store'
import { myRole, spaceRowCount } from '@/store/selectors'
import { cn, compareVersions, downloadFile, formatDate, formatDateTime, timeAgo, toCsv } from '@/lib/utils'
import { bgSoft } from '@/lib/colors'
import { PersonChip } from '@/components/ui/identity'
import { Badge, EditorsNote, Card, EmptyState, Input, Segmented } from '@/components/ui/primitives'
import { ConfirmModal } from '@/components/flows/ConfirmModal'
import { toast } from '@/components/ui/toast'

export function CellView({ value, column }: { value: Cell | undefined; column?: Column }) {
  if (value === null || value === undefined) return <span className="text-ink/30">—</span>
  const type = column?.type
  if (type === 'user' && typeof value === 'string') return <PersonChip id={value} />
  if (type === 'bool' || typeof value === 'boolean')
    return <span className={cn('inline-flex size-6 items-center justify-center rounded-md border-2 border-ink text-xs font-extrabold', value ? 'bg-mint' : 'bg-white')}>{value ? '✓' : '✕'}</span>
  if (type === 'timestamp' && typeof value === 'string')
    return (
      <span title={formatDateTime(value)} className="whitespace-nowrap">
        {timeAgo(value)}
      </span>
    )
  if (type === 'date' && typeof value === 'string') return <span className="whitespace-nowrap">{formatDate(value + 'T12:00:00')}</span>
  if (type === 'json') {
    try {
      const parsed = JSON.parse(String(value))
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string' && x.startsWith('usr_')))
        return (
          <span className="flex flex-wrap gap-1">
            {parsed.map((id) => (
              <PersonChip key={id} id={id} />
            ))}
          </span>
        )
    } catch {
      /* fall through */
    }
    return <span className="font-mono text-xs">{String(value)}</span>
  }
  if (type === 'uuid' || column?.pk) return <span className="font-mono text-xs text-ink/55">{String(value)}</span>
  if (type === 'real' && typeof value === 'number') return <span className="font-mono">{value.toFixed(2)}</span>
  if (type === 'int') return <span className="font-mono">{String(value)}</span>
  return <span>{String(value)}</span>
}

export function DataTab({ appId }: { appId: string }) {
  const app = useDemo((s) => s.apps[appId])
  const inst = useDemo((s) => s.installs[appId])
  const spaces = useDemo((s) => s.spaces)
  const meId = useDemo((s) => s.meId)
  const deleteRow = useDemo((s) => s.deleteRow)
  const logActivity = useDemo((s) => s.logActivity)
  const markTour = useDemo((s) => s.markTour)
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [view, setView] = useState<'rows' | 'shape'>('rows')
  const [toDelete, setToDelete] = useState<Row | null>(null)

  useEffect(() => markTour('peek'), [markTour])

  const mine = inst.spaceIds.map((id) => spaces[id]).filter(Boolean)
  const space = mine.find((sp) => sp.id === params.get('space')) ?? mine[0]
  const tableName = inst.schema.find((t) => t.name === params.get('table'))?.name ?? inst.schema[0]?.name
  const schema = inst.schema.find((t) => t.name === tableName)
  const role = space ? myRole(space, meId) : undefined
  const canEdit = role === 'owner' || role === 'editor'
  const rows = useMemo(() => space?.tables[tableName ?? ''] ?? [], [space, tableName])
  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim()
    if (!needle) return rows
    return rows.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(needle)))
  }, [rows, q])

  const history = app.changelog.filter((c) => c.dataSummary && compareVersions(c.version, inst.version) <= 0)

  const select = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) next.set(k, v)
    setParams(next, { replace: true })
  }

  const exportTable = (fmt: 'csv' | 'json') => {
    if (!schema || !space) return
    const cols = schema.columns.map((c) => c.name)
    const name = `${app.id}-${space.name.toLowerCase().replace(/\W+/g, '-')}-${schema.name}.${fmt}`
    if (fmt === 'csv') downloadFile(name, toCsv(cols, rows), 'text/csv')
    else downloadFile(name, JSON.stringify(rows, null, 2))
    logActivity({ kind: 'export', appId, spaceId: space.id, text: `You exported ${schema.name} as ${fmt.toUpperCase()}`, who: meId })
    toast({ emoji: '📤', title: `Downloaded ${schema.name}.${fmt}`, body: `${rows.length} rows. It’s yours, do whatever you like with it.` })
  }

  if (!space || !schema) return <EmptyState emoji="🫙" title="No data yet">This app hasn’t stored anything.</EmptyState>

  return (
    <div className="flex flex-col gap-5">
      <EditorsNote>Not sure if there’s value in showing the raw data to users, but showing it here helps convey the concept at least.</EditorsNote>

      {mine.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-ink/55">Space:</span>
          {mine.map((sp) => (
            <button
              key={sp.id}
              onClick={() => select({ space: sp.id })}
              className={cn('inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-sm font-bold', sp.id === space.id ? 'bg-ink text-paper' : 'bg-white hover:bg-sun')}
            >
              {sp.emoji} {sp.name}
              <span className={cn('text-xs', sp.id === space.id ? 'text-paper/60' : 'text-ink/45')}>{spaceRowCount(sp)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-4">
          <Card className="p-2">
            <div className="px-2 pt-1 pb-2 text-[11px] font-extrabold tracking-wider text-ink/50 uppercase">Tables</div>
            {inst.schema.map((t) => (
              <button
                key={t.name}
                onClick={() => select({ table: t.name })}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg border-2 px-2.5 py-2 text-left',
                  t.name === tableName ? cn('border-ink shadow-brut-xs', bgSoft[app.color]) : 'border-transparent hover:bg-ink/5',
                )}
              >
                <span className="truncate font-mono text-sm font-bold">{t.name}</span>
                <span className="text-xs font-bold text-ink/50">{space.tables[t.name]?.length ?? 0}</span>
              </button>
            ))}
          </Card>
          {history.length > 0 && (
            <Card className="p-4">
              <div className="text-[11px] font-extrabold tracking-wider text-ink/50 uppercase">Data history</div>
              <p className="mt-1 text-xs text-ink/65">Updates that changed the shape of your data. Each one asked first.</p>
              <ol className="mt-3 flex flex-col gap-2.5 border-l-[3px] border-grape pl-3">
                {history.map((c) => (
                  <li key={c.version} className="text-xs">
                    <div className="font-mono font-extrabold">v{c.version}</div>
                    <div className="text-ink/70">{c.dataSummary?.[0]}</div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b-[3px] border-ink px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-lg font-extrabold">{schema.name}</div>
              <div className="text-xs text-ink/60">
                {schema.description} · {rows.length} rows in {space.emoji} {space.name}
              </div>
            </div>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'rows', label: 'Rows' },
                { value: 'shape', label: 'Shape' },
              ]}
            />
            <div className="flex gap-1.5">
              <button onClick={() => exportTable('csv')} className="brut-xs press inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-bold">
                <Download size={13} strokeWidth={3} /> CSV
              </button>
              <button onClick={() => exportTable('json')} className="brut-xs press inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-bold">
                <Download size={13} strokeWidth={3} /> JSON
              </button>
            </div>
          </div>

          {view === 'rows' ? (
            <>
              {rows.length > 4 && (
                <div className="relative border-b-2 border-ink/10 px-4 py-2.5">
                  <Search size={16} className="absolute top-1/2 left-7 -translate-y-1/2 text-ink/40" />
                  <Input className="h-9 pl-9 text-sm" placeholder={`Search ${rows.length} rows…`} value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
              )}
              {role === 'viewer' && <div className="border-b-2 border-ink/10 bg-sky/20 px-4 py-2 text-xs font-bold">👀 You’re a viewer in this space. You can look, not touch.</div>}
              {rows.length === 0 ? (
                <div className="p-6">
                  <EmptyState emoji="🫙" title="Nothing here yet">
                    Open {app.name} and add something. It’ll show up here instantly.
                  </EmptyState>
                </div>
              ) : (
                <div className="max-h-[560px] overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-paper">
                      <tr>
                        {schema.columns.map((c) => (
                          <th key={c.name} className="border-b-2 border-ink px-3 py-2 text-left font-mono text-xs font-extrabold whitespace-nowrap">
                            {c.name}
                            <span className="ml-1 font-normal text-ink/40">{c.type === 'user' ? 'person' : c.type}</span>
                          </th>
                        ))}
                        {canEdit && <th className="w-10 border-b-2 border-ink" />}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 100).map((r) => (
                        <tr key={r.id} className="group border-b border-ink/10 hover:bg-sun/15">
                          {schema.columns.map((c) => (
                            <td key={c.name} className="max-w-64 truncate px-3 py-2 align-middle">
                              <CellView value={r[c.name]} column={c} />
                            </td>
                          ))}
                          {canEdit && (
                            <td className="px-2">
                              <button onClick={() => setToDelete(r)} className="rounded-md p-1 text-ink/30 opacity-0 group-hover:opacity-100 hover:bg-cherry/30 hover:text-ink" aria-label="Delete row">
                                <Trash2 size={15} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && <div className="p-6 text-center text-sm text-ink/55">No rows match “{q}”.</div>}
                </div>
              )}
            </>
          ) : (
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink/55">
                    <th className="pb-2 font-extrabold">Column</th>
                    <th className="pb-2 font-extrabold">Type</th>
                    <th className="pb-2 font-extrabold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {schema.columns.map((c) => (
                    <tr key={c.name} className="border-t-2 border-ink/10">
                      <td className="py-2 font-mono font-bold">{c.name}</td>
                      <td className="py-2">
                        <Badge tone={c.type === 'user' ? 'pink' : 'muted'}>{c.type === 'user' ? 'person' : c.type}</Badge>
                      </td>
                      <td className="py-2 text-xs text-ink/65">
                        {[c.pk && 'unique id', c.ref && `points to ${c.ref}`, c.nullable && 'can be empty', c.default && `defaults to ${c.default}`].filter(Boolean).join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-ink/55">
                “person” columns hold Diminutive user IDs. The app sees a name and avatar; never an email.
              </p>
            </div>
          )}
        </Card>
      </div>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        danger
        emoji="🗑️"
        title="Delete this row?"
        confirmLabel="Delete row"
        onConfirm={() => {
          if (!toDelete) return
          deleteRow(space.id, schema.name, toDelete.id)
          toast({ emoji: '🗑️', title: 'Row deleted', body: 'Oops? Head to Backups and restore it.' })
        }}
      >
        <p>
          This removes it from <b>{schema.name}</b> in “{space.name}” right away{space.members.length > 1 ? ', for everyone in the space' : ''}. Apps usually do this for you, but it’s your data, so you can too.
        </p>
        <p className="text-sm">
          Changed your mind later? <Link to={`/my/${appId}/backups`} className="font-bold underline">Restore from a backup</Link>.
        </p>
      </ConfirmModal>
    </div>
  )
}
