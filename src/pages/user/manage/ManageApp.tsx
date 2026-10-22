import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Play } from 'lucide-react'
import { useDemo } from '@/store'
import { bg } from '@/lib/colors'
import { cn, formatDate, timeAgo } from '@/lib/utils'
import { AppIcon } from '@/components/ui/identity'
import { Badge, Button, EmptyState, LinkButton } from '@/components/ui/primitives'
import { Tabs } from '@/components/ui/Tabs'
import { UpdateReviewModal } from '@/components/flows/UpdateReview'
import { ConfirmModal } from '@/components/flows/ConfirmModal'
import { toast } from '@/components/ui/toast'
import { celebrate } from '@/lib/fx'
import { DataTab } from './DataTab'
import { SpacesTab } from './SpacesTab'
import { BackupsTab } from './BackupsTab'
import { ActivityTab } from './ActivityTab'
import { SettingsTab } from './SettingsTab'

function Trashed({ appId }: { appId: string }) {
  const app = useDemo((s) => s.apps[appId])
  const t = useDemo((s) => s.trash.find((t) => t.install.appId === appId))
  const restore = useDemo((s) => s.restoreFromTrash)
  const purge = useDemo((s) => s.purgeTrash)
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  if (!t || !app) return null
  return (
    <EmptyState
      emoji="🗑️"
      title={`${app.name} is uninstalled`}
      className="bg-white"
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              restore(appId)
              celebrate()
              toast({ emoji: '♻️', title: `${app.name} is back`, body: 'All your old data came with it.', tone: 'success' })
            }}
          >
            ♻️ Reinstall with my data
          </Button>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Delete data now
          </Button>
        </div>
      }
    >
      We’re keeping your data safe until <b>{formatDate(t.purgeAt)}</b> ({timeAgo(t.purgeAt)}), in case you change your mind.
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        danger
        emoji="🔥"
        title="Delete it for good?"
        confirmLabel="Delete forever"
        onConfirm={() => {
          purge(appId)
          toast({ emoji: '🔥', title: 'Deleted', body: `${app.name}’s data is gone. Like, really gone.` })
          navigate('/home')
        }}
      >
        <p>This permanently deletes all of {app.name}’s data and backups. There’s no undo.</p>
      </ConfirmModal>
    </EmptyState>
  )
}

export function ManageApp() {
  const { appId = '', tab } = useParams()
  const app = useDemo((s) => s.apps[appId])
  const inst = useDemo((s) => s.installs[appId])
  const dev = useDemo((s) => (app ? s.developers[app.developerId] : undefined))
  const pending = useDemo((s) => s.pendingUpdates[appId])
  const trashed = useDemo((s) => s.trash.some((t) => t.install.appId === appId))
  const [updOpen, setUpdOpen] = useState(false)

  if (!app) return <Navigate to="/home" replace />
  if (!inst) {
    if (trashed) return <Trashed appId={appId} />
    return <Navigate to={`/apps/${appId}`} replace />
  }
  if (!tab || tab === 'overview') return <Navigate to={`/my/${appId}/spaces`} replace />

  const base = `/my/${appId}`
  const tabs = [
    { to: `${base}/spaces`, label: '👥 Spaces', badge: <Badge tone="white" className="px-1.5 py-0 text-[10px]">{inst.spaceIds.length}</Badge> },
    { to: `${base}/data`, label: '🗄️ Data' },
    { to: `${base}/backups`, label: '💾 Backups' },
    { to: `${base}/activity`, label: '📜 Activity' },
    { to: `${base}/settings`, label: '⚙️ Settings' },
  ]

  return (
    <div>
      <Link to="/home" className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink">
        <ArrowLeft size={16} strokeWidth={3} /> Your shelf
      </Link>

      <div className={cn('brut relative mb-6 flex flex-col gap-5 overflow-hidden rounded-[24px] bg-white p-5 sm:flex-row sm:items-center sm:p-6')}>
        <div className={cn('absolute inset-y-0 left-0 w-3 border-r-[3px] border-ink', bg[app.color])} />
        <AppIcon app={app} size="lg" className="ml-3" />
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl leading-none font-extrabold">{app.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-ink/60">
            <span className="font-mono">v{inst.version}</span>
            <span>
              by{' '}
              <Link to={`/makers/${dev?.handle}`} className="underline">
                {dev?.name}
              </Link>
            </span>
            <span>installed {timeAgo(inst.installedAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton to={`/run/${appId}`} variant="mint" size="lg">
            <Play size={18} strokeWidth={3} className="fill-ink" /> Open
          </LinkButton>
          <LinkButton to={`/apps/${appId}`} variant="white" size="lg">
            Store page
          </LinkButton>
        </div>
      </div>

      {pending && (
        <div className="mb-6 flex items-stretch gap-3 rounded-xl border-[3px] border-ink bg-sun p-2.5 shadow-brut-sm">
          <span className="self-center text-lg leading-none">⬆️</span>
          <div className="min-w-0 flex-1 self-center text-sm leading-5">
            <div className="truncate font-bold">
              {app.name} {pending.toVersion} is ready
            </div>
            <div className="truncate">
              {pending.dataSummary.length ? 'It changes your data, so it’s waiting for your OK.' : pending.notes}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUpdOpen(true)}
            className="brut-sm press inline-flex items-center self-stretch rounded-lg bg-ink px-3.5 text-sm leading-none font-bold whitespace-nowrap text-paper"
          >
            Review update
          </button>
        </div>
      )}

      <Tabs tabs={tabs} className="mb-6" />

      {tab === 'data' && <DataTab appId={appId} />}
      {tab === 'spaces' && <SpacesTab appId={appId} />}
      {tab === 'backups' && <BackupsTab appId={appId} />}
      {tab === 'activity' && <ActivityTab appId={appId} />}
      {tab === 'settings' && <SettingsTab appId={appId} />}

      <UpdateReviewModal appId={appId} open={updOpen} onClose={() => setUpdOpen(false)} />
    </div>
  )
}
