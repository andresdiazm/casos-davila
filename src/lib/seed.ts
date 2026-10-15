import { addTarea, createCase } from '@/lib/casesRepo'
import { db } from '@/lib/db'
import { formatearRut } from '@/lib/rut'
import type { Brecha, CaseDraft, EstadoCasoId } from '@/types/case'

function dvFor(cuerpo: number): string {
  let suma = 0
  let multiplicador = 2
  const digits = String(cuerpo).split('').reverse()
  for (const d of digits) {
    suma += parseInt(d, 10) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }
  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

function fakeRut(seed: number): string {
  const cuerpo = 10000000 + seed * 137
  return formatearRut(`${cuerpo}-${dvFor(cuerpo)}`)
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoDaysFromNow(days: number): string {
  return isoDaysAgo(-days)
}

const NOMBRES = [
  'María Fernández Soto', 'Juan Pérez Rojas', 'Carla Muñoz Díaz', 'Pedro Sánchez Lira',
  'Andrea Torres Vega', 'Luis Castillo Pino', 'Francisca Araya Bravo', 'Diego Morales Cea',
  'Valentina Reyes Ortiz', 'Cristián Gómez Silva', 'Paulina Herrera Nova', 'Rodrigo Vargas Luna',
  'Camila Contreras Paz', 'Sebastián Flores Aguirre', 'Javiera Núñez Campos', 'Tomás Rivas Salas',
]

const ORIGENES = [
  'Reclamo de paciente', 'Evento adverso', 'Evento centinela', 'Auditoría clínica',
  'Hallazgo interno', 'Solicitud de jefatura', 'Mediación o demanda',
  'Fiscalización o requerimiento regulatorio', 'Otro',
]

const ESTADOS: EstadoCasoId[] = [
  'ingresado', 'en_revision', 'pendiente_antecedentes', 'en_implementacion', 'en_seguimiento', 'cerrado',
]

const RESPONSABLES = ['Calidad y Seguridad del Paciente', 'Subdirección Médica', 'Enfermería Supervisión']

const BRECHAS: Brecha[] = ['si', 'no', 'pendiente']

export async function seedDemoData(): Promise<number> {
  const count = 24
  let created = 0
  for (let i = 0; i < count; i++) {
    const estado = ESTADOS[i % ESTADOS.length]
    const brecha = BRECHAS[i % BRECHAS.length]
    const diasInicio = 10 + i * 7
    const tieneRevision = i % 5 !== 0
    let fechaRevision = ''
    if (tieneRevision) {
      const offset = (i % 7) - 3
      fechaRevision = offset < 0 ? isoDaysAgo(-offset) : isoDaysFromNow(offset)
    }
    let fechaPlanMejora = ''
    let planMejora = ''
    if (brecha === 'si') {
      const offset = (i % 9) - 4
      fechaPlanMejora = offset < 0 ? isoDaysAgo(-offset) : isoDaysFromNow(offset)
      planMejora = 'Plan de mejora en definición junto al equipo clínico responsable del proceso involucrado.'
    }

    const draft: CaseDraft = {
      rut: fakeRut(i + 1),
      nombre: NOMBRES[i % NOMBRES.length],
      origen: ORIGENES[i % ORIGENES.length],
      fechaInicio: isoDaysAgo(diasInicio),
      estado,
      brecha,
      planMejora,
      fechaRevision,
      fechaPlanMejora,
      responsable: RESPONSABLES[i % RESPONSABLES.length],
      resumenClinico: `Caso originado por ${ORIGENES[i % ORIGENES.length].toLowerCase()}, relacionado con la atención de ${NOMBRES[i % NOMBRES.length]}. En evaluación por el equipo de calidad y seguridad del paciente.`,
      observaciones: i % 3 === 0 ? 'Pendiente de coordinar reunión con el equipo clínico involucrado.' : '',
    }
    const record = await createCase(draft)
    await db.cases.update(record.id, { isDemo: true })

    if (i % 4 === 0) {
      await addTarea(record.id, {
        descripcion: 'Solicitar antecedentes clínicos complementarios',
        responsable: RESPONSABLES[(i + 1) % RESPONSABLES.length],
        fechaLimite: isoDaysFromNow(5),
      })
    }
    if (brecha === 'si') {
      await addTarea(record.id, {
        descripcion: 'Validar avance del plan de mejora con la jefatura del servicio',
        responsable: RESPONSABLES[i % RESPONSABLES.length],
        fechaLimite: isoDaysAgo((i % 6) - 2),
      })
    }

    created++
  }
  return created
}
