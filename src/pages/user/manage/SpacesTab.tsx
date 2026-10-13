import { useState } from 'react'
import { Link } from 'react-router'
import { Plus, UserPlus, X } from 'lucide-react'
import type { Role, Space } from '@/types'
import { useDemo } from '@/store'
import { myRole, spaceKb, spaceRowCount } from '@/store/selectors'
import { formatKb, timeAgo } from '@/lib/utils'
import { RoleBadge } from '@/components/Badges'
import { InviteModal } from '@/components/flows/InviteModal'
import { ConfirmModal } from '@/components/flows/ConfirmModal'
import { EmojiPicker } from '@/components/flows/EmojiPicker'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/identity'
import { Badge, Button, Callout, Card, Input, Label, Select } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'

export function SpaceFormModal({ open, onClose, onSave, initial, title }: { open: boolean; onClose: () => void; onSave: (name: string, emoji: string) => void; initial?: { name: string; emoji: string }; title: string }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '✨')
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      emoji={emoji}
      size="sm"
      footer={
        <>
          <Button variant="white" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onSave(name.trim(), emoji)
              onClose()
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <Label>Name</Label>
      <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Lake House" />
      <Label className="mt-4">Emoji</Label>
      <EmojiPicker value={emoji} onChange={setEmoji} />
    </Modal>
  )
}

function SpaceCard({ space }: { space: Space }) {
  const meId = useDemo((s) => s.meId)
  const people = useDemo((s) => s.people)
  const app = useDemo((s) => s.apps[space.appId])
  const setRole = useDemo((s) => s.setMemberRole)
  const removeMember = useDemo((s) => s.removeMember)
  const cancelInvite = useDemo((s) => s.cancelInvite)
  const rename = useDemo((s) => s.renameSpace)
  const del = useDemo((s) => s.deleteSpace)
  const leave = useDemo((s) => s.leaveSpace)
  const transfer = useDemo((s) => s.transferOwnership)
  const [inviting, setInviting] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [confirm, setConfirm] = useState<'delete' | 'leave' | { transfer: string } | null>(null)
  const role = myRole(space, meId)
  const owner = role === 'owner'
  const others = space.members.filter((m) => m.personId !== meId)

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 border-b-[3px] border-ink px-5 py-4">
        <span className="flex size-12 items-center justify-center rounded-xl border-2 border-ink bg-paper text-2xl shadow-brut-xs">{space.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-extrabold">{space.name}</h3>
            {role && <RoleBadge role={role} />}
          </div>
          <div className="text-xs font-bold text-ink/55">
            {spaceRowCount(space)} rows · {formatKb(spaceKb(space))} · created {timeAgo(space.createdAt)} · {owner ? 'lives in your cubby' : `lives in ${people[space.ownerId]?.name.split(' ')[0]}’s cubby`}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {owner && app.supportsSpaces && (
            <Button size="sm" variant="blue" onClick={() => setInviting(true)}>
              <UserPlus size={15} strokeWidth={2.5} /> Invite
            </Button>
          )}
          <Link to={`/my/${space.appId}/data?space=${space.id}`} className="brut-xs press inline-flex h-8.5 items-center rounded-lg bg-white px-3 text-sm font-bold">
            Browse data
          </Link>
        </div>
      </div>

      <div className="divide-y-2 divide-ink/10">
        {space.members.map((m) => {
          const p = people[m.personId]
          const isMe = m.personId === meId
          return (
            <div key={m.personId} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <Avatar person={p} size="md" />
              <div className="min-w-0 flex-1">
                <div className="font-bold">
                  {p?.name}
                  {isMe && <span className="text-ink/50"> (you)</span>}
                </div>
                <div className="text-xs text-ink/55">joined {timeAgo(m.joinedAt)}</div>
              </div>
              {owner && !isMe && m.role !== 'owner' ? (
                <div className="flex items-center gap-2">
                  <Select className="h-8.5 w-32 py-0 text-sm" value={m.role} onChange={(e) => setRole(space.id, m.personId, e.target.value as Role)}>
                    <option value="editor">✏️ Editor</option>
                    <option value="viewer">👀 Viewer</option>
                  </Select>
                  <button
                    onClick={() => setConfirm({ transfer: m.personId })}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-ink/55 hover:bg-sun/40 hover:text-ink"
                    title="Make them the owner"
                  >
                    👑 Hand over
                  </button>
                  <button
                    onClick={() => {
                      removeMember(space.id, m.personId)
                      toast({ emoji: '👋', title: `${p?.name} removed`, body: `They can’t see “${space.name}” anymore.` })
                    }}
                    className="rounded-lg p-1.5 text-ink/40 hover:bg-cherry/30 hover:text-ink"
                    aria-label="Remove"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <RoleBadge role={m.role} />
              )}
            </div>
          )
        })}
        {space.pending.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 bg-paper px-5 py-3">
            <span className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-ink/50 text-lg">💌</span>
            <div className="min-w-0 flex-1">
              <div className="font-bold">{p.label}</div>
              <div className="text-xs text-ink/55">
                invited as {p.role} {timeAgo(p.sentAt)} · waiting for them to accept
              </div>
            </div>
            <Badge tone="muted">Pending</Badge>
            {owner && (
              <button onClick={() => cancelInvite(space.id, p.id)} className="text-xs font-bold text-ink/55 underline hover:text-ink">
                Cancel
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t-[3px] border-ink px-5 py-3">
        {owner ? (
          <>
            <Button size="sm" variant="white" onClick={() => setRenaming(true)}>
              Rename
            </Button>
            <Button size="sm" variant="ghost" className="ml-auto text-[#c42b2b]" onClick={() => setConfirm('delete')}>
              Delete space
            </Button>
          </>
        ) : (
          <>
            <span className="text-xs font-bold text-ink/55">
              {people[space.ownerId]?.name} owns this space and controls its members & backups.
            </span>
            <Button size="sm" variant="ghost" className="ml-auto text-[#c42b2b]" onClick={() => setConfirm('leave')}>
              Leave space
            </Button>
          </>
        )}
      </div>

      <InviteModal spaceId={space.id} open={inviting} onClose={() => setInviting(false)} />
      {renaming && <SpaceFormModal open onClose={() => setRenaming(false)} title="Rename space" initial={space} onSave={(n, e) => rename(space.id, n, e)} />}
      <ConfirmModal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        danger
        emoji="🔥"
        title={`Delete “${space.name}”?`}
        confirmLabel="Delete space & data"
        onConfirm={() => {
          del(space.id)
          toast({ emoji: '🔥', title: 'Space deleted', body: others.length ? `${others.length} people lost access.` : undefined })
        }}
      >
        <p>
          This deletes the space and all {spaceRowCount(space)} rows in it.
          {others.length > 0 && (
            <>
              {' '}
              <b>{others.map((m) => people[m.personId]?.name.split(' ')[0]).join(', ')}</b> will lose access too.
            </>
          )}
        </p>
        {others.length > 0 && <p className="text-sm">Want to keep it going without you? Hand ownership to someone instead.</p>}
      </ConfirmModal>
      <ConfirmModal
        open={confirm === 'leave'}
        onClose={() => setConfirm(null)}
        emoji="👋"
        title={`Leave “${space.name}”?`}
        confirmLabel="Leave"
        onConfirm={() => {
          leave(space.id)
          toast({ emoji: '👋', title: `You left ${space.name}`, body: 'The data stays with its owner.' })
        }}
      >
        <p>You’ll stop seeing this space. The data belongs to {people[space.ownerId]?.name}, so it stays with them. They can invite you back anytime.</p>
      </ConfirmModal>
      <ConfirmModal
        open={typeof confirm === 'object' && confirm !== null}
        onClose={() => setConfirm(null)}
        emoji="👑"
        title="Hand over ownership?"
        confirmLabel="Make them the owner"
        onConfirm={() => {
          if (confirm && typeof confirm === 'object') {
            transfer(space.id, confirm.transfer)
            toast({ emoji: '👑', title: 'Ownership handed over', body: `“${space.name}” now lives in ${people[confirm.transfer]?.name.split(' ')[0]}’s cubby. You’re an editor.` })
          }
        }}
      >
        {confirm && typeof confirm === 'object' && (
          <p>
            <b>{people[confirm.transfer]?.name}</b> will own “{space.name}”: its data moves to their cubby, they control members and backups, and it counts toward their storage. You’ll stay on as an editor.
          </p>
        )}
      </ConfirmModal>
    </Card>
  )
}

export function SpacesTab({ appId }: { appId: string }) {
  const app = useDemo((s) => s.apps[appId])
  const inst = useDemo((s) => s.installs[appId])
  const spaces = useDemo((s) => s.spaces)
  const create = useDemo((s) => s.createSpace)
  const [creating, setCreating] = useState(false)
  const mine = inst.spaceIds.map((id) => spaces[id]).filter(Boolean)

  return (
    <div className="flex flex-col gap-6">
      {app.supportsSpaces ? (
        <div className="flex flex-wrap items-center gap-4">
          <Callout emoji="👑" tone="white" className="flex-1">
            <b>Whoever creates a space owns its data.</b> They decide who’s in, who can edit, and when it gets backed up or deleted. Up to {app.maxMembers} people per space.
          </Callout>
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={3} /> New space
          </Button>
        </div>
      ) : (
        <Callout emoji="🙋" tone="white">
          <b>{app.name} is personal-only.</b> Its maker turned off sharing, so there’s just one space and it’s only ever yours.
        </Callout>
      )}
      {mine.map((sp) => (
        <SpaceCard key={sp.id} space={sp} />
      ))}
      {creating && (
        <SpaceFormModal
          open
          onClose={() => setCreating(false)}
          title="New space"
          onSave={(n, e) => {
            create(appId, n, e)
            toast({ emoji: e, title: `“${n}” created`, body: 'Invite some people in!', tone: 'success' })
          }}
        />
      )}
    </div>
  )
}
