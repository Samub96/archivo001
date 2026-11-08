import { KeyRound } from 'lucide-react'
import { useGameStore } from '../../store/gameStore'

/**
 * Protocol 08 support: the SDD §6 interaction asks to show the three recovered
 * red nodes and build the RED key from them. The key itself is persisted by the
 * store when protocol 05 is solved; this panel never re-derives a different one.
 */
const RECOVERED = [
  { id: 'R', position: 1 },
  { id: 'E2', position: 2 },
  { id: 'D', position: 3 },
] as const

export function RedKeyPanel() {
  const keyRed = useGameStore((state) => state.keyRed)
  const ready = keyRed !== null

  return (
    <div className="rounded border border-error/25 bg-error/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] tracking-[0.22em] text-error uppercase">
          Nodos recuperados
        </p>
        <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
          Topología · protocolo 05
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {RECOVERED.map((node) => (
          <div
            key={node.id}
            className="flex items-center gap-2 rounded border border-error/40 bg-void/50 px-2.5 py-1.5"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-error font-mono text-[10px] text-void">
              {node.position}
            </span>
            <span className="font-mono text-sm text-error">{node.id}</span>
          </div>
        ))}

        <span className="font-mono text-xs text-muted" aria-hidden="true">
          →
        </span>

        <div className="flex items-center gap-2 rounded border border-terminal/40 bg-terminal/10 px-2.5 py-1.5">
          <KeyRound className="size-3.5 text-terminal" aria-hidden="true" />
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">Clave</span>
          <span className="font-mono text-sm tracking-[0.2em] text-terminal">
            {ready ? keyRed : '—'}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        {ready
          ? 'Las iniciales de los tres nodos, en el orden en que fueron marcados, forman la clave. Úsala para descifrar la última transmisión.'
          : 'La topología todavía no fue resuelta: la clave sigue bloqueada.'}
      </p>
    </div>
  )
}
