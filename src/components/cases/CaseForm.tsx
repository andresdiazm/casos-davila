import { useState } from 'react'
import type { FormEvent } from 'react'
import { FieldWrapper, SelectInput, TextArea, TextInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useCatalog } from '@/context/CasesContext'
import { todayISO } from '@/lib/dates'
import type { Brecha, CaseDraft, EstadoCasoId, TipoPaciente } from '@/types/case'

const ESTADO_OPTIONS: Array<{ id: EstadoCasoId; label: string }> = [
  { id: 'ingresado', label: 'Ingresado' },
  { id: 'en_revision', label: 'En revisión' },
  { id: 'pendiente_antecedentes', label: 'Pendiente de antecedentes' },
  { id: 'en_implementacion', label: 'En implementación de mejora' },
  { id: 'en_seguimiento', label: 'En seguimiento' },
  { id: 'cerrado', label: 'Cerrado' },
]

export const emptyDraft: CaseDraft = {
  rut: '',
  nombre: '',
  tipoPaciente: '',
  cama: '',
  diagnosticoPrincipal: '',
  servicioInvolucrado: '',
  idReclamoOrdinario: '',
  origen: '',
  fechaInicio: todayISO(),
  estado: 'ingresado',
  brecha: 'pendiente',
  descripcionBrecha: '',
  planMejora: '',
  fechaRevision: '',
  fechaPlanMejora: '',
  fechaPresentacionComite: '',
  montoSolicitado: '',
  montoAcordado: '',
  responsable: '',
  resumenClinico: '',
  observaciones: '',
}

interface CaseFormProps {
  initial?: CaseDraft
  submitLabel: string
  onSubmit: (draft: CaseDraft) => void | Promise<void>
  onCancel: () => void
  showCancelAsClear?: boolean
}

type Errors = Partial<Record<keyof CaseDraft, string>>

export function CaseForm({ initial, submitLabel, onSubmit, onCancel, showCancelAsClear }: CaseFormProps) {
  const [draft, setDraft] = useState<CaseDraft>(initial ?? emptyDraft)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  const origenes = useCatalog('origen')
  const responsables = useCatalog('responsable')
  const servicios = useCatalog('servicio')

  function set<K extends keyof CaseDraft>(key: K, value: CaseDraft[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'brecha' && value !== 'si') {
        next.descripcionBrecha = ''
        next.planMejora = ''
        next.fechaPlanMejora = ''
      }
      if (key === 'tipoPaciente' && value !== 'hospitalizado' && value !== 'mixto') {
        next.cama = ''
      }
      return next
    })
  }

  function validate(d: CaseDraft): Errors {
    const errs: Errors = {}
    if (!d.rut.trim()) errs.rut = 'El RUT es obligatorio.'
    if (!d.nombre.trim()) errs.nombre = 'El nombre es obligatorio.'
    if (!d.origen) errs.origen = 'Seleccione el origen del caso.'
    if (!d.fechaInicio) errs.fechaInicio = 'La fecha de inicio es obligatoria.'
    if (!d.estado) errs.estado = 'Seleccione un estado.'
    if (!d.responsable) errs.responsable = 'Seleccione un responsable.'
    if (d.brecha === 'si' && !d.planMejora.trim()) {
      errs.planMejora = 'Describa el plan de mejora cuando existe una brecha identificada.'
    }
    if (d.montoSolicitado.trim() && (Number.isNaN(Number(d.montoSolicitado)) || Number(d.montoSolicitado) < 0)) {
      errs.montoSolicitado = 'Ingrese un monto válido.'
    }
    if (d.montoAcordado.trim() && (Number.isNaN(Number(d.montoAcordado)) || Number(d.montoAcordado) < 0)) {
      errs.montoAcordado = 'Ingrese un monto válido.'
    }
    return errs
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate(draft)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    try {
      await onSubmit(draft)
    } finally {
      setSubmitting(false)
    }
  }

  function handleClear() {
    setDraft(initial ?? emptyDraft)
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldWrapper label="RUT" htmlFor="rut" required error={errors.rut}>
          <TextInput
            id="rut"
            value={draft.rut}
            error={errors.rut}
            onChange={(e) => set('rut', e.target.value)}
            placeholder="12.345.678-5"
          />
        </FieldWrapper>

        <FieldWrapper label="Nombre completo" htmlFor="nombre" required error={errors.nombre}>
          <TextInput
            id="nombre"
            value={draft.nombre}
            error={errors.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Nombre y apellidos del paciente"
          />
        </FieldWrapper>

        <FieldWrapper label="Tipo de paciente" htmlFor="tipoPaciente" hint="Opcional">
          <SelectInput
            id="tipoPaciente"
            value={draft.tipoPaciente}
            onChange={(e) => set('tipoPaciente', e.target.value as TipoPaciente)}
          >
            <option value="">Seleccione...</option>
            <option value="hospitalizado">Hospitalizado</option>
            <option value="ambulatorio">Ambulatorio</option>
            <option value="mixto">Mixto</option>
          </SelectInput>
        </FieldWrapper>

        {(draft.tipoPaciente === 'hospitalizado' || draft.tipoPaciente === 'mixto') && (
          <FieldWrapper label="Cama" htmlFor="cama" hint="Opcional">
            <TextInput
              id="cama"
              value={draft.cama}
              onChange={(e) => set('cama', e.target.value)}
              placeholder="Ej: 304-B"
            />
          </FieldWrapper>
        )}

        <FieldWrapper label="Diagnóstico principal" htmlFor="diagnosticoPrincipal" hint="Opcional">
          <TextInput
            id="diagnosticoPrincipal"
            value={draft.diagnosticoPrincipal}
            onChange={(e) => set('diagnosticoPrincipal', e.target.value)}
            placeholder="Ej: Neumonía adquirida en la comunidad"
          />
        </FieldWrapper>

        <FieldWrapper label="Servicio involucrado" htmlFor="servicioInvolucrado" hint="Opcional">
          <SelectInput
            id="servicioInvolucrado"
            value={draft.servicioInvolucrado}
            onChange={(e) => set('servicioInvolucrado', e.target.value)}
          >
            <option value="">Seleccione...</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.label}>
                {s.label}
              </option>
            ))}
          </SelectInput>
        </FieldWrapper>

        <FieldWrapper
          label="ID de reclamo / ordinario"
          htmlFor="idReclamoOrdinario"
          hint="Opcional, número de reclamo u oficio ordinario asociado"
        >
          <TextInput
            id="idReclamoOrdinario"
            value={draft.idReclamoOrdinario}
            onChange={(e) => set('idReclamoOrdinario', e.target.value)}
            placeholder="Ej: REC-2026-0145"
          />
        </FieldWrapper>

        <FieldWrapper label="Origen del caso" htmlFor="origen" required error={errors.origen}>
          <SelectInput
            id="origen"
            value={draft.origen}
            error={errors.origen}
            onChange={(e) => set('origen', e.target.value)}
          >
            <option value="">Seleccione...</option>
            {origenes.map((o) => (
              <option key={o.id} value={o.label}>
                {o.label}
              </option>
            ))}
          </SelectInput>
        </FieldWrapper>

        <FieldWrapper label="Fecha de inicio" htmlFor="fechaInicio" required error={errors.fechaInicio}>
          <TextInput
            id="fechaInicio"
            type="date"
            value={draft.fechaInicio}
            error={errors.fechaInicio}
            onChange={(e) => set('fechaInicio', e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper label="Estado del caso" htmlFor="estado" required error={errors.estado}>
          <SelectInput
            id="estado"
            value={draft.estado}
            error={errors.estado}
            onChange={(e) => set('estado', e.target.value as EstadoCasoId)}
          >
            {ESTADO_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </SelectInput>
        </FieldWrapper>

        <FieldWrapper label="Responsable" htmlFor="responsable" required error={errors.responsable}>
          <SelectInput
            id="responsable"
            value={draft.responsable}
            error={errors.responsable}
            onChange={(e) => set('responsable', e.target.value)}
          >
            <option value="">Seleccione...</option>
            {responsables.map((r) => (
              <option key={r.id} value={r.label}>
                {r.label}
              </option>
            ))}
          </SelectInput>
        </FieldWrapper>
      </section>

      <section className="flex flex-col gap-4">
        <FieldWrapper label="Resumen clínico" htmlFor="resumenClinico" hint="Descripción general del caso en líneas generales">
          <TextArea
            id="resumenClinico"
            rows={3}
            value={draft.resumenClinico}
            onChange={(e) => set('resumenClinico', e.target.value)}
            placeholder="Describa brevemente el caso: contexto, paciente involucrado y motivo del ingreso..."
          />
        </FieldWrapper>

        <FieldWrapper label="Observaciones" htmlFor="observaciones" hint="Notas libres adicionales sobre el caso">
          <TextArea
            id="observaciones"
            rows={3}
            value={draft.observaciones}
            onChange={(e) => set('observaciones', e.target.value)}
            placeholder="Observaciones adicionales..."
          />
        </FieldWrapper>
      </section>

      <section className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
        <p className="mb-3 text-sm font-semibold text-grafito">Evaluación de brecha</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper label="Brecha identificada" htmlFor="brecha" required>
            <SelectInput
              id="brecha"
              value={draft.brecha}
              onChange={(e) => set('brecha', e.target.value as Brecha)}
            >
              <option value="pendiente">Pendiente de evaluación</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </SelectInput>
          </FieldWrapper>

          <FieldWrapper label="Fecha de revisión" htmlFor="fechaRevision" hint="Opcional">
            <TextInput
              id="fechaRevision"
              type="date"
              value={draft.fechaRevision}
              onChange={(e) => set('fechaRevision', e.target.value)}
            />
          </FieldWrapper>

          <FieldWrapper label="Fecha de presentación en comité" htmlFor="fechaPresentacionComite" hint="Opcional">
            <TextInput
              id="fechaPresentacionComite"
              type="date"
              value={draft.fechaPresentacionComite}
              onChange={(e) => set('fechaPresentacionComite', e.target.value)}
            />
          </FieldWrapper>

          {draft.brecha === 'si' && (
            <>
              <FieldWrapper
                label="Descripción de la brecha"
                htmlFor="descripcionBrecha"
                hint="Describa en qué consiste la brecha identificada"
              >
                <TextArea
                  id="descripcionBrecha"
                  rows={3}
                  value={draft.descripcionBrecha}
                  onChange={(e) => set('descripcionBrecha', e.target.value)}
                  className="sm:col-span-2"
                />
              </FieldWrapper>

              <FieldWrapper label="Fecha comprometida del plan de mejora" htmlFor="fechaPlanMejora">
                <TextInput
                  id="fechaPlanMejora"
                  type="date"
                  value={draft.fechaPlanMejora}
                  onChange={(e) => set('fechaPlanMejora', e.target.value)}
                />
              </FieldWrapper>

              <FieldWrapper
                label="Plan de mejora"
                htmlFor="planMejora"
                required
                error={errors.planMejora}
                hint="Describa las acciones comprometidas para cerrar la brecha"
              >
                <TextArea
                  id="planMejora"
                  rows={3}
                  value={draft.planMejora}
                  error={errors.planMejora}
                  onChange={(e) => set('planMejora', e.target.value)}
                  className="sm:col-span-2"
                />
              </FieldWrapper>
            </>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldWrapper
          label="Monto solicitado"
          htmlFor="montoSolicitado"
          error={errors.montoSolicitado}
          hint="Opcional, en pesos chilenos"
        >
          <TextInput
            id="montoSolicitado"
            type="number"
            min="0"
            step="1"
            value={draft.montoSolicitado}
            error={errors.montoSolicitado}
            onChange={(e) => set('montoSolicitado', e.target.value)}
            placeholder="0"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Monto acordado"
          htmlFor="montoAcordado"
          error={errors.montoAcordado}
          hint="Opcional, en pesos chilenos"
        >
          <TextInput
            id="montoAcordado"
            type="number"
            min="0"
            step="1"
            value={draft.montoAcordado}
            error={errors.montoAcordado}
            onChange={(e) => set('montoAcordado', e.target.value)}
            placeholder="0"
          />
        </FieldWrapper>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={showCancelAsClear ? handleClear : onCancel}>
          {showCancelAsClear ? 'Limpiar' : 'Cancelar'}
        </Button>
        {showCancelAsClear && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
