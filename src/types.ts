export type Phase =
  | 'boot'
  | 'access'
  | 'briefing'
  | 'dashboard'
  | 'puzzle'
  | 'recovery'
  | 'final'

export type PuzzleId =
  | 'caesar'
  | 'binary'
  | 'logic-gates'
  | 'pattern'
  | 'routing'
  | 'morse'
  | 'polybius'
  | 'vigenere'

export type HintLevel = 0 | 1 | 2 | 3

export type PuzzleStatus = 'locked' | 'available' | 'in-progress' | 'completed'

/**
 * `text` puzzles answer through the response field.
 * `route` puzzles are solved by walking the topology: there is no typed answer.
 */
export type PuzzleInteraction = 'text' | 'route'

export interface PuzzleDefinition {
  id: PuzzleId
  order: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  protocol: string
  description: string
  instructions: string
  content: string
  fragment: string
  answer: string
  hints: [string, string, string]
  interaction?: PuzzleInteraction
  validate?: (raw: string) => boolean
}

export interface GameState {
  version: 1
  phase: Phase
  startedAt: string
  solved: PuzzleId[]
  hintsUsed: Record<PuzzleId, HintLevel>
  keyRed: string | null
  finalOrder: PuzzleId[] | null
  finalRevealed: boolean
}
