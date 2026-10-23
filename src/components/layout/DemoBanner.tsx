import { useState } from 'react'
import { useDemo } from '@/store'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/primitives'

export function DemoBanner() {
  const reset = useDemo((s) => s.resetDemo)
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="stripes border-b-[3px] border-ink bg-accent">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-center text-[13px] font-bold">
        <span>🧪 This is a clickable demo. Nothing is real, and everything you do is saved only in your browser.</span>
        <button onClick={() => setConfirm(true)} className="shrink-0 rounded-md border-2 border-ink bg-white px-2 py-0.5 text-xs hover:bg-ink hover:text-paper">
          Reset demo
        </button>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset the demo?"
        emoji="🧹"
        size="sm"
        footer={
          <>
            <Button variant="white" onClick={() => setConfirm(false)}>
              Never mind
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                reset()
                setConfirm(false)
              }}
            >
              Reset everything
            </Button>
          </>
        }
      >
        Puts every app, space, backup and Workshop release back to how it started. Handy before showing it to someone new.
      </Modal>
    </div>
  )
}
