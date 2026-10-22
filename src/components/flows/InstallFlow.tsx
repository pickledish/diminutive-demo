import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, Play } from 'lucide-react'
import type { AppListing } from '@/types'
import { useDemo } from '@/store'
import { PERMISSIONS } from '@/data/constants'
import { celebrate } from '@/lib/fx'
import { cn } from '@/lib/utils'
import { toast } from '../ui/toast'
import { Modal } from '../ui/Modal'
import { AppIcon } from '../ui/identity'
import { Button, Callout, LinkButton } from '../ui/primitives'

export function PermissionList({ app, compact }: { app: AppListing; compact?: boolean }) {
  return (
    <ul className={cn('flex flex-col', compact ? 'gap-2' : 'gap-3')}>
      {app.permissions.map((p) => (
        <li key={p} className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-white text-base">{PERMISSIONS[p].emoji}</span>
          <div className="min-w-0">
            <div className="font-bold leading-tight">
              {PERMISSIONS[p].label}
              {PERMISSIONS[p].optional && <span className="ml-1.5 text-xs font-bold text-ink/45">optional</span>}
            </div>
            {!compact && <div className="text-sm text-ink/65">{PERMISSIONS[p].detail}</div>}
          </div>
        </li>
      ))}
      <li className="flex items-start gap-3">
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-base', app.network.length ? 'bg-white' : 'bg-mint')}>
          {app.network.length ? '🌐' : '🔒'}
        </span>
        <div className="min-w-0">
          <div className="font-bold leading-tight">{app.network.length ? `Talk to ${app.network.join(', ')}` : 'No internet access'}</div>
          {!compact && (
            <div className="text-sm text-ink/65">
              {app.network.length
                ? 'Only these sites. Cubby blocks everything else, so your data can’t be quietly sent anywhere.'
                : 'Sealed: it can’t talk to any website. Your data physically can’t leave Cubby through it.'}
            </div>
          )}
        </div>
      </li>
    </ul>
  )
}

export function InstallModal({ app, open, onClose }: { app: AppListing; open: boolean; onClose: () => void }) {
  const install = useDemo((s) => s.installApp)
  const dev = useDemo((s) => s.developers[app.developerId])
  const navigate = useNavigate()

  const go = () => {
    install(app.id)
    celebrate()
    toast({ emoji: app.emoji, title: `${app.name} is installed!`, body: 'It’s on your shelf, with a space just for you.', tone: 'success' })
    onClose()
    navigate(`/my/${app.id}/spaces`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Install ${app.name}?`}
      tone={app.color}
      size="lg"
      footer={
        <>
          <Button variant="white" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={go} size="lg">
            <Check size={18} strokeWidth={3} /> Install (free)
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <AppIcon app={app} size="lg" />
            <div>
              <div className="font-display text-2xl font-extrabold leading-tight">{app.name}</div>
              <div className="text-sm text-ink/65">
                by {dev?.name} · v{app.version}
              </div>
            </div>
          </div>
          <div className="mb-2 text-xs font-extrabold tracking-wider text-ink/50 uppercase">What it can do</div>
          <PermissionList app={app} />
        </div>
        <div className="flex flex-col gap-4">
          <Callout emoji="🙂" tone="white">
            <b>You’ll start with a space just for you.</b> Make another anytime to share with friends, a household, or a team. Whoever creates a space owns its data.
          </Callout>
          <Callout emoji="🔐" tone="mint">
            <b>{dev?.name} can’t see anything you put in here.</b> Not your rows, not your files, not a peek. They only see that someone installed it.
          </Callout>
        </div>
      </div>
    </Modal>
  )
}

export function InstallButton({ app, size = 'lg' }: { app: AppListing; size?: 'md' | 'lg' }) {
  const installed = useDemo((s) => !!s.installs[app.id])
  const trashed = useDemo((s) => s.trash.some((t) => t.install.appId === app.id))
  const restore = useDemo((s) => s.restoreFromTrash)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (installed)
    return (
      <div className="flex flex-wrap gap-2">
        <LinkButton to={`/run/${app.id}`} size={size} variant="mint">
          <Play size={18} strokeWidth={3} className="fill-ink" /> Open
        </LinkButton>
        <LinkButton to={`/my/${app.id}`} size={size} variant="white">
          Manage
        </LinkButton>
      </div>
    )

  if (!app.published)
    return (
      <Button size={size} disabled>
        Not published yet
      </Button>
    )

  return (
    <>
      {trashed ? (
        <Button
          size={size}
          onClick={() => {
            restore(app.id)
            celebrate()
            toast({ emoji: '♻️', title: `${app.name} is back`, body: 'All your old data came with it.', tone: 'success' })
            navigate(`/my/${app.id}`)
          }}
        >
          ♻️ Reinstall with my old data
        </Button>
      ) : (
        <Button size={size} onClick={() => setOpen(true)}>
          ＋ Install
        </Button>
      )}
      <InstallModal app={app} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
