import { useMemo, useState } from 'react'
import type { Release } from '@/types'
import { useDemo } from '@/store'
import { liveRelease } from '@/lib/dev'
import { compareVersions, formatDate, formatKb, timeAgo } from '@/lib/utils'
import { Badge, Button, Callout, Card, CardHeader } from '@/components/ui/primitives'
import { ChannelBadge } from '@/components/Badges'
import { ConfirmModal } from '@/components/flows/ConfirmModal'
import { toast } from '@/components/ui/toast'
import { celebrate } from '@/lib/fx'

const SOURCE = { cli: '⌨️ CLI', web: '🖱️ Web', github: '🐙 GitHub' } as const

export function ReleasesTab({ appId, onDeploy }: { appId: string; onDeploy: () => void }) {
  const app = useDemo((s) => s.apps[appId])
  const dev = useDemo((s) => s.devApps[appId])
  const promote = useDemo((s) => s.promoteRelease)
  const rollback = useDemo((s) => s.rollbackTo)
  const setRollout = useDemo((s) => s.setRollout)
  const [confirm, setConfirm] = useState<{ kind: 'promote' | 'rollback'; release: Release } | null>(null)

  const releases = useMemo(() => [...dev.releases].sort((a, b) => compareVersions(b.version, a.version)), [dev.releases])
  const live = liveRelease(dev)
  const beta = releases.find((r) => r.channel === 'beta')
  const preview = releases.find((r) => r.channel === 'preview')
  const migName = (id: string) => dev.migrations.find((m) => m.id === id)?.filename ?? id

  const crossedMigrations = (target: Release) =>
    live ? dev.releases.filter((r) => compareVersions(r.version, target.version) > 0 && compareVersions(r.version, live.version) <= 0).flatMap((r) => r.migrationIds) : []

  const doConfirm = () => {
    if (!confirm) return
    const { kind, release } = confirm
    if (kind === 'promote') {
      promote(appId, release.id)
      celebrate()
      toast({ emoji: '🌍', title: `v${release.version} is live`, body: release.migrationIds.length ? 'Installs will be asked to approve the data change.' : 'Auto-updating installs are getting it now.', tone: 'success' })
    } else {
      rollback(appId, release.id)
      toast({ emoji: '↩️', title: `Rolled back to v${release.version}`, body: 'Installs on newer versions are switching back now.' })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-2 bg-mint/30 p-5">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-extrabold">🌍 Everyone</span>
            <ChannelBadge channel="live" />
          </div>
          {live ? (
            <>
              <div className="font-mono text-3xl font-extrabold">v{live.version}</div>
              <div className="text-sm text-ink/70">{live.notes}</div>
              <div className="mt-auto pt-2">
                <div className="mb-1 flex items-center justify-between text-xs font-bold">
                  <span>Rollout</span>
                  <span>{live.rolloutPct}% of installs</span>
                </div>
                <input type="range" min={5} max={100} step={5} value={live.rolloutPct} onChange={(e) => setRollout(appId, live.id, Number(e.target.value))} className="w-full accent-ink" aria-label="Rollout percentage" />
                {live.rolloutPct < 100 && (
                  <Button size="xs" variant="white" className="mt-1" onClick={() => setRollout(appId, live.id, 100)}>
                    Go to 100%
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-ink/60">Nothing live yet.</div>
          )}
        </Card>
        <Card className="flex flex-col gap-2 bg-grape/25 p-5">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-extrabold">β Beta testers</span>
            <Badge tone="white">{dev.betaTesters} people</Badge>
          </div>
          {beta ? (
            <>
              <div className="font-mono text-3xl font-extrabold">v{beta.version}</div>
              <div className="text-sm text-ink/70">{beta.notes}</div>
              <Button size="sm" className="mt-auto self-start" onClick={() => setConfirm({ kind: 'promote', release: beta })}>
                Promote to everyone
              </Button>
            </>
          ) : (
            <div className="text-sm text-ink/60">Nothing in beta. Users can opt in to betas from the app’s settings.</div>
          )}
        </Card>
        <Card className="flex flex-col gap-2 bg-sky/25 p-5">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-extrabold">👁 Just you</span>
            <ChannelBadge channel="preview" />
          </div>
          {preview ? (
            <>
              <div className="font-mono text-3xl font-extrabold">v{preview.version}</div>
              <div className="text-sm text-ink/70">{preview.notes}</div>
              <Button size="sm" className="mt-auto self-start" onClick={() => setConfirm({ kind: 'promote', release: preview })}>
                Promote to everyone
              </Button>
            </>
          ) : (
            <div className="text-sm text-ink/60">Every PR and every <code className="font-mono">cubby deploy --preview</code> gets a private link, tested against fake data.</div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="All releases" emoji="📦" subtitle="Old versions stay around so you can roll back in one click." action={<Button size="sm" variant="grape" onClick={onDeploy}>🚀 Deploy</Button>} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b-2 border-ink/10 text-left text-xs font-extrabold tracking-wide text-ink/50 uppercase">
                <th className="px-5 py-2">Version</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2">Data changes</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-ink/10">
              {releases.map((r) => {
                const older = live && compareVersions(r.version, live.version) < 0
                return (
                  <tr key={r.id} className={r.channel === 'live' ? 'bg-mint/15' : ''}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">v{r.version}</span>
                        <ChannelBadge channel={r.channel} />
                      </div>
                    </td>
                    <td className="max-w-xs px-3 py-3 text-ink/75">{r.notes}</td>
                    <td className="px-3 py-3">
                      {r.migrationIds.length ? (
                        <div className="flex flex-col gap-1">
                          {r.migrationIds.map((id) => (
                            <span key={id} className="font-mono text-xs">
                              🧬 {migName(id)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-ink/45">none</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink/65">
                      {formatKb(r.sizeKb)} · {r.files} files
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs font-bold">{SOURCE[r.source]}</span> <span className="font-mono text-xs text-ink/45">{r.commit}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink/65" title={formatDate(r.createdAt)}>
                      {timeAgo(r.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="white"
                          title="Open preview link"
                          onClick={() => toast({ emoji: '👁', title: `Preview of v${r.version}`, body: `Opens v${r.version.replace(/\./g, '-')}--${appId}.cubby.app with a sandbox cubby full of fake data.` })}
                        >
                          👁
                        </Button>
                        {(r.channel === 'beta' || r.channel === 'preview' || (r.channel === 'archived' && !older)) && (
                          <Button size="xs" onClick={() => setConfirm({ kind: 'promote', release: r })}>
                            Make live
                          </Button>
                        )}
                        {r.channel === 'archived' && older && (
                          <Button size="xs" variant="white" onClick={() => setConfirm({ kind: 'rollback', release: r })}>
                            ↩️ Roll back
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Callout emoji="🐙" tone="white" action={<Button size="sm" variant="white" onClick={() => toast({ emoji: '🐙', title: 'GitHub connected (pretend)', body: 'Pushes to main will deploy to beta. Tag a release to go live.' })}>Connect</Button>}>
        <b>Deploy from GitHub.</b> Push to <code className="font-mono">main</code> to ship to beta, open a PR to get a preview link, tag a release to go live.
      </Callout>

      {confirm && (
        <ConfirmModal
          open
          onClose={() => setConfirm(null)}
          onConfirm={doConfirm}
          emoji={confirm.kind === 'promote' ? '🌍' : '↩️'}
          title={confirm.kind === 'promote' ? `Make v${confirm.release.version} live?` : `Roll back to v${confirm.release.version}?`}
          confirmLabel={confirm.kind === 'promote' ? 'Ship it' : 'Roll back'}
          danger={confirm.kind === 'rollback'}
        >
          {confirm.kind === 'promote' ? (
            <>
              <p>
                Everyone on {app.name} gets v{confirm.release.version}
                {dev.status === 'draft' ? ' (which is just you, until you publish)' : ''}.
              </p>
              {confirm.release.migrationIds.length > 0 ? (
                <p>
                  🧬 It includes <b>{confirm.release.migrationIds.length} data change{confirm.release.migrationIds.length > 1 ? 's' : ''}</b>, so each install will be asked to approve it first.
                </p>
              ) : (
                <p>⚡ No data changes, so installs with auto-update switch right away.</p>
              )}
            </>
          ) : (
            <>
              <p>Installs on newer versions switch back to v{confirm.release.version}’s frontend right away. Pending updates are withdrawn.</p>
              {crossedMigrations(confirm.release).length > 0 && (
                <p className="rounded-lg border-2 border-ink bg-sun/50 p-2 text-sm">
                  ⚠️ Rolling back the frontend <b>doesn’t undo data changes</b> ({crossedMigrations(confirm.release).map(migName).join(', ')}). Make sure v{confirm.release.version} copes with the newer data shape. Additive changes are usually fine.
                </p>
              )}
            </>
          )}
        </ConfirmModal>
      )}
    </div>
  )
}
