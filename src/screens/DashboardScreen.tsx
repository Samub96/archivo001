import { useState } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Panel } from '../components/Panel'
import { ProgressBar } from '../components/ProgressBar'
import { Screen } from '../components/Screen'
import { StatusBadge } from '../components/StatusBadge'
import { PUZZLES, TOTAL_PUZZLES } from '../data/puzzles'
import { useGameStore } from '../store/gameStore'
import type { PuzzleStatus } from '../types'

export function DashboardScreen() {
  const solved = useGameStore((state) => state.solved)
  const hintsUsed = useGameStore((state) => state.hintsUsed)
  const finalRevealed = useGameStore((state) => state.finalRevealed)
  const openPuzzle = useGameStore((state) => state.openPuzzle)
  const openRecovery = useGameStore((state) => state.openRecovery)
  const enterFinal = useGameStore((state) => state.enterFinal)
  const reset = useGameStore((state) => state.reset)

  const [confirmReset, setConfirmReset] = useState(false)

  const solvedCount = solved.length
  const allSolved = solvedCount === TOTAL_PUZZLES
  const integrity = Math.round((solvedCount / TOTAL_PUZZLES) * 100)

  const statusFor = (index: number): PuzzleStatus => {
    if (index < solvedCount) return 'completed'
    if (index === solvedCount) {
      const puzzle = PUZZLES[index]
      return (hintsUsed[puzzle.id] ?? 0) > 0 ? 'in-progress' : 'available'
    }
    return 'locked'
  }

  return (
    <Screen className="justify-start">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">System dashboard</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-wide text-ink">
            ARCHIVO 001
          </h1>
        </div>
        <div className="text-right">
          <p className="label">System integrity</p>
          <p className="font-mono text-2xl text-tech">{integrity}%</p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar solved={solvedCount} total={TOTAL_PUZZLES} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <p className="label">Protocols</p>
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
              {solvedCount} / {TOTAL_PUZZLES}
            </span>
          </div>

          <ul className="mt-3 divide-y divide-tech/10">
            {PUZZLES.map((puzzle, index) => {
              const status = statusFor(index)
              return (
                <li
                  key={puzzle.id}
                  className="flex items-center gap-3 py-2.5"
                  aria-current={status === 'in-progress' ? 'step' : undefined}
                >
                  <span className="font-mono text-xs text-muted/70">
                    {String(puzzle.order).padStart(2, '0')}
                  </span>
                  <span
                    className={`flex-1 truncate font-mono text-xs sm:text-sm ${
                      status === 'locked' ? 'text-muted/50' : 'text-ink/90'
                    }`}
                  >
                    {puzzle.protocol}
                  </span>
                  {status === 'completed' && (
                    <span className="hidden font-mono text-[10px] tracking-[0.16em] text-terminal/80 uppercase sm:inline">
                      {puzzle.fragment}
                    </span>
                  )}
                  <StatusBadge status={status} />
                </li>
              )
            })}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <p className="label">Recovered data</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {PUZZLES.map((puzzle, index) => {
                const recovered = index < solvedCount
                return (
                  <div
                    key={puzzle.id}
                    className={`rounded border px-2.5 py-2 ${
                      recovered
                        ? 'border-terminal/40 bg-terminal/5'
                        : 'border-tech/10 bg-void/40'
                    }`}
                  >
                    <p className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
                      #{String(puzzle.order).padStart(2, '0')}
                    </p>
                    <p
                      className={`mt-1 truncate font-mono text-xs ${
                        recovered ? 'text-terminal' : 'text-muted/40'
                      }`}
                    >
                      {recovered ? puzzle.fragment : '—'}
                    </p>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel>
            <p className="label">Operations</p>
            <div className="mt-3 flex flex-col gap-2">
              <Button onClick={openPuzzle} disabled={allSolved}>
                {allSolved ? 'Protocols complete' : `Continue protocol ${String(solvedCount + 1).padStart(2, '0')}`}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
              <Button variant="ghost" onClick={openRecovery} disabled={!allSolved}>
                Data recovery
              </Button>
              <Button variant="quiet" onClick={enterFinal} disabled={!finalRevealed}>
                Final transmission
              </Button>
            </div>
          </Panel>

          <div className="flex justify-end">
            <Button variant="quiet" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reiniciar partida
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reiniciar la investigación"
        confirmLabel="Reiniciar"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          reset()
        }}
      >
        Se borrarán el progreso, los fragmentos y las pistas consumidas. Esta acción no se puede
        deshacer.
      </ConfirmDialog>
    </Screen>
  )
}
