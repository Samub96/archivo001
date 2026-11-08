import { motion } from 'framer-motion'
import { Button } from './Button'
import type { PuzzleDefinition } from '../types'

interface RecoveredCardProps {
  puzzle: PuzzleDefinition
  onClose: () => void
}

export function RecoveredCard({ puzzle, onClose }: RecoveredCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded border border-terminal/50 bg-terminal/10 p-4"
      role="status"
    >
      <p className="font-mono text-[10px] tracking-[0.22em] text-terminal uppercase">
        Data recovered
      </p>
      <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
        Fragment #{String(puzzle.order).padStart(2, '0')}
      </p>
      <p className="mt-1 font-mono text-lg tracking-[0.12em] text-terminal">{puzzle.fragment}</p>
      <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-terminal/70 uppercase">
        Status: secured
      </p>
      <div className="mt-3">
        <Button variant="ghost" onClick={onClose}>
          Volver al dashboard
        </Button>
      </div>
    </motion.div>
  )
}
