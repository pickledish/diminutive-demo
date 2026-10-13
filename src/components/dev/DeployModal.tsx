import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Check, UploadCloud } from 'lucide-react'
import type { Channel } from '@/types'
import { useDemo } from '@/store'
import { bumpVersion, cn, compareVersions, sleep } from '@/lib/utils'
import { celebrate } from '@/lib/fx'
import { Modal } from '../ui/Modal'
import { Badge, Button, Callout, Input, Label, Segmented, Textarea } from '../ui/primitives'

const FAKE_FILES = ['index.html', 'assets/index-8f2a1c.js', 'assets/index-3be0.css', 'assets/goblin.svg', 'manifest.webmanifest', 'cubby.json']

export function DeployModal({ appId, open, onClose, preselect }: { appId: string; open: boolean; onClose: () => void; preselect?: string[] }) {
  const app = useDemo((s) => s.apps[appId])
  const dev = useDemo((s) => s.devApps[appId])
  const installedByMe = useDemo((s) => !!s.installs[appId])
  const deploy = useDemo((s) => s.deployRelease)
  const unreleased = useMemo(() => dev.migrations.filter((m) => !m.releaseVersion), [dev.migrations])
  const latest = useMemo(() => [...dev.releases].sort((a, b) => compareVersions(b.version, a.version))[0]?.version ?? '0.0.0', [dev.releases])
  const latestStable = latest.split('-')[0]

  const [phase, setPhase] = useState<'form' | 'deploying' | 'done'>('form')
  const [version, setVersion] = useState('')
  const [notes, setNotes] = useState('')
  const [channel, setChannel] = useState<Channel>('live')
  const [rollout, setRollout] = useState(100)
  const [migs, setMigs] = useState<string[]>([])
  const [uploaded, setUploaded] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!open) return
    const sel = preselect ?? unreleased.map((m) => m.id)
    setPhase('form')
    setMigs(sel)
    setVersion(latest === '0.0.0' ? '0.1.0' : bumpVersion(latestStable, sel.length ? 'minor' : 'patch'))
    setNotes('')
    setChannel(dev.status === 'draft' ? 'preview' : 'live')
    setRollout(100)
    setUploaded(false)
    setProgress(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const validVersion = /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version) && dev.releases.every((r) => compareVersions(version, r.version) > 0)
  const chosen = dev.migrations.filter((m) => migs.includes(m.id))
  const destructive = chosen.some((m) => m.destructive)

  const steps = [
    `Uploading ${FAKE_FILES.length + 8} files`,
    'Scanning bundle: no secrets, no tracking scripts',
    ...(chosen.length ? [`Dry-running ${chosen.length} migration${chosen.length > 1 ? 's' : ''} on synthetic data`] : []),
    'Publishing to the CDN',
  ]

  const go = async () => {
    setPhase('deploying')
    for (let i = 0; i < steps.length; i++) {
      setProgress(i)
      await sleep(650)
    }
    setProgress(steps.length)
    deploy(appId, { version, notes: notes.trim() || 'Small improvements.', channel, migrationIds: migs, source: 'web', rolloutPct: channel === 'live' ? rollout : 100 })
    setPhase('done')
    celebrate('big')
  }

  return (
    <Modal open={open} onClose={phase === 'deploying' ? () => {} : onClose} title={phase === 'done' ? 'Shipped!' : `Deploy ${app.name}`} emoji="🚀" tone="grape" size="lg"
      footer={
        phase === 'form' ? (
          <>
            <Button variant="white" onClick={onClose}>
              Cancel
            </Button>
            <Button size="lg" disabled={!validVersion || !uploaded} onClick={go} variant={destructive ? 'danger' : 'primary'}>
              🚀 Deploy v{version || '?'}
            </Button>
          </>
        ) : phase === 'done' ? (
          <Button onClick={onClose}>Nice</Button>
        ) : undefined
      }
    >
      {phase === 'form' && (
        <div className="flex flex-col gap-5">
          <button
            onClick={() => setUploaded(true)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border-[3px] border-dashed p-6 text-center transition-colors',
              uploaded ? 'border-ink bg-mint/30' : 'border-ink/35 bg-white hover:border-ink hover:bg-sun/20',
            )}
          >
            {uploaded ? (
              <>
                <div className="font-display text-lg font-extrabold">📁 dist/ · {FAKE_FILES.length + 8} files · 418 KB</div>
                <div className="flex flex-wrap justify-center gap-1">
                  {FAKE_FILES.map((f) => (
                    <span key={f} className="rounded-md border border-ink/20 bg-white px-1.5 py-0.5 font-mono text-[11px]">
                      {f}
                    </span>
                  ))}
                  <span className="px-1.5 py-0.5 font-mono text-[11px] text-ink/50">+8 more</span>
                </div>
              </>
            ) : (
              <>
                <UploadCloud size={32} strokeWidth={2.5} />
                <div className="font-display text-lg font-extrabold">Drop your build folder here</div>
                <div className="text-sm text-ink/60">
                  or click to pick one. (Or skip this and run <code className="font-mono">npx cubby deploy</code>.)
                </div>
              </>
            )}
          </button>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label hint={`Latest: ${latest}`}>Version</Label>
              <Input value={version} onChange={(e) => setVersion(e.target.value)} className={cn('font-mono', !validVersion && version && 'border-cherry')} />
              <div className="mt-1.5 flex gap-1">
                {(['patch', 'minor', 'major'] as const).map((k) => (
                  <button key={k} onClick={() => setVersion(bumpVersion(latestStable, k))} className="rounded-md border-2 border-ink/20 bg-white px-1.5 py-0.5 text-[11px] font-bold hover:border-ink">
                    {k}
                  </button>
                ))}
                {channel === 'beta' && (
                  <button onClick={() => setVersion(`${bumpVersion(latestStable, 'minor')}-beta.1`)} className="rounded-md border-2 border-ink/20 bg-white px-1.5 py-0.5 text-[11px] font-bold hover:border-ink">
                    beta
                  </button>
                )}
              </div>
              {!validVersion && version && <div className="mt-1 text-xs font-bold text-[#c42b2b]">Needs to be a new, higher version like 1.2.3</div>}
            </div>
            <div>
              <Label>Who gets it?</Label>
              <Segmented
                value={channel}
                onChange={setChannel}
                options={[
                  { value: 'live', label: '🌍 Everyone' },
                  { value: 'beta', label: `β Beta (${dev.betaTesters})` },
                  { value: 'preview', label: '👁 Just me' },
                ]}
              />
              {channel === 'live' && dev.status === 'draft' && <div className="mt-1.5 text-xs text-ink/60">Not published yet, so “everyone” is still just you until you publish.</div>}
            </div>
          </div>

          {channel === 'live' && dev.status !== 'draft' && (
            <div>
              <Label hint="Start small, watch for problems, then go to 100%.">Staged rollout: {rollout}% of installs</Label>
              <input type="range" min={5} max={100} step={5} value={rollout} onChange={(e) => setRollout(Number(e.target.value))} className="w-full accent-ink" />
            </div>
          )}

          <div>
            <Label>What changed? (users see this)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dark mode! Plus the goblin now waves at you." />
          </div>

          {unreleased.length > 0 ? (
            <div>
              <Label hint="Users will be asked to approve before these touch their data.">Migrations to ship</Label>
              <div className="flex flex-col gap-2">
                {unreleased.map((m) => {
                  const on = migs.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMigs((x) => (on ? x.filter((y) => y !== m.id) : [...x, m.id]))}
                      className={cn('flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left', on ? 'border-ink bg-grape/30' : 'border-ink/20 bg-white')}
                    >
                      <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-ink', on ? 'bg-ink text-paper' : 'bg-white')}>{on && <Check size={12} strokeWidth={4} />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-sm font-bold">{m.filename}</span>
                        <span className="block text-xs text-ink/65">{m.summary[0]}</span>
                      </span>
                      {m.destructive && <Badge tone="cherry">destructive</Badge>}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <Callout emoji="✨" tone="mint">
              No new migrations, so this is a <b>frontend-only</b> release. Users with auto-update get it right away, no questions asked.
            </Callout>
          )}
        </div>
      )}

      {phase !== 'form' && (
        <div className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <div key={s} className={cn('flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all', i < progress ? 'border-ink bg-mint/40' : i === progress ? 'border-ink bg-sun/40' : 'border-ink/15 bg-white text-ink/40')}>
              <span className={cn('flex size-6 items-center justify-center rounded-full border-2 border-ink text-xs', i < progress ? 'bg-mint' : 'bg-white')}>
                {i < progress ? <Check size={14} strokeWidth={4} /> : i === progress ? <span className="size-2 animate-ping rounded-full bg-ink" /> : ''}
              </span>
              <span className="font-bold">{s}</span>
            </div>
          ))}
          {phase === 'done' && (
            <div className="mt-2 animate-pop rounded-2xl border-[3px] border-ink bg-sun p-5">
              <div className="font-display text-2xl font-extrabold">
                v{version} is {channel === 'live' ? 'live' : channel === 'beta' ? 'out to beta testers' : 'ready to preview'} 🎉
              </div>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                {chosen.length > 0 && channel === 'live' ? (
                  <li>🙋 Installs will be asked to approve your data change. Track the rollout on the Migrations tab.</li>
                ) : (
                  channel === 'live' && <li>⚡ Frontend-only, so installs with auto-update are already on it.</li>
                )}
                {channel === 'live' && rollout < 100 && <li>🚦 Rolling out to {rollout}% of installs first.</li>}
                {installedByMe && channel === 'live' && (
                  <li>
                    👀 You have {app.name} installed too.{' '}
                    <Link to="/home" onClick={onClose} className="font-bold underline">
                      Hop over to My Cubby
                    </Link>{' '}
                    to see it arrive {chosen.length ? '(and approve it)' : ''}.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}