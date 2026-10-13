import { useState } from 'react'
import type { AppListing } from '@/types'
import { useDemo } from '@/store'
import { celebrate } from '@/lib/fx'
import { cn } from '@/lib/utils'
import { toast } from '../ui/toast'
import { Modal } from '../ui/Modal'
import { AppIcon } from '../ui/identity'
import { Button, Input, Label } from '../ui/primitives'

export function TipModal({ app, open, onClose }: { app: AppListing; open: boolean; onClose: () => void }) {
  const dev = useDemo((s) => s.developers[app.developerId])
  const tip = useDemo((s) => s.tipApp)
  const [amount, setAmount] = useState(5)
  const [note, setNote] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Tip ${dev?.name}`}
      emoji="💛"
      tone="sun"
      size="sm"
      footer={
        <>
          <Button variant="white" onClick={onClose}>
            Maybe later
          </Button>
          <Button
            variant="pink"
            onClick={() => {
              tip(app.id, amount * 100)
              celebrate('big')
              toast({ emoji: '💛', title: `You tipped $${amount}!`, body: `${dev?.name} will be very happy. (Pretend money, real feelings.)`, tone: 'success' })
              onClose()
            }}
          >
            Send ${amount}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <AppIcon app={app} size="md" />
          <p className="leading-snug">
            {app.name} is free. If it made your life a little better, say thanks with a tip. <b>100% goes to the maker.</b>
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[2, 5, 10, 20].map((a) => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={cn('rounded-xl border-2 border-ink py-3 font-display text-xl font-extrabold transition-all', amount === a ? 'bg-bubblegum shadow-brut-sm' : 'bg-white hover:bg-sun/40')}
            >
              ${a}
            </button>
          ))}
        </div>
        <div>
          <Label>Add a note (optional)</Label>
          <Input placeholder="the goblin is my son now" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
