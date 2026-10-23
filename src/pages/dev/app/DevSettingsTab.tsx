import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Copy, X } from 'lucide-react'
import { useDemo } from '@/store'
import { PERMISSIONS } from '@/data/constants'
import { copyText } from '@/lib/utils'
import { Badge, Button, Callout, Card, CardHeader, Input, Segmented } from '@/components/ui/primitives'
import { ConfirmModal } from '@/components/flows/ConfirmModal'
import { toast } from '@/components/ui/toast'

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-sm font-bold">{label}</div>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl border-2 border-ink bg-surface-2 px-3 py-2 font-mono text-sm">{value}</code>
        <Button
          size="sm"
          variant="white"
          onClick={() => {
            copyText(value)
            toast({ emoji: '📋', title: 'Copied' })
          }}
        >
          <Copy size={14} strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  )
}

function Section({ title, emoji, subtitle, children }: { title: string; emoji: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} emoji={emoji} subtitle={subtitle} />
      <div className="flex flex-col gap-4 p-5">{children}</div>
    </Card>
  )
}

export function DevSettingsTab({ appId }: { appId: string }) {
  const app = useDemo((s) => s.apps[appId])
  const dev = useDemo((s) => s.devApps[appId])
  const setNetwork = useDemo((s) => s.setNetwork)
  const addCollab = useDemo((s) => s.addCollaborator)
  const removeCollab = useDemo((s) => s.removeCollaborator)
  const setStatus = useDemo((s) => s.setDevStatus)
  const deleteApp = useDemo((s) => s.deleteDevApp)
  const navigate = useNavigate()
  const [domain, setDomain] = useState('')
  const [collab, setCollab] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const validDomain = /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(domain.trim()) && !app.network.includes(domain.trim().toLowerCase())

  const addDomain = () => {
    setNetwork(appId, [...app.network, domain.trim().toLowerCase()])
    setDomain('')
    toast({ emoji: '🌐', title: 'Network access updated', body: 'Ships with your next release. Installs will be asked to OK it first.' })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <Section title="Keys" emoji="🔑">
          <CopyField label="App ID" value={appId} />
          <CopyField label="Publishable key" value={dev.publishableKey} />
          <Callout emoji="🤷" tone="white">
            <b>There’s no secret key.</b> There’s no backend to protect. This key can only ever reach the cubby of whoever is logged in, so it’s fine to put in your frontend code.
          </Callout>
        </Section>

        <Section
          title="Network access"
          emoji="🌐"
          subtitle={app.network.length ? `Your app can talk to ${app.network.length} outside site${app.network.length > 1 ? 's' : ''}.` : 'Sealed: your app can’t talk to the internet at all.'}
        >
          {app.network.length ? (
            <div className="flex flex-wrap gap-2">
              {app.network.map((d) => (
                <span key={d} className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white py-0.5 pr-1 pl-3 font-mono text-sm">
                  {d}
                  <button
                    onClick={() => {
                      setNetwork(appId, app.network.filter((x) => x !== d))
                      toast({ emoji: app.network.length === 1 ? '🔒' : '🌐', title: app.network.length === 1 ? 'Sealed again!' : `Removed ${d}` })
                    }}
                    className="rounded-full p-0.5 hover:bg-cherry/30"
                    aria-label={`Remove ${d}`}
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border-2 border-ink bg-mint/40 p-3">
              <span className="text-2xl">🔒</span>
              <div className="text-sm">
                <b>Sealed apps get a badge</b> in Explore. People love it: it means their data physically can’t leave Cubby.
              </div>
            </div>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (validDomain) addDomain()
            }}
          >
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="api.example.com" className="font-mono" />
            <Button type="submit" variant="white" disabled={!validDomain}>
              Allow
            </Button>
          </form>
          <p className="text-xs text-ink/55">Adding a site asks every install to approve it, and you lose the 🔒 Sealed badge. Only add what you truly need.</p>
        </Section>

        <Section title="Abilities you ask for" emoji="🎟️" subtitle="Set in cubby.json. Users see these before installing.">
          <div className="flex flex-wrap gap-2">
            {app.permissions.map((p) => (
              <Badge key={p} tone="white" className="py-1 text-sm">
                {PERMISSIONS[p].emoji} {PERMISSIONS[p].label}
              </Badge>
            ))}
          </div>
        </Section>
      </div>

      <div className="flex flex-col gap-6">
        <Section title="Collaborators" emoji="🧑‍🤝‍🧑" subtitle="Can deploy and write migrations. Can’t see user data either. Nobody can.">
          <div className="flex flex-col divide-y-2 divide-ink/10 rounded-xl border-2 border-ink/15">
            {dev.collaborators.map((c) => (
              <div key={c.name} className="flex items-center gap-3 px-3 py-2.5">
                <span className="text-xl">{c.emoji}</span>
                <span className="flex-1 font-bold">{c.name}</span>
                <Badge tone={c.role === 'owner' ? 'accent' : 'white'}>{c.role}</Badge>
                {c.role !== 'owner' && (
                  <button onClick={() => removeCollab(appId, c.name)} className="rounded-md p-1 hover:bg-cherry/25" aria-label={`Remove ${c.name}`}>
                    <X size={16} strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!collab.trim()) return
              addCollab(appId, collab.trim())
              toast({ emoji: '💌', title: `Invited ${collab.trim()}`, body: 'They’ll get an email to join the Workshop.' })
              setCollab('')
            }}
          >
            <Input value={collab} onChange={(e) => setCollab(e.target.value)} placeholder="Name or email" />
            <Button type="submit" variant="white" disabled={!collab.trim()}>
              Invite
            </Button>
          </form>
        </Section>

        {dev.status !== 'draft' && (
          <Section title="Visibility" emoji="👀">
            <Segmented
              value={dev.status}
              onChange={(v) => {
                setStatus(appId, v)
                toast({ emoji: v === 'live' ? '🌍' : '🔗', title: v === 'live' ? 'Back in Explore' : 'Unlisted', body: v === 'live' ? undefined : 'Only people with the link can find it. Existing installs keep working.' })
              }}
              options={[
                { value: 'live', label: '🌍 Listed in Explore' },
                { value: 'unlisted', label: '🔗 Link only' },
              ]}
            />
          </Section>
        )}

        <Card className="border-cherry">
          <CardHeader title="Danger zone" emoji="⚠️" className="bg-cherry/30" />
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-bold">Hand it to another maker</div>
                <div className="text-sm text-ink/60">Installs and users’ data aren’t affected.</div>
              </div>
              <Button variant="white" size="sm" onClick={() => toast({ emoji: '🤝', title: 'Transfers need the other maker to accept', body: 'Not part of this demo, but it’d be an email and a button.' })}>
                Transfer
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-bold">Delete {app.name}</div>
                <div className="text-sm text-ink/60">
                  {app.installs > 0
                    ? `${app.installs.toLocaleString()} people have it installed, so you can unlist it but not delete it. Their data is theirs either way.`
                    : 'Nobody has it installed, so it’s safe to delete.'}
                </div>
              </div>
              <Button variant="danger" size="sm" disabled={app.installs > 0} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        danger
        emoji="🗑️"
        title={`Delete ${app.name}?`}
        confirmLabel="Delete app"
        onConfirm={() => {
          navigate('/workshop')
          deleteApp(appId)
          toast({ emoji: '🗑️', title: `${app.name} deleted` })
        }}
      >
        <p>This deletes its releases, migrations and listing. There’s no undo.</p>
      </ConfirmModal>
    </div>
  )
}
