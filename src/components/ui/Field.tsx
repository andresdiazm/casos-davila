import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

interface FieldWrapperProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}

export function FieldWrapper({ label, htmlFor, required, error, hint, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-grafito">
        {label}
        {required && <span className="text-alerta ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-alerta">{error}</p>}
    </div>
  )
}

const baseInputClasses =
  'w-full rounded-lg border px-2.5 py-1.5 text-sm text-grafito outline-none transition-colors placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400'

function borderClasses(error?: string) {
  return error
    ? 'border-alerta focus:border-alerta focus:ring-2 focus:ring-red-100'
    : 'border-slate-200 focus:border-turquesa focus:ring-2 focus:ring-teal-100'
}

export function TextInput({
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <input className={clsx(baseInputClasses, borderClasses(error), className)} {...props} />
}

export function SelectInput({
  error,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <select className={clsx(baseInputClasses, borderClasses(error), 'bg-white', className)} {...props}>
      {children}
    </select>
  )
}

export function TextArea({
  error,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return <textarea className={clsx(baseInputClasses, borderClasses(error), 'resize-none', className)} {...props} />
}
