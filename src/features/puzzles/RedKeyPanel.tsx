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

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** Tabula recta: cell(row=key, column=plain) = cipher letter. */
const VIGENERE_TABLE = ALPHABET.map((_, rowIndex) =>
  ALPHABET.map((_, columnIndex) => ALPHABET[(rowIndex + columnIndex) % ALPHABET.length]),
)

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

      <details className="mt-3 rounded border border-tech/20 bg-void/40 px-3 py-2">
        <summary className="cursor-pointer font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
          Tabla de Vigenère de referencia
        </summary>

        <p className="mt-2 text-xs text-muted">
          Fila = letra de la clave, columna = letra del mensaje original. Para descifrar, busca la
          letra cifrada dentro de la fila de la clave y lee el encabezado de la columna.
        </p>

        <div className="mt-2 overflow-x-auto">
          <table className="border-collapse font-mono text-[10px]">
            <caption className="sr-only">
              Tabula recta de Vigenère: fila de la clave, columna del mensaje original
            </caption>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-panel px-1 py-0.5 text-muted/60">·</th>
                {ALPHABET.map((letter) => (
                  <th key={letter} className="border border-tech/15 px-1 py-0.5 text-muted/70">
                    {letter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VIGENERE_TABLE.map((row, rowIndex) => {
                const rowLetter = ALPHABET[rowIndex]
                const keyed = ready && keyRed.toUpperCase().includes(rowLetter)
                return (
                  <tr key={rowLetter}>
                    <th
                      className={`sticky left-0 z-10 border border-tech/15 bg-panel px-1 py-0.5 text-left ${
                        keyed ? 'text-terminal' : 'text-muted/70'
                      }`}
                    >
                      {rowLetter}
                    </th>
                    {row.map((cell, columnIndex) => (
                      <td
                        key={`${rowIndex}-${columnIndex}`}
                        className={`border border-tech/15 px-1 py-0.5 text-center ${
                          keyed ? 'bg-terminal/5 text-ink/80' : 'text-ink/60'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {ready && (
          <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-terminal uppercase">
            Filas resaltadas: letras de la clave {keyRed}
          </p>
        )}
      </details>
    </div>
  )
}
