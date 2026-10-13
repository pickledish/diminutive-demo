import { useNavigate } from 'react-router'
import type { Invite } from '@/types'
import { useDemo } from '@/store'
import { celebrate } from '@/lib/fx'
import { timeAgo } from '@/lib/utils'
import { toast } from './ui/toast'
import { AppIcon, Avatar, AvatarStack } from './ui/identity'
import { Button } from './ui/primitives'
import { RoleBadge } from './Badges'

export function InviteCard({ invite }: { invite: Invite }) {
  const from = useDemo((s) => s.people[invite.fromPersonId])
  const app = useDemo((s) => s.apps[invite.appId])
  const installed = useDemo((s) => !!s.installs[invite.appId])
  const accept = useDemo((s) => s.acceptInvite)
  const decline = useDemo((s) => s.declineInvite)
  const navigate = useNavigate()

  return (
    <div className="brut flex flex-col rounded-2xl bg-sky/45 p-4">
      <div className="flex items-start gap-3">
        <Avatar person={from} size="md" />
        <div className="min-w-0 flex-1">
          <div className="leading-snug">
            <b>{from?.name}</b> invited you to <b>{invite.spaceEmoji} {invite.spaceName}</b>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold text-ink/65">
            <AppIcon app={app} size="xs" shadow={false} className="size-5 rounded-md border text-[11px]" /> in {app?.name} · {timeAgo(invite.sentAt)}
          </div>
        </div>
      </div>
      {invite.message && (
        <div className="relative mt-3 rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm italic">
          “{invite.message}”
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
        <AvatarStack ids={invite.memberIds} size="xs" max={5} />
        <span className="text-ink/60">{invite.memberIds.length} people inside</span>
        <span className="ml-auto">
          <RoleBadge role={invite.role} />
        </span>
      </div>
      {!installed && <div className="mt-3 rounded-lg border-2 border-dashed border-ink/40 bg-white/60 px-3 py-1.5 text-xs font-bold">Joining will install {app?.name} (free). You can leave anytime.</div>}
      <div className="mt-auto flex gap-2 pt-4">
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => {
            const sid = accept(invite.id)
            celebrate()
            toast({ emoji: invite.spaceEmoji, title: `You joined ${invite.spaceName}!`, body: `${from?.name.split(' ')[0]} owns this space. You’re ${invite.role === 'editor' ? 'an editor' : 'a viewer'}.`, tone: 'success' })
            if (sid) navigate(`/my/${invite.appId}/spaces`)
          }}
        >
          {installed ? 'Join space' : 'Install & join'}
        </Button>
        <Button
          variant="white"
          onClick={() => {
            decline(invite.id)
            toast({ emoji: '👋', title: 'Invite declined', body: `${from?.name.split(' ')[0]} won’t be notified. We’re not monsters.` })
          }}
        >
          No thanks
        </Button>
      </div>
    </div>
  )
}
