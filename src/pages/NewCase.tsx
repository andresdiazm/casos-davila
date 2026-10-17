import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaseForm } from '@/components/cases/CaseForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCases } from '@/context/CasesContext'
import { useToast } from '@/context/ToastContext'
import { findPotentialDuplicates } from '@/lib/casesRepo'
import type { CaseDraft } from '@/types/case'

export function NewCase() {
  const navigate = useNavigate()
  const { addCase } = useCases()
  const { notify } = useToast()
  const [pendingDraft, setPendingDraft] = useState<CaseDraft | null>(null)

  async function saveDraft(draft: CaseDraft) {
    const record = await addCase(draft)
    notify('success', `Caso ${record.caseNumber} creado correctamente.`)
    navigate(`/casos/${record.id}`)
  }

  async function handleSubmit(draft: CaseDraft) {
    const duplicates = await findPotentialDuplicates(draft.rut, draft.fechaInicio)
    if (duplicates.length > 0) {
      setPendingDraft(draft)
      return
    }
    await saveDraft(draft)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <CaseForm
          submitLabel="Guardar caso"
          showCancelAsClear
          onSubmit={handleSubmit}
          onCancel={() => navigate('/casos')}
        />
      </div>

      {pendingDraft && (
        <ConfirmDialog
          title="Posible caso duplicado"
          message={`Ya existe un caso registrado con el mismo RUT y fecha de inicio (${pendingDraft.fechaInicio}). ¿Desea guardar este caso de todas formas?`}
          confirmLabel="Guardar igualmente"
          danger
          onConfirm={async () => {
            const draft = pendingDraft
            setPendingDraft(null)
            if (draft) await saveDraft(draft)
          }}
          onCancel={() => setPendingDraft(null)}
        />
      )}
    </div>
  )
}
