import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      width="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {danger && (
          <div className="shrink-0 rounded-full bg-red-50 p-2 text-alerta">
            <AlertTriangle size={20} />
          </div>
        )}
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </Modal>
  )
}
