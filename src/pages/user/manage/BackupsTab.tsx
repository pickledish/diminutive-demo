import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useDemo } from '@/store'
import { BackupRow } from '@/components/BackupList'
import { Button, TabIntro, Card, CardHeader, Input } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/toast'

export function BackupsTab({ appId }: { appId: string }) {
  const app = useDemo((s) => s.apps[appId])
  const backups = useDemo((s) => s.backups)
  const autoBackup = useDemo((s) => s.autoBackup)
  const create = useDemo((s) => s.createBackup)
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const list = useMemo(() => backups.filter((b) => !b.appId || b.appId === appId), [backups, appId])

  return (
    <div className="flex flex-col gap-6">
      <TabIntro action={<Button onClick={() => setOpen(true)}>💾 Back up {app.name} now</Button>}>
        {autoBackup === 'off' ? 'Automatic backups are off, but' : <>Backed up {autoBackup}, and</>} always right before an update changes your data.{' '}
        <Link to="/data" className="font-bold underline">
          Change schedule
        </Link>
      </TabIntro>

      <Card>
        <CardHeader title={`Backups that include ${app.name}`} emoji="💾" subtitle="Restore any of them in one click. Backups don’t count toward your storage." />
        <div className="divide-y-2 divide-ink/10">
          {list.map((b) => (
            <BackupRow key={b.id} backup={b} scopeAppId={appId} />
          ))}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Back up ${app.name}`}
        emoji="💾"
        size="sm"
        footer={
          <>
            <Button variant="white" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                create(appId, note.trim() || undefined)
                setOpen(false)
                setNote('')
                toast({ emoji: '💾', title: 'Backup saved', body: `${app.name} is snapshotted. Go wild.`, tone: 'success' })
              }}
            >
              Save backup
            </Button>
          </>
        }
      >
        <p className="mb-3">A snapshot of every space in {app.name}, right now.</p>
        <Input autoFocus placeholder="Add a note, like “before the big cleanup” (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </Modal>
    </div>
  )
}
