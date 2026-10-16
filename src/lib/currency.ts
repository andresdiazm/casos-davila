export function formatCLP(value: string | undefined | null): string {
  if (!value || !value.trim()) return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return value
  return `$${n.toLocaleString('es-CL')}`
}
