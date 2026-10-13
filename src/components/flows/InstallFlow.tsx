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
import { Button, Callout, Input, LinkButton } from '../ui/primitives'
import { EmojiPicker } from './EmojiPicker'

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
  const [where, setWhere] = useState<'me' | 'shared'>('me')
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏡')

  const go = () => {
    const shared = where === 'shared' && app.supportsSpaces
    install(app.id, shared ? { spaceName: name.trim() || `Our ${app.name}`, spaceEmoji: emoji } : undefined)
    celebrate()
    toast({ emoji: app.emoji, title: `${app.name} is installed!`, body: shared ? 'Now invite your people into your new space.' : 'It’s on your shelf.', tone: 'success' })
    onClose()
    navigate(shared ? `/my/${app.id}/spaces` : `/my/${app.id}`)
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
          <div>
            <div className="mb-2 text-xs font-extrabold tracking-wider text-ink/50 uppercase">Where should its data live?</div>
            {app.supportsSpaces ? (
              <div className="flex flex-col gap-2">
                {(
                  [
                    ['me', '🙂', 'Just me, for now', 'A private space. You can invite people later.'],
                    ['shared', '👥', 'A shared space', 'Start a space for your household, team or crew. You’ll own it.'],
                  ] as const
                ).map(([id, e, title, sub]) => (
                  <button
                    key={id}
                    onClick={() => setWhere(id)}
                    className={cn('flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all', where === id ? 'border-ink bg-sun/40 shadow-brut-sm' : 'border-ink/20 bg-white hover:border-ink')}
                  >
                    <span className="text-2xl leading-none">{e}</span>
                    <span>
                      <span className="block font-bold">{title}</span>
                      <span className="block text-sm text-ink/65">{sub}</span>
                    </span>
                    <span className={cn('ml-auto mt-1 size-4 shrink-0 rounded-full border-2 border-ink', where === id ? 'bg-ink' : 'bg-white')} />
                  </button>
                ))}
                {where === 'shared' && (
                  <div className="animate-pop rounded-xl border-2 border-ink bg-white p-3">
                    <Input autoFocus placeholder={`e.g. “The ${['Park', 'Lake', 'Taco', 'Office'][app.name.length % 4]} Crew”`} value={name} onChange={(e) => setName(e.target.value)} />
                    <EmojiPicker value={emoji} onChange={setEmoji} className="mt-3" />
                  </div>
                )}
              </div>
            ) : (
              <Callout emoji="🙋" tone="white">
                <b>Personal-only app.</b> Its maker turned off sharing, so this data is only ever yours.
              </Callout>
            )}
          </div>
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
