import { useId, useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { Button } from '../components/Button'
import { HintPanel } from '../components/HintPanel'
import { Panel } from '../components/Panel'
import { RecoveredCard } from '../components/RecoveredCard'
import { Screen } from '../components/Screen'
import { PUZZLES, puzzleById } from '../data/puzzles'
import {
  LogicGateBoard,
  MorseReference,
  NetworkRouting,
  PolybiusSquare,
  RedKeyPanel,
} from '../features/puzzles'
import { useGameStore } from '../store/gameStore'
import { hasAnswer } from '../lib/validation'

type Feedback = 'idle' | 'empty' | 'error' | 'success'

export function PuzzleScreen() {
  const solved = useGameStore((state) => state.solved)
  const hintsUsed = useGameStore((state) => state.hintsUsed)
  const solve = useGameStore((state) => state.solve)
  const requestHint = useGameStore((state) => state.useHint)
  const closePuzzle = useGameStore((state) => state.closePuzzle)

  // Pinned at mount: solving must not swap the protocol under the success card.
  const [activeId] = useState(() => PUZZLES[Math.min(solved.length, PUZZLES.length - 1)].id)
  const puzzle = puzzleById(activeId)
  const hintLevel = hintsUsed[puzzle.id] ?? 0
  const inputId = useId()
  const feedbackId = useId()

  const isRoute = puzzle.interaction === 'route'
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState<Feedback>('idle')
  const isSolved = feedback === 'success'

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (isSolved) return
    if (!hasAnswer(value)) {
      setFeedback('empty')
      return
    }
    setFeedback(solve(puzzle.id, value) ? 'success' : 'error')
  }

  const support =
    puzzle.id === 'logic-gates' ? (
      <LogicGateBoard />
    ) : puzzle.id === 'morse' ? (
      <MorseReference />
    ) : puzzle.id === 'polybius' ? (
      <PolybiusSquare
        onUse={(selection) => {
          setValue(selection)
          setFeedback('idle')
        }}
      />
    ) : puzzle.id === 'vigenere' ? (
      <RedKeyPanel />
    ) : null

  return (
    <Screen className="justify-start">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="quiet" onClick={closePuzzle}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Dashboard
        </Button>
        <p className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
          Protocol {String(puzzle.order).padStart(2, '0')} / {String(PUZZLES.length).padStart(2, '0')}
        </p>
      </div>

      <div
        className={`mt-5 grid gap-4 ${
          isRoute
            ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,0.85fr)]'
            : 'lg:grid-cols-[1.25fr_1fr]'
        }`}
      >
        <div className="min-w-0 space-y-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide text-ink sm:text-3xl">
              {puzzle.protocol}
            </h1>
            <p className="mt-2 text-sm text-muted">{puzzle.description}</p>
            <p className="mt-3 text-sm text-ink/85">{puzzle.instructions}</p>
          </div>

          {isRoute ? (
            <>
              <NetworkRouting solved={isSolved} onSolved={() => setFeedback('success')} />
              {isSolved && <RecoveredCard puzzle={puzzle} onClose={closePuzzle} />}
            </>
          ) : (
            <>
              <pre className="scanline overflow-x-auto rounded-md border border-tech/20 bg-[#060a12]/90 p-4 font-mono text-xs leading-relaxed text-tech/90 sm:text-sm">
                {puzzle.content}
              </pre>

              {support}

              {isSolved ? (
                <RecoveredCard puzzle={puzzle} onClose={closePuzzle} />
              ) : (
                <form onSubmit={onSubmit} className="panel p-4">
                  <label htmlFor={inputId} className="label block">
                    Response
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      id={inputId}
                      value={value}
                      onChange={(event) => {
                        setValue(event.target.value)
                        setFeedback('idle')
                      }}
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-describedby={feedbackId}
                      aria-invalid={feedback === 'error'}
                      placeholder="Escribe la respuesta"
                      className="min-w-0 flex-1 rounded border border-tech/25 bg-void/70 px-3 py-2 font-mono text-base text-ink placeholder:text-muted/50 focus:border-terminal/60 sm:text-sm"
                    />
                    <Button type="submit">
                      <Check className="size-3.5" aria-hidden="true" />
                      Validar
                    </Button>
                  </div>

                  <div id={feedbackId} aria-live="polite" className="mt-3 min-h-5">
                    {feedback === 'empty' && (
                      <p className="font-mono text-[11px] tracking-[0.14em] text-warn uppercase">
                        Escribe una respuesta antes de validar.
                      </p>
                    )}
                    {feedback === 'error' && (
                      <p className="font-mono text-[11px] tracking-[0.14em] text-error uppercase">
                        Respuesta incorrecta. El protocolo sigue abierto.
                      </p>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        <Panel className="h-fit">
          <p className="label">Hint system</p>
          <div className="mt-3">
            <HintPanel puzzle={puzzle} used={hintLevel} onUse={() => requestHint(puzzle.id)} />
          </div>
        </Panel>
      </div>
    </Screen>
  )
}
