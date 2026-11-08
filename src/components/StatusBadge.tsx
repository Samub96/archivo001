import type { PuzzleStatus } from '../types'

const styles: Record<PuzzleStatus, string> = {
  locked: 'border-tech/15 text-muted/70',
  available: 'border-warn/50 text-warn',
  'in-progress': 'border-tech/60 text-tech',
  completed: 'border-terminal/60 text-terminal',
}

const labels: Record<PuzzleStatus, string> = {
  locked: 'LOCKED',
  available: 'AVAILABLE',
  'in-progress': 'IN_PROGRESS',
  completed: 'COMPLETED',
}

export function StatusBadge({ status }: { status: PuzzleStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-[0.18em] ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
