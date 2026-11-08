import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowUp, GripVertical } from 'lucide-react'
import { Button } from '../components/Button'
import { Panel } from '../components/Panel'
import { Screen } from '../components/Screen'
import { PUZZLES, canonicalOrder, puzzleById } from '../data/puzzles'
import { useGameStore } from '../store/gameStore'
import type { PuzzleId } from '../types'

const SCRAMBLE = [3, 6, 0, 7, 2, 1, 5, 4]
const RECONSTRUCTION_MS = 3000

export function DataRecoveryScreen() {
  const solved = useGameStore((state) => state.solved)
  const storedOrder = useGameStore((state) => state.finalOrder)
  const setOrder = useGameStore((state) => state.setOrder)
  const confirmOrder = useGameStore((state) => state.confirmOrder)
  const enterDashboard = useGameStore((state) => state.enterDashboard)

  const [order, setLocalOrder] = useState<PuzzleId[]>(
    () => storedOrder ?? SCRAMBLE.map((index) => PUZZLES[index].id),
  )
  const [error, setError] = useState(false)
  const [reconstructing, setReconstructing] = useState(false)
  const dragFrom = useRef<number | null>(null)

  useEffect(() => {
    if (!reconstructing) return
    const timer = window.setTimeout(() => confirmOrder(), RECONSTRUCTION_MS)
    return () => window.clearTimeout(timer)
  }, [reconstructing, confirmOrder])

  const reorder = (from: number, to: number) => {
    if (from === to) return
    if (from < 0 || from >= order.length || to < 0 || to >= order.length) return
    const next = [...order]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setLocalOrder(next)
    setOrder(next)
    setError(false)
  }

  const move = (index: number, direction: -1 | 1) => {
    reorder(index, index + direction)
  }

  const confirm = () => {
    if (reconstructing) return
    const canonical = canonicalOrder()
    const correct = order.every((id, index) => id === canonical[index])
    if (!correct) {
      setError(true)
      return
    }
    setError(false)
    setReconstructing(true)
  }

  if (solved.length !== PUZZLES.length) {
    return (
      <Screen className="items-center">
        <Panel className="w-full max-w-md text-center">
          <p className="label">Data recovery</p>
          <p className="mt-3 text-sm text-warn">Todavía faltan fragmentos por recuperar.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="quiet" onClick={enterDashboard}>
              Volver al dashboard
            </Button>
          </div>
        </Panel>
      </Screen>
    )
  }

  return (
    <Screen className="justify-start">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="quiet" onClick={enterDashboard} disabled={reconstructing}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Dashboard
        </Button>
        <p className="font-mono text-[10px] tracking-[0.22em] text-terminal uppercase">
          8/8 fragments verified
        </p>
      </div>

      <div className="mt-5">
        <p className="label">Data recovery</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-wide text-ink">
          Reconstruir la transmisión
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted">
          Ordena los ocho fragmentos recuperados. El mensaje no se revela hasta que la secuencia sea
          correcta.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <p className="label">Fragments</p>
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted/60 uppercase">
              Arrastra una tarjeta
            </p>
          </div>
          <ol className="mt-3 space-y-2">
            {order.map((id, index) => {
              const puzzle = puzzleById(id)
              return (
                <li
                  key={id}
                  draggable
                  onDragStart={(event) => {
                    dragFrom.current = index
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', String(index))
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const raw = event.dataTransfer.getData('text/plain')
                    const from = dragFrom.current ?? Number(raw)
                    dragFrom.current = null
                    if (Number.isInteger(from)) reorder(from, index)
                  }}
                  onDragEnd={() => {
                    dragFrom.current = null
                  }}
                  className="flex cursor-grab items-center gap-2 rounded border border-tech/20 bg-void/50 px-3 py-2 active:cursor-grabbing"
                >
                  <GripVertical className="size-3.5 shrink-0 text-muted/40" aria-hidden="true" />
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 truncate font-mono text-sm text-ink">{puzzle.fragment}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Subir ${puzzle.fragment}`}
                      className="rounded border border-tech/20 p-1.5 text-tech hover:border-tech/60 disabled:opacity-30"
                    >
                      <ArrowUp className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === order.length - 1}
                      aria-label={`Bajar ${puzzle.fragment}`}
                      className="rounded border border-tech/20 p-1.5 text-tech hover:border-tech/60 disabled:opacity-30"
                    >
                      <ArrowDown className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <p className="label">Sequence check</p>
            <div className="mt-3" aria-live="polite">
              {error ? (
                <p className="font-mono text-[11px] tracking-[0.14em] text-error uppercase">
                  Secuencia incorrecta. La transmisión sigue bloqueada.
                </p>
              ) : (
                <p className="text-xs text-muted">
                  Ajusta el orden y confirma. Si la secuencia es correcta, el sistema reconstruirá
                  la transmisión.
                </p>
              )}
            </div>
            <div className="mt-4">
              <Button onClick={confirm} disabled={reconstructing}>
                Confirmar secuencia
              </Button>
            </div>
          </Panel>

          <Panel className="border-tech/15">
            <p className="label">Channel</p>
            <p className="mt-2 font-mono text-xs tracking-[0.16em] text-warn uppercase">
              Communication channel: degraded
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              Final transmission: locked
            </p>
          </Panel>
        </div>
      </div>

      {reconstructing && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-void/97 px-6"
          role="status"
          aria-live="assertive"
        >
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted uppercase">
            Interface offline
          </p>
          <p className="mt-3 text-center font-display text-lg tracking-[0.22em] text-terminal uppercase sm:text-xl">
            Reconstructing transmission
          </p>

          <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
            {order.map((id, index) => (
              <motion.span
                key={id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + index * 0.16 }}
                className="rounded border border-terminal/40 bg-terminal/10 px-2 py-1 font-mono text-xs text-terminal"
              >
                {puzzleById(id).fragment}
              </motion.span>
            ))}
          </div>

          <div className="mt-6 h-0.5 w-56 overflow-hidden rounded bg-tech/15">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.4, ease: 'linear' }}
              className="h-full bg-terminal"
            />
          </div>

          <p className="mt-4 font-mono text-[10px] tracking-[0.24em] text-muted/60 uppercase">
            Do not disconnect
          </p>
        </div>
      )}
    </Screen>
  )
}
