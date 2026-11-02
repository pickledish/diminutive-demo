import type { AppListing, Channel, Role } from '@/types'
import { Badge } from './ui/primitives'
import { ROLES } from '@/data/constants'

export function SealedBadge({ app, long }: { app: Pick<AppListing, 'network'>; long?: boolean }) {
  if (!app.network.length)
    return (
      <Badge tone="mint" title="This app can't talk to the internet. Your data can't leave Diminutive.">
        🔒 {long ? 'Sealed: no internet access' : 'Sealed'}
      </Badge>
    )
  return (
    <Badge tone="white" title={`Can talk to: ${app.network.join(', ')}`}>
      🌐 {long ? `Talks to ${app.network.join(', ')}` : `${app.network.length} site${app.network.length > 1 ? 's' : ''}`}
    </Badge>
  )
}

export function RoleBadge({ role }: { role: Role }) {
  const tone = role === 'owner' ? 'sun' : role === 'editor' ? 'blue' : 'muted'
  return (
    <Badge tone={tone} title={ROLES[role].detail}>
      {ROLES[role].emoji} {ROLES[role].label}
    </Badge>
  )
}

export function ChannelBadge({ channel }: { channel: Channel }) {
  const map = {
    live: { tone: 'mint', label: '● Live' },
    beta: { tone: 'grape', label: 'β Beta' },
    preview: { tone: 'sky', label: '👁 Preview' },
    archived: { tone: 'muted', label: 'Archived' },
  } as const
  return <Badge tone={map[channel].tone}>{map[channel].label}</Badge>
}
