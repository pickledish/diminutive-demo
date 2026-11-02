import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useDemo } from '@/store'
import { myRole } from '@/store/selectors'
import { cn, downloadFile } from '@/lib/utils'
import { PermissionList } from '@/components/flows/InstallFlow'
import { Modal } from '@/components/ui/Modal'
import { Button, Card, CardHeader, Textarea, Toggle } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'

function Row({ title, sub, children }: { title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div>
        <div className="font-bold">{title}</div>
        {sub && <div className="text-sm text-ink/60">{sub}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function UninstallModal({ appId, open, onClose }: { appId: string; open: boolean; onClose: () => void }) {
  const app = useDemo((s) => s.apps[appId])
  const inst = useDemo((s) => s.installs[appId])
  const spaces = useDemo((s) => s.spaces)
  const meId = useDemo((s) => s.meId)
  const uninstall = useDemo((s) => s.uninstallApp)
  const navigate = useNavigate()
  const [keep, setKeep] = useState(true)
  if (!inst) return null
  const mine = inst.spaceIds.map((id) => spaces[id]).filter(Boolean)
  const owned = mine.filter((sp) => sp.ownerId === meId)
  const joined = mine.filter((sp) => sp.ownerId !== meId)
  const affected = owned.reduce((n, sp) => n + sp.members.length - 1, 0)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Uninstall ${app.name}?`}
      emoji="📦"
      tone="cherry"
      footer={
        <>
          <Button variant="white" onClick={onClose}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              uninstall(appId, keep)
              toast({ emoji: '👋', title: `${app.name} uninstalled`, body: keep ? 'Your data is safe for 30 days if you change your mind.' : 'And its data is gone.' })
              navigate('/home')
            }}
          >
            Uninstall
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {(
            [
              [true, '🧺', 'Keep my data for 30 days', 'Reinstall anytime and everything comes back.'],
              [false, '🔥', 'Delete my data now', 'Spaces you own and their backups are deleted for good.'],
            ] as const
          ).map(([value, e, t, d]) => (
            <button
              key={String(value)}
              onClick={() => setKeep(value)}
              className={cn('flex items-start gap-3 rounded-xl border-2 p-3 text-left', keep === value ? 'border-ink bg-sun/40 shadow-brut-sm' : 'border-ink/20 bg-white hover:border-ink')}
            >
              <span className="text-2xl leading-none">{e}</span>
              <span>
                <span className="block font-bold">{t}</span>
                <span className="block text-sm text-ink/65">{d}</span>
              </span>
            </button>
          ))}
        </div>
        {(affected > 0 || joined.length > 0) && (
          <div className="rounded-xl border-2 border-ink bg-white p-3 text-sm">
            <div className="mb-1 font-bold">Heads up:</div>
            <ul className="list-disc pl-5">
              {owned
                .filter((sp) => sp.members.length > 1)
                .map((sp) => (
                  <li key={sp.id}>
                    You own <b>{sp.name}</b>. {keep ? `${sp.members.length - 1} people will keep access while it’s in your trash.` : `${sp.members.length - 1} people will lose access.`} Consider handing it over first.
                  </li>
                ))}
              {joined.map((sp) => (
                <li key={sp.id}>
                  You’ll leave <b>{sp.name}</b>. Its data stays with its owner.
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}

export function SettingsTab({ appId }: { appId: string }) {
  const app = useDemo((s) => s.apps[appId])
  const inst = useDemo((s) => s.installs[appId])
  const spaces = useDemo((s) => s.spaces)
  const meId = useDemo((s) => s.meId)
  const dev = useDemo((s) => s.developers[app.developerId])
  const setPref = useDemo((s) => s.setInstallPref)
  const sendFeedback = useDemo((s) => s.sendFeedback)
  const logActivity = useDemo((s) => s.logActivity)
  const [feedback, setFeedback] = useState('')
  const [shareName, setShareName] = useState(false)
  const [uninstalling, setUninstalling] = useState(false)
  const mine = inst.spaceIds.map((id) => spaces[id]).filter(Boolean)

  const exportAll = () => {
    const data = {
      app: { id: app.id, name: app.name, version: inst.version },
      exportedAt: new Date().toISOString(),
      schema: inst.schema,
      spaces: mine.map((sp) => ({ name: sp.name, yourRole: myRole(sp, meId), tables: sp.tables })),
    }
    downloadFile(`${app.id}-export.json`, JSON.stringify(data, null, 2))
    logActivity({ kind: 'export', appId, text: `You exported all of ${app.name}’s data`, who: meId })
    toast({ emoji: '📤', title: 'Export downloaded', body: 'Every space, every table, every row.' })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Updates" emoji="⬆️" />
          <div className="divide-y-2 divide-ink/10">
            <Row title="Install updates automatically" sub="Only updates that don’t touch your data.">
              <Toggle checked={inst.autoUpdate} onChange={(v) => setPref(appId, { autoUpdate: v })} label="Auto-update" />
            </Row>
            <Row title="Approve data changes for me" sub="Skip the “what’s changing” prompt. We still back up first, every time.">
              <Toggle checked={inst.autoApproveData} onChange={(v) => setPref(appId, { autoApproveData: v })} label="Auto-approve" />
            </Row>
            {app.permissions.includes('notifications') && (
              <Row title="Nudges from this app" sub="Reminders and pings, sent through Diminutive.">
                <Toggle checked={inst.notificationsOn} onChange={(v) => setPref(appId, { notificationsOn: v })} label="Notifications" />
              </Row>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="What it can do" emoji="🔑" subtitle="Approved when you installed it. If an update asks for more, you’ll be asked again." />
          <div className="p-5">
            <PermissionList app={app} />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Take your data with you" emoji="🧳" />
          <div className="flex flex-col gap-3 p-5">
            <p className="text-sm text-ink/70">Download everything {app.name} has stored for you, across all your spaces.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="white" onClick={exportAll}>
                📤 Export as JSON
              </Button>
              <Button variant="white" onClick={() => toast({ emoji: '🗃️', title: 'SQLite export', body: 'In the real thing, you’d get a .sqlite file you can open anywhere.' })}>
                🗃️ Export as SQLite
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={`Tell ${dev?.name.split(' ')[0]} something`} emoji="💌" subtitle="Bug reports and ideas go straight to the maker. Only your words, never your data." />
          <form
            className="flex flex-col gap-3 p-5"
            onSubmit={(e) => {
              e.preventDefault()
              if (!feedback.trim()) return
              sendFeedback(appId, feedback.trim(), shareName)
              setFeedback('')
              toast({ emoji: '💌', title: 'Sent!', body: `${dev?.name} will see your message${shareName ? ' and first name' : ', anonymously'}.`, tone: 'success' })
            }}
          >
            <Textarea rows={3} placeholder="The goblin ate my homework…" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-bold">
                <Toggle size="sm" checked={shareName} onChange={setShareName} label="Share my first name" /> Include my first name
              </label>
              <Button type="submit" size="sm" variant="blue" disabled={!feedback.trim()}>
                Send
              </Button>
            </div>
          </form>
        </Card>

        <Card className="border-cherry!">
          <CardHeader title="Danger zone" emoji="⚠️" className="bg-cherry/20" />
          <Row title={`Uninstall ${app.name}`} sub="You can keep your data around for 30 days, just in case.">
            <Button variant="danger" size="sm" onClick={() => setUninstalling(true)}>
              Uninstall
            </Button>
          </Row>
        </Card>
      </div>
      <UninstallModal appId={appId} open={uninstalling} onClose={() => setUninstalling(false)} />
    </div>
  )
}
