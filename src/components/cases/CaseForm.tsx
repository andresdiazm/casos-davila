import { useState } from 'react'
import type { FormEvent } from 'react'
import { FieldWrapper, SelectInput, TextArea, TextInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useCatalog } from '@/context/CasesContext'
import { formatearRut, validarRut } from '@/lib/rut'
import { todayISO } from '@/lib/dates'
import type { Brecha, CaseDraft, EstadoCasoId } from '@/types/case'

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
  origen: '',
  fechaInicio: todayISO(),
  estado: 'ingresado',
  brecha: 'pendiente',
  planMejora: '',
  fechaRevision: '',
  fechaPlanMejora: '',
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

  function set<K extends keyof CaseDraft>(key: K, value: CaseDraft[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'brecha' && value !== 'si') {
        next.planMejora = ''
        next.fechaPlanMejora = ''
      }
      return next
    })
  }

  function validate(d: CaseDraft): Errors {
    const errs: Errors = {}
    if (!d.rut.trim()) errs.rut = 'El RUT es obligatorio.'
    else if (!validarRut(d.rut)) errs.rut = 'El RUT ingresado no es válido (verifique el dígito verificador).'
    if (!d.nombre.trim()) errs.nombre = 'El nombre es obligatorio.'
    if (!d.origen) errs.origen = 'Seleccione el origen del caso.'
    if (!d.fechaInicio) errs.fechaInicio = 'La fecha de inicio es obligatoria.'
    if (!d.estado) errs.estado = 'Seleccione un estado.'
    if (!d.responsable) errs.responsable = 'Seleccione un responsable.'
    if (d.brecha === 'si' && !d.planMejora.trim()) {
      errs.planMejora = 'Describa el plan de mejora cuando existe una brecha identificada.'
    }
    return errs
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const normalized = { ...draft, rut: draft.rut.trim() ? formatearRut(draft.rut) : draft.rut }
    const errs = validate(normalized)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    try {
      await onSubmit(normalized)
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
        <FieldWrapper label="RUT" htmlFor="rut" required error={errors.rut} hint="Formato: 12.345.678-5">
          <TextInput
            id="rut"
            value={draft.rut}
            error={errors.rut}
            onChange={(e) => set('rut', e.target.value)}
            onBlur={(e) => {
              if (e.target.value.trim()) set('rut', formatearRut(e.target.value))
            }}
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

          {draft.brecha === 'si' && (
            <>
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
