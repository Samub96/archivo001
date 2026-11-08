import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEY } from '../data/config'
import { PUZZLE_IDS, canonicalOrder, puzzleById } from '../data/puzzles'
import type { GameState, HintLevel, Phase, PuzzleId } from '../types'
import { hasAnswer, matchesAnswer } from '../lib/validation'
import { isOptimalRoute, sanitizeRoute, type RouteNodeId } from '../lib/routing'

const PHASES: Phase[] = [
  'boot',
  'access',
  'briefing',
  'dashboard',
  'puzzle',
  'recovery',
  'final',
]

const emptyHints = (): Record<PuzzleId, HintLevel> =>
  Object.fromEntries(PUZZLE_IDS.map((id) => [id, 0])) as Record<PuzzleId, HintLevel>

const initialState = (): GameState => ({
  version: 1,
  phase: 'boot',
  startedAt: new Date().toISOString(),
  solved: [],
  hintsUsed: emptyHints(),
  keyRed: null,
  finalOrder: null,
  finalRevealed: false,
})

export const isStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const probe = `${STORAGE_KEY}:probe`
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

const isCanonicalOrder = (order: PuzzleId[]): boolean => {
  const canonical = canonicalOrder()
  return order.length === canonical.length && order.every((id, index) => id === canonical[index])
}

/**
 * Never trust persisted data. Truncates `solved` to a contiguous prefix,
 * re-derives `keyRed`, forces `finalRevealed: false` unless the order is
 * canonical, and clamps hints.
 */
export function sanitize(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as Partial<GameState>
  if (candidate.version !== 1) return null
  if (!candidate.phase || !PHASES.includes(candidate.phase)) return null

  const storedSolved = Array.isArray(candidate.solved) ? candidate.solved : []
  const solved: PuzzleId[] = []
  for (const id of PUZZLE_IDS) {
    if (storedSolved.includes(id)) solved.push(id)
    else break
  }

  const storedHints = (candidate.hintsUsed ?? {}) as Partial<Record<PuzzleId, number>>
  const hintsUsed = emptyHints()
  PUZZLE_IDS.forEach((id, index) => {
    const unlocked = index <= solved.length
    const value = Number(storedHints[id] ?? 0)
    const level = Number.isFinite(value) ? Math.min(3, Math.max(0, Math.trunc(value))) : 0
    hintsUsed[id] = (unlocked ? level : 0) as HintLevel
  })

  const hasRouting = solved.includes('routing')
  const keyRed = hasRouting ? 'RED' : null

  let finalOrder: PuzzleId[] | null = null
  if (solved.length === PUZZLE_IDS.length && Array.isArray(candidate.finalOrder)) {
    const order = candidate.finalOrder.filter((id): id is PuzzleId => PUZZLE_IDS.includes(id))
    const unique = new Set(order)
    if (order.length === PUZZLE_IDS.length && unique.size === PUZZLE_IDS.length) finalOrder = order
  }

  const finalRevealed = finalOrder !== null && isCanonicalOrder(finalOrder) && candidate.finalRevealed === true

  let phase = candidate.phase
  if (phase === 'recovery' && solved.length < PUZZLE_IDS.length) phase = 'dashboard'
  if (phase === 'final' && !finalRevealed) phase = solved.length === PUZZLE_IDS.length ? 'recovery' : 'dashboard'
  if (phase === 'puzzle' && solved.length >= PUZZLE_IDS.length) phase = 'dashboard'

  return {
    version: 1,
    phase,
    startedAt: typeof candidate.startedAt === 'string' ? candidate.startedAt : new Date().toISOString(),
    solved,
    hintsUsed,
    keyRed,
    finalOrder,
    finalRevealed,
  }
}

interface GameActions {
  persistenceAvailable: boolean
  acknowledgeBoot: () => void
  acceptMission: () => void
  enterDashboard: () => void
  openPuzzle: () => void
  closePuzzle: () => void
  solve: (id: PuzzleId, raw: string) => boolean
  solveRoute: (path: RouteNodeId[]) => boolean
  useHint: (id: PuzzleId) => void
  openRecovery: () => void
  setOrder: (order: PuzzleId[]) => void
  confirmOrder: () => boolean
  enterFinal: () => void
  reset: () => void
}

export type GameStore = GameState & GameActions

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState(),
      persistenceAvailable: isStorageAvailable(),

      acknowledgeBoot: () => set({ phase: 'access' }),

      acceptMission: () =>
        set((state) =>
          state.phase === 'access'
            ? { phase: 'briefing', startedAt: new Date().toISOString() }
            : state,
        ),

      enterDashboard: () => set({ phase: 'dashboard' }),

      openPuzzle: () =>
        set((state) =>
          state.solved.length < PUZZLE_IDS.length ? { phase: 'puzzle' } : { phase: 'dashboard' },
        ),

      closePuzzle: () =>
        set((state) => (state.phase === 'puzzle' ? { phase: 'dashboard' } : state)),

      solve: (id, raw) => {
        const state = get()
        const puzzle = puzzleById(id)
        if (puzzle.interaction === 'route') return false
        const isCurrent = PUZZLE_IDS[state.solved.length] === id
        if (!isCurrent || !hasAnswer(raw)) return false

        const accepted = puzzle.validate
          ? puzzle.validate(raw)
          : matchesAnswer(raw, puzzle.answer)
        if (!accepted) return false

        set((current) => ({
          solved: [...current.solved, id],
          keyRed: id === 'routing' ? 'RED' : current.keyRed,
        }))
        return true
      },

      solveRoute: (path) => {
        const state = get()
        if (PUZZLE_IDS[state.solved.length] !== 'routing') return false
        if (!isOptimalRoute(sanitizeRoute(path))) return false

        set((current) => ({
          solved: [...current.solved, 'routing'],
          keyRed: 'RED',
        }))
        return true
      },

      useHint: (id) => {
        const state = get()
        const index = PUZZLE_IDS.indexOf(id)
        const unlocked = index <= state.solved.length
        if (!unlocked) return
        const current = state.hintsUsed[id] ?? 0
        if (current >= 3) return
        set((prev) => ({
          hintsUsed: { ...prev.hintsUsed, [id]: (current + 1) as HintLevel },
        }))
      },

      openRecovery: () =>
        set((state) => (state.solved.length === PUZZLE_IDS.length ? { phase: 'recovery' } : state)),

      setOrder: (order) => {
        const unique = new Set(order)
        if (order.length !== PUZZLE_IDS.length || unique.size !== PUZZLE_IDS.length) return
        if (!order.every((id) => PUZZLE_IDS.includes(id))) return
        set({ finalOrder: order })
      },

      confirmOrder: () => {
        const { finalOrder } = get()
        if (!finalOrder || !isCanonicalOrder(finalOrder)) return false
        set({ finalRevealed: true, phase: 'final' })
        return true
      },

      enterFinal: () => set((state) => (state.finalRevealed ? { phase: 'final' } : state)),

      reset: () => {
        try {
          window.localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* storage unavailable: in-memory reset is enough */
        }
        set({ ...initialState(), persistenceAvailable: isStorageAvailable() })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
        version: state.version,
        phase: state.phase,
        startedAt: state.startedAt,
        solved: state.solved,
        hintsUsed: state.hintsUsed,
        keyRed: state.keyRed,
        finalOrder: state.finalOrder,
        finalRevealed: state.finalRevealed,
      }),
      merge: (persisted, current) => {
        const clean = sanitize(persisted)
        if (!clean) {
          try {
            window.localStorage.removeItem(STORAGE_KEY)
          } catch {
            /* nothing to clean up */
          }
          return current
        }
        return { ...current, ...clean }
      },
    },
  ),
)

export const currentPuzzleId = (solved: PuzzleId[]): PuzzleId | null =>
  solved.length < PUZZLE_IDS.length ? PUZZLE_IDS[solved.length] : null
