import type { ReactNode } from 'react'

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-grafito">{title}</h3>
      <div className="h-64 w-full">{children}</div>
    </div>
  )
}
