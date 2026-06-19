import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  pulse?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-br from-orange-400 to-orange-600 text-white
    shadow-lg shadow-orange-500/30
    hover:shadow-xl hover:shadow-orange-500/40 hover:from-orange-500 hover:to-orange-700
    active:scale-[.98]
    dark:from-orange-500 dark:to-orange-700 dark:shadow-orange-600/20
  `,
  secondary: `
    bg-gray-100 text-gray-900 hover:bg-gray-200
    dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600
  `,
  outline: `
    border-2 border-gray-300 text-gray-700
    hover:border-gray-400 hover:bg-gray-50
    dark:border-slate-600 dark:text-gray-300
    dark:hover:border-slate-500 dark:hover:bg-slate-800
  `,
  ghost: `
    text-gray-600 hover:bg-gray-100 hover:text-gray-900
    dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200
  `,
  danger: `
    bg-gradient-to-r from-red-500 to-red-600 text-white
    shadow-lg shadow-red-500/30
    hover:shadow-xl hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700
    dark:from-red-600 dark:to-red-700 dark:shadow-red-600/20
    dark:hover:from-red-500 dark:hover:to-red-600
  `,
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', loading, icon, iconPosition = 'left', pulse, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2',
          'dark:focus:ring-offset-slate-900',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
          variants[variant],
          sizes[size],
          pulse && !disabled && 'animate-pulse-scale',
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    )
  }
)

Button.displayName = 'Button'
