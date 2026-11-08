/**
 * Functional unit checks for ARCHIVO 001.
 *
 * The important property here is that every answer is *derived* from the
 * puzzle content, not compared against the answer declared next to it. If a
 * puzzle text changes without its answer, these checks fail.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CLOSING_MESSAGE, MESSAGE, STORAGE_KEY } from '../../src/data/config'
import { PUZZLES, PUZZLE_IDS, TOTAL_PUZZLES, canonicalOrder, puzzleById } from '../../src/data/puzzles'
import {
  END,
  MINIMUM_COST,
  MINIMUM_ROUTE,
  ROUTE_EDGES,
  START,
  isOptimalRoute,
  isWalkablePath,
  routeCost,
  sanitizeRoute,
  type RouteNodeId,
} from '../../src/lib/routing'
import { hasAnswer, matchesAnswer, normalize } from '../../src/lib/validation'
import { sanitize, useGameStore } from '../../src/store/gameStore'

let failures = 0
let total = 0

function check(name: string, condition: boolean) {
  total += 1
  if (condition) {
    console.log(`ok   ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}`)
  }
}

function equal<T>(name: string, actual: T, expected: T) {
  check(`${name} (${JSON.stringify(actual)} === ${JSON.stringify(expected)})`, actual === expected)
}

const puzzle = (id: string) => puzzleById(id as never)

/* -------------------------------------------------------------------------- */
/* 1. Validation contract                                                      */
/* -------------------------------------------------------------------------- */

equal('normalize trims and lowercases', normalize('  ENtre  '), 'entre')
equal('normalize strips accents', normalize('ELEGIRÍA'), 'elegiria')
equal('normalize collapses inner spaces', normalize('la   nuestra'), 'la nuestra')
check('hasAnswer rejects whitespace', !hasAnswer('   '))
check('hasAnswer accepts text', hasAnswer('a'))
check('matchesAnswer ignores case', matchesAnswer('entre', 'ENTRE'))
check('matchesAnswer ignores accents', matchesAnswer('elegiria', 'ELEGIRÍA'))
check('matchesAnswer rejects wrong text', !matchesAnswer('entres', 'ENTRE'))
check('matchesAnswer rejects empty input', !matchesAnswer('   ', 'ENTRE'))

/* -------------------------------------------------------------------------- */
/* 2. Puzzle catalogue                                                         */
/* -------------------------------------------------------------------------- */

equal('eight protocols', TOTAL_PUZZLES, 8)
equal(
  'orders are 1..8',
  PUZZLES.map((item) => item.order).join(','),
  '1,2,3,4,5,6,7,8',
)
equal('ids are unique', new Set(PUZZLE_IDS).size, 8)
check(
  'every protocol declares three hints',
  PUZZLES.every((item) => item.hints.length === 3 && item.hints.every((hint) => hint.length > 0)),
)
const words = (text: string) =>
  normalize(text)
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)

check(
  'every fragment is part of the final message',
  PUZZLES.every((item) => words(MESSAGE).includes(normalize(item.fragment))),
)
equal(
  'fragments rebuild the message',
  words(PUZZLES.map((item) => item.fragment).join(' ')).join(' '),
  words(MESSAGE).join(' '),
)
equal('canonical order matches protocol order', canonicalOrder().join(','), PUZZLE_IDS.join(','))
equal('only protocol 05 is a route interaction', PUZZLES.filter((p) => p.interaction === 'route').length, 1)
equal('the route protocol is 05', puzzle('routing').interaction, 'route')
check(
  'no other protocol declares a route interaction',
  PUZZLES.filter((p) => p.id !== 'routing').every((p) => p.interaction === undefined),
)

/* -------------------------------------------------------------------------- */
/* 3. Answers derived from the published content                               */
/* -------------------------------------------------------------------------- */

const caesar = (text: string, shift: number) =>
  text.replace(/[A-Z]/g, (letter) =>
    String.fromCharCode(((letter.charCodeAt(0) - 65 - shift + 26) % 26) + 65),
  )

equal('01 caesar: HQWUH shifted back three is the answer', caesar('HQWUH', 3), puzzle('caesar').answer)

const binaryText = puzzle('binary')
  .content.split('\n')
  .filter((line) => /^[01]{8}$/.test(line.trim()))
  .map((line) => String.fromCharCode(Number.parseInt(line.trim(), 2)))
  .join('')
equal('02 binary: the eight bytes spell the answer', binaryText, puzzle('binary').answer)

function evaluateGate(expression: string, values: Record<string, 0 | 1>): number {
  const tokens = expression.trim().split(/\s+/)
  let index = 0
  const operand = (): number => {
    if (tokens[index] === 'NOT') {
      index += 1
      return 1 - operand()
    }
    const name = tokens[index]
    index += 1
    const value = values[name]
    if (value === undefined) throw new Error(`unknown variable: ${name}`)
    return value
  }
  let left = operand()
  while (index < tokens.length) {
    const operator = tokens[index]
    index += 1
    const right = operand()
    if (operator === 'AND') left &= right
    else if (operator === 'OR') left |= right
    else if (operator === 'XOR') left ^= right
    else throw new Error(`unknown operator: ${operator}`)
  }
  return left
}

const gateLines = puzzle('logic-gates')
  .content.split('\n')
  .map((line) => line.trim())
const byteOneStart = gateLines.indexOf('BYTE 1:')
const byteTwoStart = gateLines.indexOf('BYTE 2:')
const gateValues = { A: 1 as const, B: 0 as const, C: 1 as const }
const toChar = (lines: string[]) =>
  String.fromCharCode(
    Number.parseInt(
      lines.map((line) => evaluateGate(line, gateValues)).join(''),
      2,
    ),
  )
const gateText =
  toChar(gateLines.slice(byteOneStart + 1, byteTwoStart).filter(Boolean)) +
  toChar(gateLines.slice(byteTwoStart + 1).filter(Boolean))
equal('03 logic gates: both bytes decode to the answer', gateText, puzzle('logic-gates').answer)

const patternLines = puzzle('pattern').content.split('\n')
const squares = patternLines[0]
  .split('-')
  .map((part) => part.trim())
  .filter((part) => /^\d+$/.test(part))
  .map(Number)
const squaresAreConsecutive = squares.every((value, index) => value === (index + 1) ** 2)
const nextSquare = (squares.length + 1) ** 2
const squareRoot = Math.sqrt(nextSquare)
const rows = patternLines.filter((line) => /^[A-Z]{6}$/.test(line.trim()))
const patternText = rows.map((row) => row.trim()[squareRoot - 1]).join('')
check('04 pattern: the sequence is made of consecutive squares', squaresAreConsecutive)
equal('04 pattern: next square is 36', nextSquare, 36)
equal('04 pattern: extraction index is 6', squareRoot, 6)
equal('04 pattern: the sixth column spells the answer', patternText, puzzle('pattern').answer)

const MORSE: Record<string, string> = {
  '.-': 'A',
  '-...': 'B',
  '-.-.': 'C',
  '-..': 'D',
  '.': 'E',
  '..-.': 'F',
  '--.': 'G',
  '....': 'H',
  '..': 'I',
  '.---': 'J',
  '-.-': 'K',
  '.-..': 'L',
  '--': 'M',
  '-.': 'N',
  '---': 'O',
  '.--.': 'P',
  '--.-': 'Q',
  '.-.': 'R',
  '...': 'S',
  '-': 'T',
  '..-': 'U',
  '...-': 'V',
  '.--': 'W',
  '-..-': 'X',
  '-.--': 'Y',
  '--..': 'Z',
}
const morseText = puzzle('morse')
  .content.split('/')
  .map((group) => MORSE[group.trim()] ?? '?')
  .join('')
equal('06 morse: the groups spell the answer', morseText, puzzle('morse').answer)

const POLYBIUS = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'K'],
  ['L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z'],
]
const coordinates = puzzle('polybius').content.match(/\d{2}(?:\s*-\s*\d{2})*/g) ?? []
const polybiusText = coordinates[coordinates.length - 1]
  .split('-')
  .map((pair) => pair.trim())
  .map((pair) => POLYBIUS[Number(pair[0]) - 1][Number(pair[1]) - 1])
  .join('')
equal('07 polybius: 31-11 resolve to the answer', polybiusText, puzzle('polybius').answer)

function vigenereDecode(cipher: string, key: string): string {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '')
  return cipher
    .toUpperCase()
    .replace(/[A-Z]/g, (letter, index) => {
      const shift = cleanKey[index % cleanKey.length].charCodeAt(0) - 65
      return String.fromCharCode(((letter.charCodeAt(0) - 65 - shift + 26) % 26) + 65)
    })
}
const cipherLine = puzzle('vigenere')
  .content.split('\n')
  .map((line) => line.trim())
  .find((line) => /^[A-Z]+$/.test(line))
equal(
  '08 vigenere: the cipher with key RED decodes to the answer',
  cipherLine ? vigenereDecode(cipherLine, 'RED') : '',
  puzzle('vigenere').answer,
)

/* -------------------------------------------------------------------------- */
/* 4. Routing topology                                                        */
/* -------------------------------------------------------------------------- */

const contentEdges = new Map(
  puzzle('routing')
    .content.split('\n')
    .map((line) => line.trim().match(/^([A-Z][A-Z0-9]*) → ([A-Z][A-Z0-9]*)\s+(\d+)$/))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => [
      [match[1], match[2]].sort().join('-'),
      Number(match[3]),
    ]),
)
equal('05 topology: content declares fifteen links', contentEdges.size, 15)
equal('05 topology: code graph matches the published costs', ROUTE_EDGES.length, contentEdges.size)
check(
  '05 topology: every code edge exists in the content with the same cost',
  ROUTE_EDGES.every((edge) => contentEdges.get(edge.id) === edge.cost),
)

equal('05 routing: minimum cost is 13', MINIMUM_COST, 13)
equal('05 routing: canonical route costs 13', routeCost(MINIMUM_ROUTE), 13)
check('05 routing: canonical route is optimal', isOptimalRoute(MINIMUM_ROUTE))
check('05 routing: canonical route is walkable', isWalkablePath(MINIMUM_ROUTE))
check(
  '05 routing: a suboptimal route is rejected',
  !isOptimalRoute(['S', 'A', 'M', 'P', 'D', 'E2', 'FIN'] as RouteNodeId[]),
)
check(
  '05 routing: a route that repeats nodes is rejected',
  !isOptimalRoute(['S', 'I', 'E1', 'M', 'P', 'R', 'E2', 'R', 'E2', 'FIN'] as RouteNodeId[]),
)
check(
  '05 routing: a route with a missing link is rejected',
  !isOptimalRoute(['S', 'M', 'P', 'R', 'E2', 'FIN'] as RouteNodeId[]),
)
check(
  '05 routing: a route that does not start at S is rejected',
  !isOptimalRoute(['I', 'E1', 'M', 'P', 'R', 'E2', 'FIN'] as RouteNodeId[]),
)
check(
  '05 routing: a route that does not end at FIN is rejected',
  !isOptimalRoute(['S', 'I', 'E1', 'M', 'P', 'R', 'E2'] as RouteNodeId[]),
)
equal('05 routing: sanitizeRoute drops unknown nodes', sanitizeRoute(['S', 'ZZ', 3, 'I']).join(','), 'S,I')
equal('05 routing: sanitizeRoute rejects non arrays', sanitizeRoute('S-I').length, 0)

// Brute force: enumerate every simple path from S to FIN and count the minima.
function countOptimalRoutes(from: RouteNodeId, visited: Set<RouteNodeId>, cost: number): number[] {
  if (from === END) return [cost]
  const results: number[] = []
  for (const edge of ROUTE_EDGES) {
    const next = edge.from === from ? edge.to : edge.to === from ? edge.from : null
    if (next === null || visited.has(next)) continue
    visited.add(next)
    results.push(...countOptimalRoutes(next, visited, cost + edge.cost))
    visited.delete(next)
  }
  return results
}
const allCosts = countOptimalRoutes(START, new Set([START]), 0)
const minima = allCosts.filter((cost) => cost === Math.min(...allCosts))
equal('05 routing: brute force agrees on the minimum', Math.min(...allCosts), MINIMUM_COST)
equal('05 routing: the minimum route is unique', minima.length, 1)

/* -------------------------------------------------------------------------- */
/* 5. Persisted state sanitization                                            */
/* -------------------------------------------------------------------------- */

const baseState = {
  version: 1,
  phase: 'dashboard',
  startedAt: '2026-11-06T00:00:00.000Z',
  solved: [] as string[],
  hintsUsed: {},
  keyRed: null,
  finalOrder: null,
  finalRevealed: false,
}

check('sanitize rejects null', sanitize(null) === null)
check('sanitize rejects non objects', sanitize('dashboard') === null)
check('sanitize rejects unknown versions', sanitize({ ...baseState, version: 2 }) === null)
check('sanitize rejects unknown phases', sanitize({ ...baseState, phase: 'nope' }) === null)

const prefix = sanitize({ ...baseState, solved: ['caesar', 'morse', 'binary'] })
equal('sanitize truncates solved to a contiguous prefix', prefix?.solved.join(','), 'caesar,binary')

const withRouting = sanitize({
  ...baseState,
  solved: ['caesar', 'binary', 'logic-gates', 'pattern', 'routing'],
  keyRed: null,
})
equal('sanitize re-derives the RED key from solved state', withRouting?.keyRed, 'RED')
equal('sanitize keeps the RED key absent before protocol 05', sanitize(baseState)?.keyRed, null)

const clamped = sanitize({
  ...baseState,
  hintsUsed: { caesar: 9, binary: -4, 'logic-gates': 'x', pattern: 2 },
})
equal('sanitize clamps hints above the cap', clamped?.hintsUsed.caesar, 3)
equal('sanitize clamps negative hints', clamped?.hintsUsed.binary, 0)
equal('sanitize coerces non numeric hints to zero', clamped?.hintsUsed['logic-gates'], 0)
equal('sanitize drops hints of locked protocols', clamped?.hintsUsed.pattern, 0)

const allSolved = PUZZLE_IDS
const forgedFinal = sanitize({
  ...baseState,
  solved: allSolved,
  finalOrder: [...allSolved].reverse(),
  finalRevealed: true,
  phase: 'final',
})
check('sanitize revokes a final reveal with a wrong order', forgedFinal?.finalRevealed === false)
equal('sanitize sends a forged final back to recovery', forgedFinal?.phase, 'recovery')

const partialFinal = sanitize({ ...baseState, solved: ['caesar'], finalOrder: allSolved, finalRevealed: true })
equal('sanitize ignores a final order with unsolved protocols', partialFinal?.finalOrder, null)

const earlyRecovery = sanitize({ ...baseState, solved: ['caesar'], phase: 'recovery' })
equal('sanitize blocks recovery before 8/8', earlyRecovery?.phase, 'dashboard')

const stalePuzzlePhase = sanitize({ ...baseState, solved: allSolved, phase: 'puzzle' })
equal('sanitize leaves the puzzle phase once everything is solved', stalePuzzlePhase?.phase, 'dashboard')

/* -------------------------------------------------------------------------- */
/* 6. Store actions                                                           */
/* -------------------------------------------------------------------------- */

const store = useGameStore
store.getState().reset()

check('store starts at boot', store.getState().phase === 'boot')
check('store blocks a protocol before its turn', store.getState().solve('binary', 'MILLONES') === false)
check('store rejects a wrong answer', store.getState().solve('caesar', 'HOLA') === false)
check('store accepts the current protocol', store.getState().solve('caesar', 'entre') === true)
equal('store advances the solved list', store.getState().solved.join(','), 'caesar')
check('store does not accept the same protocol twice', store.getState().solve('caesar', 'ENTRE') === false)

store.getState().solve('binary', 'MILLONES')
store.getState().solve('logic-gates', 'DE')
store.getState().solve('pattern', 'conexiones')
equal('store has no RED key before protocol 05', store.getState().keyRed, null)
check(
  'store refuses a typed answer for the route protocol',
  store.getState().solve('routing', 'SIEMPRE') === false,
)
check(
  'store refuses a suboptimal route',
  store.getState().solveRoute(['S', 'A', 'M', 'P', 'D', 'E2', 'FIN']) === false,
)
check('store accepts the optimal route', store.getState().solveRoute(MINIMUM_ROUTE) === true)
equal('store stores the RED key after protocol 05', store.getState().keyRed, 'RED')

store.getState().solve('morse', 'elegiría')
store.getState().solve('polybius', 'LA')
store.getState().setOrder(['caesar', 'binary'])
equal('store ignores an incomplete draft order', store.getState().finalOrder, null)
store.getState().setOrder([...allSolved].reverse())
check('store accepts any full permutation as a draft', store.getState().finalOrder !== null)
check('store refuses to reveal a wrong order', store.getState().confirmOrder() === false)
equal('store stays out of the final phase', store.getState().phase !== 'final', true)

store.getState().useHint('vigenere')
equal('store allows a hint on the current protocol', store.getState().hintsUsed.vigenere, 1)
store.getState().useHint('caesar')
store.getState().useHint('caesar')
store.getState().useHint('caesar')
equal('store caps hints at three', store.getState().hintsUsed.caesar, 3)

store.getState().openRecovery()
check('store refuses recovery before 8/8', store.getState().phase !== 'recovery')
store.getState().solve('vigenere', 'NUESTRA')
equal('store completes all protocols', store.getState().solved.length, 8)
store.getState().openRecovery()
check('store opens recovery at 8/8', store.getState().phase === 'recovery')

store.getState().setOrder([...allSolved])
check('store accepts a canonical order', store.getState().finalOrder !== null)
check('store reveals the final transmission', store.getState().confirmOrder() === true)
equal('store moves to the final phase', store.getState().phase, 'final')

const storage = (globalThis as unknown as { window: { localStorage: Storage } }).window.localStorage
const persistedRaw = storage.getItem(STORAGE_KEY)
const persisted = persistedRaw ? JSON.parse(persistedRaw) : null
equal('store persists the phase', persisted?.state?.phase, 'final')
equal('store persists all eight protocols', persisted?.state?.solved?.length, 8)
equal('persisted state survives a sanitize round trip', sanitize(persisted?.state)?.finalRevealed, true)

store.getState().reset()
const afterReset = storage.getItem(STORAGE_KEY)
equal('reset leaves a clean persisted state', afterReset ? sanitize(JSON.parse(afterReset).state)?.solved.length : 0, 0)
equal('reset returns to boot', store.getState().phase, 'boot')
equal('reset clears the solved list', store.getState().solved.length, 0)
equal('reset clears the RED key', store.getState().keyRed, null)

/* -------------------------------------------------------------------------- */
/* 7. Spoiler guard                                                           */
/* -------------------------------------------------------------------------- */

const normalizedMessage = normalize(MESSAGE)
check(
  'the final message never appears in a protocol body',
  PUZZLES.every((item) => !normalize(item.content).includes(normalizedMessage)),
)
check(
  'the final message never appears in the hints',
  PUZZLES.every((item) => item.hints.every((hint) => !normalize(hint).includes(normalizedMessage))),
)

const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8')
check('README does not leak the final message', !normalize(readme).includes(normalizedMessage))
check('README does not list the eight fragments in order', !readme.includes(PUZZLES.map((p) => p.fragment).join(' ')))
equal('closing message copy is present', CLOSING_MESSAGE.length > 0, true)
equal('storage key is versioned', STORAGE_KEY, 'archivo-001:state:v1')

/* -------------------------------------------------------------------------- */

console.log(`\n${total - failures}/${total} checks passed`)
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`)
  process.exit(1)
}
