import type { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}

export function Panel({ children, className = '', as: Tag = 'div' }: PanelProps) {
  return <Tag className={`panel p-4 sm:p-5 ${className}`}>{children}</Tag>
}
