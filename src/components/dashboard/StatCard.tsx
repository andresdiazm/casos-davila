import type { ReactNode } from 'react'
import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: number
  icon: ReactNode
  tone?: 'default' | 'alert' | 'warning'
}

const toneClasses = {
  default: 'bg-teal-50 text-petroleo',
  alert: 'bg-red-50 text-alerta',
  warning: 'bg-amber-50 text-ambar',
}

export function StatCard({ label, value, icon, tone = 'default' }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold leading-tight text-grafito">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}
