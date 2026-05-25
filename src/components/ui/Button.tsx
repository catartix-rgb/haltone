'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'glass', size = 'md', icon, children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'group relative inline-flex items-center justify-center gap-2',
          'font-sans font-medium tracking-tight',
          'rounded-full transition-all duration-200',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'active:scale-[0.97]',
          // sizes
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'md' && 'h-10 px-4 text-sm',
          size === 'lg' && 'h-12 px-6 text-base',
          // variants
          variant === 'primary' &&
            'bg-gradient-to-br from-aqua-400 via-aqua-500 to-aqua-600 text-white shadow-glass-md hover:shadow-glass-lg',
          variant === 'ghost' &&
            'text-ink-800 hover:bg-white/30 hover:backdrop-blur-md',
          variant === 'glass' &&
            'glass text-ink-800 hover:glass-strong shadow-glass-sm hover:shadow-glass-md',
          className,
        )}
        {...props}
      >
        {icon && <span className="flex h-4 w-4 items-center justify-center">{icon}</span>}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
