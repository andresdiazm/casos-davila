export function formatCLP(value: string | undefined | null): string {
  if (!value || !value.trim()) return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return value
  return `$${n.toLocaleString('es-CL')}`
}

/** Formato corto para ejes de gráficos (p. ej. "$2,5 mil", "$1,2 M"). */
export function formatCLPCompact(value: number): string {
  return `$${new Intl.NumberFormat('es-CL', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}`
}
