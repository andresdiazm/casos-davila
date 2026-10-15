import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-petroleo text-white hover:bg-[#123b49] focus-visible:outline-petroleo',
  secondary: 'bg-white text-grafito border border-slate-200 hover:bg-slate-50 focus-visible:outline-petroleo',
  ghost: 'bg-transparent text-grafito hover:bg-slate-100 focus-visible:outline-petroleo',
  danger: 'bg-alerta text-white hover:bg-[#c23a36] focus-visible:outline-alerta',
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
}

export function Button({ variant = 'secondary', size = 'md', icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed outline-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
