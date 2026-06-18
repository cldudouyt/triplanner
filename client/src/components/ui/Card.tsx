import { type ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  animate?: boolean
}

export function Card({ children, className, hover = false, padding = 'md', animate = false }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border bg-white transition-all duration-300',
        'border-gray-200 dark:border-slate-700 dark:bg-slate-800',
        hover && 'hover:shadow-lg hover:-translate-y-1 hover:shadow-gray-200/50 dark:hover:shadow-slate-900/50',
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-6',
        padding === 'lg' && 'p-8',
        animate && 'animate-fade-in-up',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4'
}

export function CardTitle({ children, className, as: Tag = 'h3' }: CardTitleProps) {
  return (
    <Tag className={clsx('font-semibold text-gray-900 dark:text-gray-100', className)}>
      {children}
    </Tag>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={className}>{children}</div>
}
