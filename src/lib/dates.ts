export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function nowISO(): string {
  return new Date().toISOString()
}

/** Compares a date-only ISO string ("YYYY-MM-DD") against today, local time, ignoring hours. */
export function compareToToday(dateISO: string): -1 | 0 | 1 {
  const today = todayISO()
  if (dateISO === today) return 0
  return dateISO < today ? -1 : 1
}

export function isPast(dateISO: string | undefined | null): boolean {
  if (!dateISO) return false
  return compareToToday(dateISO) === -1
}

export function isToday(dateISO: string | undefined | null): boolean {
  if (!dateISO) return false
  return compareToToday(dateISO) === 0
}

export function isFuture(dateISO: string | undefined | null): boolean {
  if (!dateISO) return false
  return compareToToday(dateISO) === 1
}

export function formatDateDisplay(dateISO: string | undefined | null): string {
  if (!dateISO) return '—'
  const [y, m, d] = dateISO.split('-')
  if (!y || !m || !d) return dateISO
  return `${d}-${m}-${y}`
}

export function formatDateTimeDisplay(isoDateTime: string | undefined | null): string {
  if (!isoDateTime) return '—'
  const d = new Date(isoDateTime)
  if (Number.isNaN(d.getTime())) return isoDateTime
  const fecha = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
  const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${fecha} ${hora}`
}

export function monthKey(dateISO: string): string {
  return dateISO.slice(0, 7)
}

export function monthLabel(monthKeyStr: string): string {
  const [y, m] = monthKeyStr.split('-')
  const meses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ]
  const idx = parseInt(m, 10) - 1
  return `${meses[idx] ?? m} ${y}`
}
