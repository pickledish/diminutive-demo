import { useState } from 'react'
import { Link2, Send } from 'lucide-react'
import type { Role } from '@/types'
import { useDemo } from '@/store'
import { copyText, randomHex } from '@/lib/utils'
import { toast } from '../ui/toast'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/identity'
import { Button, Callout, Input, Label, Segmented } from '../ui/primitives'

export function InviteModal({ spaceId, open, onClose }: { spaceId: string; open: boolean; onClose: () => void }) {
  const space = useDemo((s) => s.spaces[spaceId])
  const app = useDemo((s) => (space ? s.apps[space.appId] : undefined))
  const people = useDemo((s) => s.people)
  const meId = useDemo((s) => s.meId)
  const invite = useDemo((s) => s.inviteToSpace)
  const [label, setLabel] = useState('')
  const [role, setRole] = useState<Role>('editor')
  const [link] = useState(() => `https://cubby.app/join/${randomHex(6)}`)

  if (!space || !app) return null
  const inSpace = new Set(space.members.map((m) => m.personId))
  const suggestions = Object.values(people).filter((p) => p.id !== meId && !inSpace.has(p.id) && !space.pending.some((x) => x.label === p.email))

  const send = (who: string) => {
    if (!who.trim()) return
    invite(spaceId, who.trim(), role)
    toast({ emoji: '💌', title: `Invite sent to ${who.trim()}`, body: `They’ll join “${space.name}” as ${role === 'editor' ? 'an editor' : 'a viewer'}.` })
    setLabel('')
  }

  return (
    <Modal open={open} onClose={onClose} title={`Invite people to “${space.name}”`} emoji={space.emoji} tone="sky">
      <div className="flex flex-col gap-5">
        <div>
          <Label>Email or name</Label>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              send(label)
            }}
          >
            <Input autoFocus placeholder="grandpa@example.com" value={label} onChange={(e) => setLabel(e.target.value)} />
            <Button type="submit" variant="blue" disabled={!label.trim()}>
              <Send size={16} strokeWidth={2.5} /> Invite
            </Button>
          </form>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="mb-0">They can…</Label>
          <Segmented
            value={role}
            onChange={setRole}
            options={[
              { value: 'editor', label: '✏️ Add & change things' },
              { value: 'viewer', label: '👀 Only look' },
            ]}
          />
        </div>
        {suggestions.length > 0 && (
          <div>
            <Label hint="Click to invite">People you share with elsewhere</Label>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 8).map((p) => (
                <button key={p.id} onClick={() => send(p.email)} className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-white py-0.5 pr-3 pl-0.5 text-sm font-bold hover:bg-sun">
                  <Avatar person={p} size="xs" />
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-ink/40 bg-white p-2 pl-3">
          <Link2 size={16} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate font-mono text-xs">{link}</span>
          <Button
            size="sm"
            variant="white"
            onClick={() => {
              copyText(link)
              toast({ emoji: '🔗', title: 'Invite link copied', body: 'Anyone with it can ask to join. You approve them.' })
            }}
          >
            Copy link
          </Button>
        </div>
        <Callout emoji="👑" tone="sun">
          You own <b>{space.name}</b>. Its data lives in your cubby. People you invite can use it through {app.name}, and if you remove them, their access goes too.
        </Callout>
      </div>
    </Modal>
  )
}
