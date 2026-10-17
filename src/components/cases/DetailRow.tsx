import type { ReactNode } from 'react'

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-grafito">{value || '—'}</dd>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-1.5 text-sm font-semibold text-grafito">{title}</h3>
      <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">{children}</dl>
    </section>
  )
}
