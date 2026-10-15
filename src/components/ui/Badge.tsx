import type { ReactNode } from 'react'
import clsx from 'clsx'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-alerta',
  info: 'bg-teal-50 text-petroleo',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  )
}
