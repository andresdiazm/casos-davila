import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  notify: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const iconFor: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={18} className="text-turquesa" />,
  error: <AlertCircle size={18} className="text-alerta" />,
  info: <Info size={18} className="text-petroleo" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}_${Math.random()}`
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg"
            >
              {iconFor[t.type]}
              <p className="flex-1 text-sm text-grafito">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-grafito">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
