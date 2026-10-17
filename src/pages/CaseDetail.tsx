import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Lock, LockOpen } from 'lucide-react'
import { useCases } from '@/context/CasesContext'
import { useToast } from '@/context/ToastContext'
import { CaseForm } from '@/components/cases/CaseForm'
import { DetailRow, Section } from '@/components/cases/DetailRow'
import { TareasSection } from '@/components/cases/TareasSection'
import { EstadoBadge, BrechaBadge, SeguimientoBadges, tipoPacienteLabel } from '@/components/cases/caseBadges'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateDisplay, formatDateTimeDisplay } from '@/lib/dates'
import { formatCLP } from '@/lib/currency'
import { getSeguimientoInfo } from '@/lib/tracking'
import type { CaseDraft } from '@/types/case'

export function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { cases, editCase, removeCase } = useCases()
  const { notify } = useToast()

  const [editing, setEditing] = useState(false)
  const [confirmBrechaChange, setConfirmBrechaChange] = useState<CaseDraft | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const caso = cases.find((c) => c.id === id)

  if (!caso) {
    return (
      <EmptyState
        icon={<Lock size={28} />}
        title="Caso no encontrado"
        description="El caso solicitado no existe o fue eliminado."
        action={<Button onClick={() => navigate('/casos')}>Volver al listado</Button>}
      />
    )
  }

  const info = getSeguimientoInfo(caso)

  async function performSave(draft: CaseDraft) {
    await editCase(caso!.id, draft)
    notify('success', 'Caso actualizado correctamente.')
    setEditing(false)
  }

  async function handleSubmit(draft: CaseDraft) {
    if (caso!.brecha === 'si' && draft.brecha === 'no') {
      setConfirmBrechaChange(draft)
      return
    }
    await performSave(draft)
  }

  async function handleDelete() {
    await removeCase(caso!.id)
    notify('success', `Caso ${caso!.caseNumber} eliminado.`)
    navigate('/casos')
  }

  async function toggleCierre() {
    const nuevoEstado = caso!.estado === 'cerrado' ? 'en_seguimiento' : 'cerrado'
    await editCase(caso!.id, { estado: nuevoEstado })
    notify('success', nuevoEstado === 'cerrado' ? 'Caso cerrado.' : 'Caso reabierto.')
  }

  const draft: CaseDraft = {
    rut: caso.rut,
    nombre: caso.nombre,
    tipoPaciente: caso.tipoPaciente,
    cama: caso.cama,
    diagnosticoPrincipal: caso.diagnosticoPrincipal,
    origen: caso.origen,
    fechaInicio: caso.fechaInicio,
    estado: caso.estado,
    brecha: caso.brecha,
    planMejora: caso.planMejora,
    fechaRevision: caso.fechaRevision,
    fechaPlanMejora: caso.fechaPlanMejora,
    montoSolicitado: caso.montoSolicitado,
    montoAcordado: caso.montoAcordado,
    responsable: caso.responsable,
    resumenClinico: caso.resumenClinico,
    observaciones: caso.observaciones,
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/casos')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-grafito"
        >
          <ArrowLeft size={15} /> Volver al listado
        </button>
        {!editing && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={caso.estado === 'cerrado' ? <LockOpen size={15} /> : <Lock size={15} />}
              onClick={toggleCierre}
            >
              {caso.estado === 'cerrado' ? 'Reabrir caso' : 'Cerrar caso'}
            </Button>
            <Button variant="secondary" icon={<Pencil size={15} />} onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button variant="danger" icon={<Trash2 size={15} />} onClick={() => setConfirmDelete(true)}>
              Eliminar
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-grafito">{caso.nombre}</h2>
        <span className="text-sm font-medium text-slate-400">{caso.caseNumber}</span>
        <EstadoBadge estado={caso.estado} />
        <BrechaBadge brecha={caso.brecha} />
        <SeguimientoBadges info={info} />
      </div>

      {editing ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <CaseForm initial={draft} submitLabel="Guardar cambios" onSubmit={handleSubmit} onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Section title="1. Identificación">
            <DetailRow label="ID de caso" value={caso.caseNumber} />
            <DetailRow label="RUT" value={caso.rut} />
            <DetailRow label="Nombre" value={caso.nombre} />
            <DetailRow label="Tipo de paciente" value={tipoPacienteLabel(caso.tipoPaciente)} />
            {(caso.tipoPaciente === 'hospitalizado' || caso.tipoPaciente === 'mixto') && (
              <DetailRow label="Cama" value={caso.cama} />
            )}
            <DetailRow label="Diagnóstico principal" value={caso.diagnosticoPrincipal} />
            <DetailRow label="Creado" value={formatDateTimeDisplay(caso.createdAt)} />
            <DetailRow label="Última modificación" value={formatDateTimeDisplay(caso.updatedAt)} />
          </Section>

          <Section title="2. Antecedentes y origen">
            <DetailRow label="Origen del caso" value={caso.origen} />
            <DetailRow label="Fecha de inicio" value={formatDateDisplay(caso.fechaInicio)} />
          </Section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-grafito">3. Resumen clínico</h3>
            <p className="whitespace-pre-wrap text-sm text-grafito">{caso.resumenClinico || '—'}</p>
          </section>

          <Section title="4. Evaluación de brecha">
            <DetailRow label="Brecha identificada" value={<BrechaBadge brecha={caso.brecha} />} />
            <DetailRow label="Fecha de revisión" value={formatDateDisplay(caso.fechaRevision)} />
            <DetailRow label="Monto solicitado" value={formatCLP(caso.montoSolicitado)} />
            <DetailRow label="Monto acordado" value={formatCLP(caso.montoAcordado)} />
          </Section>

          <Section title="5. Plan de mejora">
            {caso.brecha === 'si' ? (
              <>
                <DetailRow
                  label="Fecha comprometida"
                  value={
                    <span className={info.planVencido ? 'font-medium text-alerta' : undefined}>
                      {formatDateDisplay(caso.fechaPlanMejora)}
                      {info.planVencido && ' (vencido)'}
                    </span>
                  }
                />
                <div className="col-span-full py-2">
                  <dt className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Descripción del plan
                  </dt>
                  <dd className="whitespace-pre-wrap text-sm text-grafito">{caso.planMejora || '—'}</dd>
                </div>
              </>
            ) : (
              <p className="col-span-full text-sm text-slate-400">
                No aplica — este caso no tiene una brecha identificada.
              </p>
            )}
          </Section>

          <TareasSection title="6. Tareas" caseId={caso.id} tareas={caso.tareas} />

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-grafito">7. Observaciones</h3>
            <p className="whitespace-pre-wrap text-sm text-grafito">{caso.observaciones || '—'}</p>
          </section>

          <Section title="8. Seguimiento y responsable">
            <DetailRow label="Estado del caso" value={<EstadoBadge estado={caso.estado} />} />
            <DetailRow label="Responsable" value={caso.responsable} />
            <div className="col-span-full flex flex-wrap gap-2 py-2">
              <SeguimientoBadges info={info} />
            </div>
          </Section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-grafito">9. Historial de modificaciones</h3>
            {caso.history.length === 0 ? (
              <p className="text-sm text-slate-400">Sin movimientos registrados.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {[...caso.history].reverse().map((h) => (
                  <li key={h.id} className="border-l-2 border-slate-100 pl-3">
                    <p className="text-xs text-slate-400">{formatDateTimeDisplay(h.timestamp)}</p>
                    <p className="text-sm text-grafito">
                      <span className="font-medium">{h.campo}:</span> {h.valorAnterior} → {h.valorNuevo}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}

      {confirmBrechaChange && (
        <ConfirmDialog
          title="Confirmar cambio de brecha"
          message="Este caso tenía una brecha identificada como Sí y pasará a No. Los antecedentes previos del plan de mejora se conservarán en el historial del caso. ¿Desea continuar?"
          confirmLabel="Confirmar cambio"
          danger
          onConfirm={async () => {
            const draftToSave = confirmBrechaChange
            setConfirmBrechaChange(null)
            if (draftToSave) await performSave(draftToSave)
          }}
          onCancel={() => setConfirmBrechaChange(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar caso"
          message={`¿Confirma que desea eliminar el caso ${caso.caseNumber}? El registro se conservará de forma oculta y podrá recuperarse desde el respaldo si es necesario.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={() => {
            setConfirmDelete(false)
            void handleDelete()
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
