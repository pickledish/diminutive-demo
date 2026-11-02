import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useDemo } from '@/store'
import { describeOps } from '@/lib/sql'
import { celebrate } from '@/lib/fx'
import { cn, formatKb, timeAgo } from '@/lib/utils'
import { spaceKb } from '@/store/selectors'
import { toast } from '../ui/toast'
import { Modal } from '../ui/Modal'
import { AppIcon } from '../ui/identity'
import { Badge, Button, Callout } from '../ui/primitives'
import { CodeBlock } from '../ui/CodeBlock'

export function UpdateReviewModal({ appId, open, onClose }: { appId: string; open: boolean; onClose: () => void }) {
  const upd = useDemo((s) => s.pendingUpdates[appId])
  const app = useDemo((s) => s.apps[appId])
  const inst = useDemo((s) => s.installs[appId])
  const spaces = useDemo((s) => s.spaces)
  const people = useDemo((s) => s.people)
  const meId = useDemo((s) => s.meId)
  const dev = useDemo((s) => s.developers[app?.developerId])
  const devApp = useDemo((s) => s.devApps[appId])
  const apply = useDemo((s) => s.applyUpdate)
  const snooze = useDemo((s) => s.snoozeUpdate)
  const [tech, setTech] = useState(false)

  if (!upd || !app || !inst) return null
  const changesData = upd.ops.length > 0 || upd.migrationIds.length > 0
  const mySpaces = inst.spaceIds.map((id) => spaces[id]).filter(Boolean)
  const sql = devApp?.migrations.filter((m) => upd.migrationIds.includes(m.id))

  const go = () => {
    apply(appId)
    celebrate()
    toast({
      emoji: app.emoji,
      title: `${app.name} is on ${upd.toVersion}`,
      body: changesData ? 'Backed up first, then updated. Peek at the Data tab to see what changed.' : 'All done.',
      tone: 'success',
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      tone={upd.destructive ? 'cherry' : app.color}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          {app.name} wants to update
        </span>
      }
      footer={
        <>
          <Button
            variant="white"
            onClick={() => {
              snooze(appId)
              onClose()
              toast({ emoji: '⏰', title: 'Okay, later', body: `${app.name} keeps working on ${upd.fromVersion} until you’re ready.` })
            }}
          >
            Not now
          </Button>
          <Button onClick={go} variant={upd.destructive ? 'danger' : 'primary'} size="lg">
            {changesData ? '💾 Back up & update' : 'Update'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <AppIcon app={app} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono text-sm font-bold">
              <Badge tone="muted">v{upd.fromVersion}</Badge>→<Badge tone="mint">v{upd.toVersion}</Badge>
            </div>
            <p className="mt-1.5 text-[17px] leading-snug font-bold">{upd.notes}</p>
            <p className="mt-1 text-sm text-ink/55">
              From {dev?.name} · released {timeAgo(upd.releasedAt)}
            </p>
          </div>
        </div>

        {changesData ? (
          <div className={cn('rounded-2xl border-[3px] border-ink p-4', upd.destructive ? 'bg-cherry/25' : 'bg-sun/35')}>
            <div className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold">
              {upd.destructive ? '⚠️ This update permanently removes some data' : '🧬 This update changes the shape of your data'}
            </div>
            <ul className="flex flex-col gap-2">
              {upd.dataSummary.map((line, i) => (
                <li key={i} className="flex gap-2 leading-snug">
                  <span className="mt-0.5 font-extrabold">→</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 text-xs font-bold text-ink/55">Written by the developer · checked by Diminutive</div>
          </div>
        ) : (
          <Callout emoji="✨" tone="mint">
            No data changes, just a new version of the app itself.
          </Callout>
        )}

        {changesData && (
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ['💾', 'Backup first', 'We snapshot your data before anything changes.'],
              ['🧪', 'Pre-tested', 'Diminutive ran this change on sample data before release.'],
              ['↩️', 'Auto-undo', 'If anything fails, we roll back. Your app keeps working.'],
            ].map(([e, t, d]) => (
              <div key={t} className="rounded-xl border-2 border-ink bg-white p-3">
                <div className="text-xl">{e}</div>
                <div className="mt-1 text-sm font-extrabold">{t}</div>
                <div className="text-xs text-ink/65">{d}</div>
              </div>
            ))}
          </div>
        )}

        {changesData && mySpaces.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-extrabold tracking-wider text-ink/50 uppercase">Spaces that will update</div>
            <div className="flex flex-col gap-1.5">
              {mySpaces.map((sp) => (
                <div key={sp.id} className="flex items-center gap-2 rounded-lg border-2 border-ink/15 bg-white px-3 py-2 text-sm">
                  <span>{sp.emoji}</span>
                  <span className="font-bold">{sp.name}</span>
                  <span className="text-ink/50">
                    {sp.members.length > 1 ? `shared with ${sp.members.length - 1}` : 'just you'} · {formatKb(spaceKb(sp))}
                  </span>
                  <span className="ml-auto text-xs font-bold text-ink/50">{sp.ownerId === meId ? 'You own this' : `Owned by ${people[sp.ownerId]?.name.split(' ')[0]}`}</span>
                </div>
              ))}
            </div>
            {mySpaces.some((sp) => sp.members.length > 1) && (
              <p className="mt-2 text-xs text-ink/60">Everyone in a shared space sees the new version once its owner says yes.</p>
            )}
          </div>
        )}

        {changesData && (
          <div>
            <button onClick={() => setTech((t) => !t)} className="flex items-center gap-1 text-sm font-bold text-ink/70 hover:text-ink">
              {tech ? <ChevronDown size={16} /> : <ChevronRight size={16} />} Technical details (for the curious)
            </button>
            {tech && (
              <div className="mt-2 flex flex-col gap-3">
                <ul className="list-disc pl-5 text-sm">
                  {describeOps(upd.ops).map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
                {sql?.map((m) => <CodeBlock key={m.id} code={m.sql} lang="sql" title={m.filename} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
