import { Lock } from 'lucide-react'
import type { HintLevel, PuzzleDefinition } from '../types'
import { Button } from './Button'

interface HintPanelProps {
  puzzle: PuzzleDefinition
  used: HintLevel
  onUse: () => void
}

export function HintPanel({ puzzle, used, onUse }: HintPanelProps) {
  const next = used + 1

  return (
    <div className="space-y-2">
      {puzzle.hints.map((hint, index) => {
        const level = index + 1
        const revealed = used >= level
        const isNext = level === next

        return (
          <div
            key={level}
            className={`rounded border px-3 py-2 ${
              revealed ? 'border-warn/30 bg-warn/5' : 'border-tech/15 bg-transparent'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
                HINT {String(level).padStart(2, '0')}
              </span>
              {revealed ? (
                <span className="font-mono text-[10px] tracking-[0.2em] text-warn uppercase">
                  CONSUMED
                </span>
              ) : isNext ? (
                <Button variant="quiet" onClick={onUse} className="px-2 py-1 text-[10px]">
                  Request
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.2em] text-muted/60 uppercase">
                  <Lock className="size-3" aria-hidden="true" /> Locked
                </span>
              )}
            </div>
            {revealed && <p className="mt-2 text-sm text-ink/90">{hint}</p>}
          </div>
        )
      })}
    </div>
  )
}
