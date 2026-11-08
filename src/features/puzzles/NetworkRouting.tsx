import { useMemo, useState } from 'react'
import { Check, RotateCcw, Undo2 } from 'lucide-react'
import { Button } from '../../components/Button'
import { Panel } from '../../components/Panel'
import {
  END,
  NODE_BY_ID,
  ROUTE_EDGES,
  ROUTE_NODES,
  START,
  edgeBetween,
  isOptimalRoute,
  routeCost,
  type RouteNodeId,
} from '../../lib/routing'
import { useGameStore } from '../../store/gameStore'

interface NetworkRoutingProps {
  solved: boolean
  onSolved: () => void
}

export function NetworkRouting({ solved, onSolved }: NetworkRoutingProps) {
  const solveRoute = useGameStore((state) => state.solveRoute)
  const [path, setPath] = useState<RouteNodeId[]>([START])
  const [error, setError] = useState<string | null>(null)

  const last = path[path.length - 1]
  const cost = routeCost(path)
  const complete = last === END

  const selectedEdges = useMemo(() => {
    const ids = new Set<string>()
    for (let index = 1; index < path.length; index += 1) {
      const link = edgeBetween(path[index - 1], path[index])
      if (link) ids.add(link.id)
    }
    return ids
  }, [path])

  const reset = () => {
    setPath([START])
    setError(null)
  }

  const undo = () => {
    if (path.length === 1) return
    setPath(path.slice(0, -1))
    setError(null)
  }

  const pickEdge = (from: RouteNodeId, to: RouteNodeId) => {
    if (solved) return

    // Clicking the last walk step removes it, so the route is editable.
    if (path.length >= 2) {
      const previous = path[path.length - 2]
      const lastStep = (previous === from && last === to) || (previous === to && last === from)
      if (lastStep) {
        undo()
        return
      }
    }

    if (last === END) {
      setError('La ruta ya termina en FIN. Deshaz el último tramo para cambiarla.')
      return
    }

    const next = from === last ? to : to === last ? from : null
    if (!next) {
      setError('Ese enlace no está conectado al final de la ruta actual.')
      return
    }
    if (path.includes(next)) {
      setError('La ruta no puede repetir nodos.')
      return
    }

    setPath([...path, next])
    setError(null)
  }

  const confirm = () => {
    if (solved) return
    if (!complete) {
      setError('La ruta todavía no llega a FIN.')
      return
    }
    if (!isOptimalRoute(path)) {
      setError(`Ruta válida con costo ${cost ?? '—'}. Existe una ruta de menor costo.`)
      return
    }
    if (!solveRoute(path)) {
      setError('No se pudo registrar la ruta. Revisa el orden de los protocolos.')
      return
    }
    onSolved()
  }

  return (
    <div className="space-y-3">
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="label">Topology</p>
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
            Enlaces no dirigidos · costo entre paréntesis
          </p>
        </div>

        <div className="mt-3 overflow-x-auto">
          <svg
            viewBox="0 0 760 400"
            className="h-auto w-full min-w-[620px]"
            role="group"
            aria-label="Grafo de la red con nodos y enlaces seleccionables"
          >
            <g>
              {ROUTE_EDGES.map((link) => {
                const a = NODE_BY_ID.get(link.from)
                const b = NODE_BY_ID.get(link.to)
                if (!a || !b) return null

                const selected = selectedEdges.has(link.id)
                const available =
                  !solved &&
                  !selected &&
                  last !== END &&
                  (link.from === last || link.to === last)

                const stroke = selected
                  ? '#00e5a0'
                  : available
                    ? '#38bdf8'
                    : '#38bdf8'
                const opacity = selected ? 1 : available ? 0.75 : 0.18
                const width = selected ? 4 : available ? 3 : 2

                const midX = (a.x + b.x) / 2
                const midY = (a.y + b.y) / 2
                const dx = b.x - a.x
                const dy = b.y - a.y
                const length = Math.hypot(dx, dy) || 1
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI
                const labelX = midX - (dy / length) * 14
                const labelY = midY + (dx / length) * 14

                return (
                  <g key={link.id}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={stroke}
                      strokeWidth={width}
                      opacity={opacity}
                      strokeLinecap="round"
                    />
                    <rect
                      x={midX - length / 2}
                      y={midY - 12}
                      width={length}
                      height={24}
                      transform={`rotate(${angle} ${midX} ${midY})`}
                      fill="transparent"
                      role="button"
                      tabIndex={solved ? -1 : 0}
                      aria-label={`Enlace ${link.from} a ${link.to}, costo ${link.cost}`}
                      aria-pressed={selected}
                      className="cursor-pointer outline-none focus-visible:fill-terminal/20"
                      onClick={() => pickEdge(link.from, link.to)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          pickEdge(link.from, link.to)
                        }
                      }}
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={11}
                      fontFamily="JetBrains Mono, monospace"
                      fill={selected ? '#00e5a0' : available ? '#38bdf8' : '#94a3b8'}
                      opacity={selected || available ? 1 : 0.55}
                      stroke="#060a12"
                      strokeWidth={5}
                      paintOrder="stroke"
                      pointerEvents="none"
                    >
                      {link.cost}
                    </text>
                  </g>
                )
              })}
            </g>

            <g>
              {ROUTE_NODES.map((node) => {
                const inPath = path.includes(node.id)
                const isHead = node.id === last
                const isEnd = node.id === END

                const stroke = node.red
                  ? '#ef4444'
                  : inPath
                    ? '#00e5a0'
                    : isEnd
                      ? '#facc15'
                      : '#38bdf8'
                const fill = inPath ? 'rgba(0,229,160,0.16)' : '#111827'

                return (
                  <g key={node.id}>
                    {isHead && !solved && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={25}
                        fill="none"
                        stroke="#00e5a0"
                        strokeWidth={1}
                        opacity={0.55}
                        style={{ animation: 'pulse-dot 1.6s ease-in-out infinite' }}
                      />
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={20}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={node.red ? 2 : inPath ? 2.5 : 1.5}
                      opacity={node.red || inPath || isEnd ? 1 : 0.8}
                    />
                    <text
                      x={node.x}
                      y={node.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={node.id.length > 2 ? 10 : 12}
                      fontFamily="JetBrains Mono, monospace"
                      fill={node.red ? '#ef4444' : inPath ? '#00e5a0' : '#e5e7eb'}
                      pointerEvents="none"
                    >
                      {node.id}
                    </text>
                    {node.red && (
                      <g>
                        <circle cx={node.x + 15} cy={node.y - 15} r={8} fill="#ef4444" />
                        <text
                          x={node.x + 15}
                          y={node.y - 15}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={9}
                          fontFamily="JetBrains Mono, monospace"
                          fill="#080d16"
                          pointerEvents="none"
                        >
                          {node.red}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>
        </div>
        <p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-muted/70 uppercase sm:hidden">
          Desliza el grafo para explorar todos los nodos
        </p>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label">Current route</p>
            <p
              className="mt-1 font-mono text-xs tracking-[0.1em] text-ink/90"
              aria-live="polite"
            >
              {path.join(' → ')}
            </p>
          </div>
          <div className="text-right">
            <p className="label">Accumulated cost</p>
            <p className="mt-1 font-mono text-lg text-tech">{cost ?? '—'}</p>
          </div>
        </div>

        <div className="mt-3 min-h-5" aria-live="polite">
          {error ? (
            <p className="font-mono text-[11px] tracking-[0.14em] text-error uppercase">{error}</p>
          ) : complete ? (
            <p className="font-mono text-[11px] tracking-[0.14em] text-tech uppercase">
              Ruta completa. Confirma para validarla.
            </p>
          ) : (
            <p className="text-xs text-muted">
              Selecciona enlaces consecutivos desde S hasta FIN. Vuelve a pulsar el último tramo
              para deshacerlo.
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={confirm} disabled={solved || !complete}>
            <Check className="size-3.5" aria-hidden="true" />
            Confirmar ruta
          </Button>
          <Button variant="quiet" onClick={undo} disabled={solved || path.length === 1}>
            <Undo2 className="size-3.5" aria-hidden="true" />
            Deshacer
          </Button>
          <Button variant="quiet" onClick={reset} disabled={solved || path.length === 1}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reiniciar
          </Button>
        </div>
      </Panel>
    </div>
  )
}
