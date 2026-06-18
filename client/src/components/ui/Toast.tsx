import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((options: Omit<ToastItem, 'id'>) => {
    const id = ++toastId
    const duration = options.duration ?? 5000

    setToasts((prev) => [...prev, { ...options, id }])

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }

    return id
  }, [removeToast])

  const toast = useCallback((options: Omit<ToastItem, 'id'>) => addToast(options), [addToast])
  const success = useCallback((title: string, description?: string) => addToast({ type: 'success', title, description }), [addToast])
  const error = useCallback((title: string, description?: string) => addToast({ type: 'error', title, description }), [addToast])
  const warning = useCallback((title: string, description?: string) => addToast({ type: 'warning', title, description }), [addToast])
  const info = useCallback((title: string, description?: string) => addToast({ type: 'info', title, description }), [addToast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[9998] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((item) => (
            <Toast key={item.id} {...item} onClose={() => removeToast(item.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
  info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
}

const iconStyles: Record<ToastType, string> = {
  success: 'text-green-500 dark:text-green-400',
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-amber-500 dark:text-amber-400',
  info: 'text-blue-500 dark:text-blue-400',
}

interface ToastProps extends ToastItem {
  onClose: () => void
}

export function Toast({ type, title, description, onClose }: ToastProps) {
  return (
    <div
      className={clsx(
        'pointer-events-auto rounded-xl border p-4 shadow-lg',
        'animate-slide-in-right',
        typeStyles[type]
      )}
    >
      <div className="flex gap-3">
        <div className={iconStyles[type]}>{icons[type]}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          {description && (
            <p className="mt-1 text-sm opacity-80">{description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
