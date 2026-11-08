import { useState } from 'react'
import { Button } from '../../components/Button'

interface PolybiusSquareProps {
  onUse: (value: string) => void
}

const ALPHABET = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'K'],
  ['L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z'],
]

interface Pick {
  letter: string
  row: number
  column: number
}

export function PolybiusSquare({ onUse }: PolybiusSquareProps) {
  const [picks, setPicks] = useState<Pick[]>([])

  const last = picks[picks.length - 1]
  const selection = picks.map((pick) => pick.letter).join('')

  const addPick = (letter: string, row: number, column: number) => {
    setPicks([...picks, { letter, row, column }])
  }

  return (
    <div className="rounded border border-tech/20 bg-void/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] tracking-[0.22em] text-tech uppercase">
          Matriz interactiva
        </p>
        <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
          {last ? `Coordenada ${last.row}${last.column} → ${last.letter}` : 'Selecciona una celda'}
        </p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse font-mono text-xs">
          <thead>
            <tr>
              <th className="border border-tech/10 px-2 py-1 text-muted/50" aria-hidden="true" />
              {ALPHABET[0].map((_, column) => (
                <th
                  key={`col-${column}`}
                  scope="col"
                  className="border border-tech/10 px-2 py-1 text-[10px] text-muted"
                >
                  {column + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALPHABET.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                <th
                  scope="row"
                  className="border border-tech/10 px-2 py-1 text-[10px] text-muted"
                >
                  {rowIndex + 1}
                </th>
                {row.map((letter, columnIndex) => (
                  <td key={letter} className="border border-tech/10 p-0">
                    <button
                      type="button"
                      onClick={() => addPick(letter, rowIndex + 1, columnIndex + 1)}
                      aria-label={`Letra ${letter}, fila ${rowIndex + 1}, columna ${columnIndex + 1}`}
                      className="w-full px-3 py-1.5 text-ink transition-colors hover:bg-tech/15 focus-visible:bg-tech/20"
                    >
                      {letter}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted">
          Selección: <span className="text-terminal">{selection || '—'}</span>
        </p>
        <div className="flex gap-2">
          <Button
            variant="quiet"
            onClick={() => setPicks([])}
            disabled={picks.length === 0}
            className="px-2 py-1 text-[10px]"
          >
            Limpiar
          </Button>
          <Button
            variant="ghost"
            onClick={() => onUse(selection)}
            disabled={picks.length === 0}
            className="px-2 py-1 text-[10px]"
          >
            Usar selección
          </Button>
        </div>
      </div>
    </div>
  )
}
