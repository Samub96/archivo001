import type { ReactNode } from 'react'

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={`relative z-10 mx-auto flex min-h-[calc(100dvh-3.25rem)] w-full max-w-5xl flex-col justify-center px-4 py-8 sm:px-6 ${className}`}
    >
      {children}
    </main>
  )
}
