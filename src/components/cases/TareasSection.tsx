import { useState } from 'react'
import { ListTodo, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TextInput } from '@/components/ui/Field'
import { useCases } from '@/context/CasesContext'
import { useToast } from '@/context/ToastContext'
import { formatDateDisplay, isPast } from '@/lib/dates'
import type { Tarea } from '@/types/case'
import clsx from 'clsx'

interface TareasSectionProps {
  caseId: string
  tareas: Tarea[]
  title?: string
}

export function TareasSection({ caseId, tareas, title = 'Tareas' }: TareasSectionProps) {
  const { addTarea, toggleTarea, removeTarea } = useCases()
  const { notify } = useToast()
  const [descripcion, setDescripcion] = useState('')
  const [responsable, setResponsable] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const pendientes = tareas.filter((t) => !t.completada)
  const completadas = tareas.filter((t) => t.completada)
  const ordenadas = [...pendientes, ...completadas]

  async function handleAdd() {
    const desc = descripcion.trim()
    if (!desc) return
    setSubmitting(true)
    try {
      await addTarea(caseId, { descripcion: desc, responsable: responsable.trim(), fechaLimite })
      setDescripcion('')
      setResponsable('')
      setFechaLimite('')
      notify('success', 'Tarea agregada.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(tareaId: string) {
    await toggleTarea(caseId, tareaId)
  }

  async function handleDelete(tareaId: string) {
    await removeTarea(caseId, tareaId)
    notify('success', 'Tarea eliminada.')
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-grafito">
        <ListTodo size={16} /> {title}
        {tareas.length > 0 && (
          <span className="font-normal text-slate-400">
            ({completadas.length}/{tareas.length} completadas)
          </span>
        )}
      </h3>

      {ordenadas.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">Sin tareas registradas para este caso.</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-2">
          {ordenadas.map((t) => {
            const vencida = !t.completada && isPast(t.fechaLimite)
            return (
              <li
                key={t.id}
                className="flex items-start gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  checked={t.completada}
                  onChange={() => handleToggle(t.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-petroleo focus:ring-turquesa"
                />
                <div className="min-w-0 flex-1">
                  <p className={clsx('text-sm text-grafito', t.completada && 'text-slate-400 line-through')}>
                    {t.descripcion}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {t.responsable && <span>{t.responsable}</span>}
                    {t.fechaLimite && <span>Vence: {formatDateDisplay(t.fechaLimite)}</span>}
                    {vencida && <Badge tone="danger">Vencida</Badge>}
                    {t.completada && <Badge tone="success">Completada</Badge>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-slate-400 hover:text-alerta"
                  aria-label="Eliminar tarea"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <TextInput
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Nueva tarea..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <TextInput
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
          placeholder="Responsable (opcional)"
          className="sm:w-44"
        />
        <TextInput
          type="date"
          value={fechaLimite}
          onChange={(e) => setFechaLimite(e.target.value)}
          className="sm:w-40"
        />
        <Button variant="secondary" icon={<Plus size={15} />} onClick={handleAdd} disabled={submitting || !descripcion.trim()}>
          Agregar
        </Button>
      </div>
    </section>
  )
}
