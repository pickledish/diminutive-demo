import { useState } from 'react'
import { Download, RotateCcw, Trash2 } from 'lucide-react'
import type { Backup } from '@/types'
import { useDemo } from '@/store'
import { downloadFile, formatDateTime, formatKb, timeAgo } from '@/lib/utils'
import { celebrate } from '@/lib/fx'
import { AppIcon } from './ui/identity'
import { Badge, Button } from './ui/primitives'
import { ConfirmModal } from './flows/ConfirmModal'
import { toast } from './ui/toast'

const KIND = {
  auto: { emoji: '🤖', label: 'Automatic', tone: 'muted' },
  manual: { emoji: '✋', label: 'You made this', tone: 'sun' },
  'pre-update': { emoji: '🧬', label: 'Before an update', tone: 'grape' },
} as const

export function BackupRow({ backup, scopeAppId }: { backup: Backup; scopeAppId?: string }) {
  const app = useDemo((s) => (backup.appId ? s.apps[backup.appId] : undefined))
  const scopeApp = useDemo((s) => (scopeAppId ? s.apps[scopeAppId] : undefined))
  const spaces = useDemo((s) => s.spaces)
  const installs = useDemo((s) => s.installs)
  const restore = useDemo((s) => s.restoreBackup)
  const create = useDemo((s) => s.createBackup)
  const del = useDemo((s) => s.deleteBackup)
  const [confirm, setConfirm] = useState<'restore' | 'delete' | null>(null)
  const meta = KIND[backup.kind]
  const target = scopeApp ?? app
  const title = backup.note ?? (backup.kind === 'auto' ? 'Daily backup' : 'Backup')
  const scopeLabel = backup.appId ? app?.name : scopeApp ? `Everything (incl. ${scopeApp.name})` : 'Everything'

  const download = () => {
    const appIds = target ? [target.id] : Object.keys(installs)
    const data = Object.fromEntries(
      appIds.map((id) => [
        id,
        Object.fromEntries((installs[id]?.spaceIds ?? []).map((sid) => [spaces[sid]?.name ?? sid, backup.snapshot?.[sid] ?? spaces[sid]?.tables])),
      ]),
    )
    downloadFile(`cubby-backup-${backup.createdAt.slice(0, 10)}${target ? `-${target.id}` : ''}.json`, JSON.stringify({ backup: { id: backup.id, createdAt: backup.createdAt, kind: backup.kind }, data }, null, 2))
    toast({ emoji: '📥', title: 'Backup downloaded', body: 'Plain JSON. Readable by humans, robots and spreadsheets.' })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      {app ? <AppIcon app={app} size="sm" /> : <span className="flex size-10 items-center justify-center rounded-xl border-2 border-ink bg-paper text-xl shadow-brut-xs">📦</span>}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{title}</span>
          <Badge tone={meta.tone}>
            {meta.emoji} {meta.label}
          </Badge>
        </div>
        <div className="text-xs font-bold text-ink/55" title={formatDateTime(backup.createdAt)}>
          {scopeLabel} · {timeAgo(backup.createdAt)} · {formatKb(backup.sizeKb)}
        </div>
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" variant="white" onClick={() => setConfirm('restore')}>
          <RotateCcw size={14} strokeWidth={2.5} /> Restore
        </Button>
        <Button size="sm" variant="white" onClick={download} aria-label="Download">
          <Download size={14} strokeWidth={2.5} />
        </Button>
        {backup.kind === 'manual' && (
          <Button size="sm" variant="ghost" onClick={() => setConfirm('delete')} aria-label="Delete">
            <Trash2 size={14} />
          </Button>
        )}
      </div>
      <ConfirmModal
        open={confirm === 'restore'}
        onClose={() => setConfirm(null)}
        emoji="⏪"
        title="Restore this backup?"
        confirmLabel="Restore"
        onConfirm={() => {
          create(target?.id, 'Safety copy before restoring')
          restore(backup.id, target?.id)
          celebrate()
          toast({ emoji: '⏪', title: 'Restored!', body: `${target?.name ?? 'Everything'} is back to how it was ${timeAgo(backup.createdAt)}. We saved a safety copy first.`, tone: 'success' })
        }}
      >
        <p>
          {target ? <b>{target.name}</b> : <b>All your apps</b>} will go back to how {target ? 'it' : 'they'} looked on <b>{formatDateTime(backup.createdAt)}</b>.
        </p>
        <p className="text-sm text-ink/70">Don’t worry: we’ll save a safety copy of right now first, so you can undo the undo.</p>
      </ConfirmModal>
      <ConfirmModal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        danger
        emoji="🗑️"
        title="Delete this backup?"
        confirmLabel="Delete backup"
        onConfirm={() => {
          del(backup.id)
          toast({ emoji: '🗑️', title: 'Backup deleted' })
        }}
      >
        <p>Your current data isn’t affected. You just won’t be able to go back to this point.</p>
      </ConfirmModal>
    </div>
  )
}
