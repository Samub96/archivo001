import { TOTAL_PUZZLES } from '../data/puzzles'
import { useGameStore } from '../store/gameStore'
import type { Phase } from '../types'

const phaseLabel: Record<Phase, string> = {
  boot: 'INIT',
  access: 'ACCESS',
  briefing: 'BRIEFING',
  dashboard: 'DASHBOARD',
  puzzle: 'PROTOCOL',
  recovery: 'DATA RECOVERY',
  final: 'FINAL TRANSMISSION',
}

export function StatusBar() {
  const phase = useGameStore((state) => state.phase)
  const solved = useGameStore((state) => state.solved.length)
  const available = useGameStore((state) => state.persistenceAvailable)
  const integrity = Math.round((solved / TOTAL_PUZZLES) * 100)

  return (
    <header className="relative z-10 border-b border-tech/15 bg-void/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-sm font-bold tracking-[0.2em] text-ink">
            ARCHIVO 001
          </span>
          <span className="hidden font-mono text-[10px] tracking-[0.22em] text-muted uppercase sm:inline">
            / {phaseLabel[phase]}
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.18em] uppercase">
          {!available && (
            <span className="text-warn" title="LocalStorage no disponible: el progreso no se guardará">
              NO PERSIST
            </span>
          )}
          <span className="text-muted">
            INTEGRITY <span className="text-tech">{String(integrity).padStart(2, '0')}%</span>
          </span>
        </div>
      </div>
    </header>
  )
}
