/**
 * Network topology for protocol 05 — NETWORK ROUTING.
 * Edges and costs are literal from SOFTWARE DESIGN DOCUMENT §6.
 * The graph is treated as undirected: the SDD fixes the costs, not a direction
 * constraint for the player, and the unique minimum route is the same either way.
 */

export type RouteNodeId = 'S' | 'I' | 'E1' | 'M' | 'P' | 'R' | 'E2' | 'FIN' | 'A' | 'B' | 'C' | 'D'

export interface RouteNode {
  id: RouteNodeId
  x: number
  y: number
  /** Marked in red in the SDD; the three initials build the key RED. */
  red?: 1 | 2 | 3
}

export interface RouteEdge {
  id: string
  from: RouteNodeId
  to: RouteNodeId
  cost: number
}

export const START: RouteNodeId = 'S'
export const END: RouteNodeId = 'FIN'

export const ROUTE_NODES: RouteNode[] = [
  { id: 'S', x: 60, y: 200 },
  { id: 'I', x: 155, y: 200 },
  { id: 'E1', x: 250, y: 200 },
  { id: 'M', x: 345, y: 200 },
  { id: 'P', x: 440, y: 200 },
  { id: 'R', x: 535, y: 200, red: 1 },
  { id: 'E2', x: 630, y: 200, red: 2 },
  { id: 'FIN', x: 715, y: 200 },
  { id: 'A', x: 180, y: 95 },
  { id: 'B', x: 320, y: 315 },
  { id: 'C', x: 390, y: 95 },
  { id: 'D', x: 520, y: 315, red: 3 },
]

const edge = (from: RouteNodeId, to: RouteNodeId, cost: number): RouteEdge => ({
  id: [from, to].sort().join('-'),
  from,
  to,
  cost,
})

export const ROUTE_EDGES: RouteEdge[] = [
  edge('S', 'I', 2),
  edge('I', 'E1', 2),
  edge('E1', 'M', 2),
  edge('M', 'P', 2),
  edge('P', 'R', 2),
  edge('R', 'E2', 2),
  edge('E2', 'FIN', 1),
  edge('S', 'A', 1),
  edge('A', 'M', 8),
  edge('I', 'B', 1),
  edge('B', 'P', 8),
  edge('E1', 'C', 1),
  edge('C', 'R', 8),
  edge('P', 'D', 1),
  edge('D', 'E2', 8),
]

export const NODE_BY_ID = new Map<RouteNodeId, RouteNode>(ROUTE_NODES.map((node) => [node.id, node]))

const EDGE_BY_PAIR = new Map<string, RouteEdge>(ROUTE_EDGES.map((item) => [item.id, item]))

const pairKey = (a: RouteNodeId, b: RouteNodeId) => [a, b].sort().join('-')

export const edgeBetween = (a: RouteNodeId, b: RouteNodeId): RouteEdge | undefined =>
  EDGE_BY_PAIR.get(pairKey(a, b))

export const neighborsOf = (node: RouteNodeId): RouteNode[] =>
  ROUTE_EDGES.flatMap((item) => {
    if (item.from === node) return [NODE_BY_ID.get(item.to)!]
    if (item.to === node) return [NODE_BY_ID.get(item.from)!]
    return []
  })

/** Total cost of a walked route, or null if two consecutive nodes are not linked. */
export function routeCost(path: RouteNodeId[]): number | null {
  if (path.length < 2) return null
  let total = 0
  for (let index = 1; index < path.length; index += 1) {
    const link = edgeBetween(path[index - 1], path[index])
    if (!link) return null
    total += link.cost
  }
  return total
}

export function isWalkablePath(path: RouteNodeId[]): boolean {
  if (path.length < 2) return false
  if (new Set(path).size !== path.length) return false
  return routeCost(path) !== null
}

/** Dijkstra from S to FIN. Computed once; the SDD expects a total cost of 13. */
function dijkstraCost(from: RouteNodeId, to: RouteNodeId): number {
  const distance = new Map<RouteNodeId, number>(ROUTE_NODES.map((node) => [node.id, Infinity]))
  const visited = new Set<RouteNodeId>()
  distance.set(from, 0)

  while (visited.size < ROUTE_NODES.length) {
    let current: RouteNodeId | null = null
    let best = Infinity
    for (const [id, value] of distance) {
      if (!visited.has(id) && value < best) {
        best = value
        current = id
      }
    }
    if (current === null || best === Infinity) break
    if (current === to) return best
    visited.add(current)

    for (const neighbor of neighborsOf(current)) {
      if (visited.has(neighbor.id)) continue
      const link = edgeBetween(current, neighbor.id)
      if (!link) continue
      const candidate = best + link.cost
      if (candidate < (distance.get(neighbor.id) ?? Infinity)) {
        distance.set(neighbor.id, candidate)
      }
    }
  }

  return distance.get(to) ?? Infinity
}

export const MINIMUM_COST = dijkstraCost(START, END)

/** The canonical route, kept for tests and for the hint-free validation message. */
export const MINIMUM_ROUTE: RouteNodeId[] = ['S', 'I', 'E1', 'M', 'P', 'R', 'E2', 'FIN']

/**
 * A route only counts when it starts at S, ends at FIN, never repeats a node,
 * walks existing links, and its accumulated cost equals the shortest one.
 */
export function isOptimalRoute(path: RouteNodeId[]): boolean {
  if (path[0] !== START || path[path.length - 1] !== END) return false
  if (!isWalkablePath(path)) return false
  return routeCost(path) === MINIMUM_COST
}

export const isRouteNodeId = (value: string): value is RouteNodeId =>
  ROUTE_NODES.some((node) => node.id === value)

export const sanitizeRoute = (raw: unknown): RouteNodeId[] => {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is RouteNodeId => typeof item === 'string' && isRouteNodeId(item))
}
