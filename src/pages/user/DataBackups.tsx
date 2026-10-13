import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useDemo } from '@/store'
import { PLANS } from '@/data/constants'
import { appKb, spaceRowCount, totalKb } from '@/store/selectors'
import { bg } from '@/lib/colors'
import { cn, downloadFile, formatDate, formatKb, timeAgo } from '@/lib/utils'
import { ActivityList } from '@/components/ActivityList'
import { BackupRow } from '@/components/BackupList'
import { ConfirmModal } from '@/components/flows/ConfirmModal'
import { AppIcon } from '@/components/ui/identity'
import { Badge, Button, Card, CardHeader, Meter, PageHeader, Segmented, Select } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'

export function DataBackups() {
  const installs = useDemo((s) => s.installs)
  const spaces = useDemo((s) => s.spaces)
  const apps = useDemo((s) => s.apps)
  const backups = useDemo((s) => s.backups)
  const activity = useDemo((s) => s.activity)
  const trash = useDemo((s) => s.trash)
  const plan = useDemo((s) => s.plan)
  const autoBackup = useDemo((s) => s.autoBackup)
  const setAutoBackup = useDemo((s) => s.setAutoBackup)
  const createBackup = useDemo((s) => s.createBackup)
  const restoreFromTrash = useDemo((s) => s.restoreFromTrash)
  const purge = useDemo((s) => s.purgeTrash)
  const logActivity = useDemo((s) => s.logActivity)
  const meId = useDemo((s) => s.meId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [appFilter, setAppFilter] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [purging, setPurging] = useState<string | null>(null)

  const used = totalKb({ installs, spaces })
  const limit = PLANS[plan].storageKb
  const rows = Object.values(installs)
    .map((i) => ({
      inst: i,
      app: apps[i.appId],
      kb: appKb({ installs, spaces }, i.appId),
      rows: i.spaceIds.reduce((n, id) => n + (spaces[id] ? spaceRowCount(spaces[id]) : 0), 0),
    }))
    .sort((a, b) => b.kb - a.kb)
  const events = useMemo(() => activity.filter((e) => !appFilter || e.appId === appFilter), [activity, appFilter])

  const exportEverything = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      apps: Object.values(installs).map((i) => ({
        app: apps[i.appId]?.name,
        version: i.version,
        spaces: i.spaceIds.map((id) => spaces[id]).filter(Boolean).map((sp) => ({ name: sp.name, owner: sp.ownerId === meId ? 'you' : sp.ownerId, tables: sp.tables })),
      })),
    }
    downloadFile(`my-cubby-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2))
    logActivity({ kind: 'export', text: 'You exported everything in your cubby', who: meId })
    toast({ emoji: '🧳', title: 'Everything exported', body: `${rows.length} apps, every space, every row. In one file.` })
  }

  return (
    <div>
      <PageHeader
        emoji="💾"
        title="Data & backups"
        subtitle="Everything you’ve put into Cubby, in one place. It’s yours: back it up, take it with you, or delete it."
        action={
          <Button variant="white" onClick={exportEverything}>
            🧳 Export everything
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="What’s in your cubby" emoji="📦" subtitle={`${formatKb(used)} of ${formatKb(limit)} on the ${PLANS[plan].name} plan`} action={plan === 'free' && <Link to="/account" className="text-sm font-bold underline">Get more room</Link>} />
          <div className="p-5">
            <Meter value={used} max={limit} className="h-6" segments={rows.map((r) => ({ value: Math.max(r.kb, limit * 0.004), className: bg[r.app.color], label: `${r.app.name}: ${formatKb(r.kb)}` }))} />
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink/55">
                    <th className="pb-2 font-extrabold">App</th>
                    <th className="pb-2 font-extrabold">Spaces</th>
                    <th className="pb-2 text-right font-extrabold">Rows</th>
                    <th className="pb-2 text-right font-extrabold">Size</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.app.id} className="border-t-2 border-ink/10">
                      <td className="py-2.5">
                        <Link to={`/my/${r.app.id}/data`} className="flex items-center gap-2 font-bold hover:underline">
                          <AppIcon app={r.app} size="xs" /> {r.app.name}
                        </Link>
                      </td>
                      <td className="py-2.5">{r.inst.spaceIds.length}</td>
                      <td className="py-2.5 text-right font-mono">{r.rows}</td>
                      <td className="py-2.5 text-right font-mono">{formatKb(r.kb)}</td>
                      <td className="py-2.5 text-right">
                        <Link to={`/my/${r.app.id}/data`} className="text-xs font-bold underline">
                          Browse
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink/55">Photos and files count toward storage. Backups don’t; they’re on us.</p>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Automatic backups" emoji="🤖" />
            <div className="flex flex-col gap-4 p-5">
              <Segmented
                value={autoBackup}
                onChange={(v) => {
                  if (v === 'hourly' && plan === 'free') {
                    toast({ emoji: '✨', title: 'Hourly backups are a Plus thing', body: 'Upgrade on the Account page (it’s pretend money).', tone: 'warn' })
                    return
                  }
                  setAutoBackup(v)
                  toast({ emoji: '🤖', title: v === 'off' ? 'Automatic backups off' : `Backing up ${v}` })
                }}
                options={[
                  { value: 'hourly', label: `Hourly${plan === 'free' ? ' ✨' : ''}` },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'off', label: 'Off' },
                ]}
              />
              <p className="text-sm text-ink/65">
                Kept for {plan === 'plus' ? '1 year' : '14 days'}. Plus, we always back up right before an update changes your data, no matter what.
              </p>
              <Button
                onClick={() => {
                  createBackup(undefined, 'Manual backup')
                  toast({ emoji: '💾', title: 'Backed up everything', tone: 'success' })
                }}
              >
                💾 Back up everything now
              </Button>
            </div>
          </Card>
          <Card>
            <CardHeader title="Bring data in" emoji="📥" />
            <div className="p-5">
              <p className="text-sm text-ink/65">Restore from a backup file you downloaded earlier, even from another Cubby account.</p>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) toast({ emoji: '📥', title: `Read ${f.name}`, body: 'Looks like a valid backup! (In the demo we don’t actually import it.)', tone: 'success' })
                  e.target.value = ''
                }}
              />
              <Button variant="white" className="mt-3" onClick={() => fileRef.current?.click()}>
                Choose a file…
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {trash.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Recently uninstalled" emoji="🧺" subtitle="We keep the data for 30 days, just in case." />
          <div className="divide-y-2 divide-ink/10">
            {trash.map((t) => {
              const app = apps[t.install.appId]
              return (
                <div key={t.install.appId} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <AppIcon app={app} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{app?.name}</div>
                    <div className="text-xs font-bold text-ink/55">
                      Uninstalled {timeAgo(t.deletedAt)} · deleted for good on {formatDate(t.purgeAt)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      restoreFromTrash(t.install.appId)
                      toast({ emoji: '♻️', title: `${app?.name} is back`, tone: 'success' })
                    }}
                  >
                    ♻️ Reinstall
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPurging(t.install.appId)}>
                    Delete now
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="All backups" emoji="🗂️" subtitle={`${backups.length} snapshots`} />
          <div className="divide-y-2 divide-ink/10">
            {(showAll ? backups : backups.slice(0, 8)).map((b) => (
              <BackupRow key={b.id} backup={b} />
            ))}
          </div>
          {backups.length > 8 && (
            <div className="border-t-2 border-ink/10 p-3 text-center">
              <button onClick={() => setShowAll((s) => !s)} className="text-sm font-bold underline">
                {showAll ? 'Show fewer' : `Show all ${backups.length}`}
              </button>
            </div>
          )}
        </Card>
        <Card>
          <CardHeader
            title="Access log"
            emoji="📜"
            subtitle="Every read, write, share and update, across all apps."
            action={
              <Select className="h-8.5 w-40 text-sm" value={appFilter} onChange={(e) => setAppFilter(e.target.value)}>
                <option value="">All apps</option>
                {rows.map((r) => (
                  <option key={r.app.id} value={r.app.id}>
                    {r.app.name}
                  </option>
                ))}
              </Select>
            }
          />
          <div className="max-h-[560px] overflow-y-auto px-5 py-1">
            <ActivityList events={events.slice(0, 60)} />
          </div>
          <div className={cn('border-t-2 border-ink/10 px-5 py-3 text-xs text-ink/55')}>
            <Badge tone="muted">🔐</Badge> Only you can see this log. Makers never do.
          </div>
        </Card>
      </div>

      <ConfirmModal
        open={!!purging}
        onClose={() => setPurging(null)}
        danger
        emoji="🔥"
        title="Delete it for good?"
        confirmLabel="Delete forever"
        onConfirm={() => {
          if (purging) purge(purging)
          toast({ emoji: '🔥', title: 'Gone for good' })
        }}
      >
        <p>All of this app’s data and backups will be permanently deleted.</p>
      </ConfirmModal>
    </div>
  )
}
