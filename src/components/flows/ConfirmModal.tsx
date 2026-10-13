import type { ReactNode } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/primitives'

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  emoji = '🤔',
  children,
  confirmLabel = 'Yes, do it',
  danger,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  emoji?: string
  children: ReactNode
  confirmLabel?: string
  danger?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      emoji={emoji}
      size="sm"
      tone={danger ? 'cherry' : 'sun'}
      footer={
        <>
          <Button variant="white" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 leading-relaxed">{children}</div>
    </Modal>
  )
}
