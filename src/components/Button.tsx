import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'quiet'

const base =
  'inline-flex items-center justify-center gap-2 rounded border px-4 py-2 font-mono text-xs tracking-[0.18em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40'

const variants: Record<Variant, string> = {
  primary:
    'border-terminal/50 bg-terminal/10 text-terminal hover:bg-terminal/20 hover:border-terminal/80',
  ghost: 'border-tech/40 bg-tech/5 text-tech hover:bg-tech/15 hover:border-tech/70',
  danger: 'border-error/50 bg-error/10 text-error hover:bg-error/20',
  quiet: 'border-tech/15 bg-transparent text-muted hover:text-ink hover:border-tech/40',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  ref?: Ref<HTMLButtonElement>
}

export function Button({ variant = 'primary', className = '', children, ref, ...rest }: ButtonProps) {
  return (
    <button ref={ref} type="button" className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
