/**
 * Support view for protocol 03 — LOGIC GATES.
 *
 * One schematic for both bytes: the A/B/C signal bus at the top, then one row
 * per gate with its inputs, the operator block and an empty output. The player
 * still evaluates every gate, so no result is computed here.
 *
 * The raw `content` block is not rendered for this protocol: this board is the
 * single place that shows the gate list, so the information is not duplicated.
 */

const SIGNALS = { A: 1, B: 0, C: 1 } as const
type Signal = keyof typeof SIGNALS

type Operator = 'AND' | 'OR' | 'XOR'

interface Term {
  signal: Signal
  negated: boolean
}

interface Gate {
  operator: Operator
  terms: [Term, Term]
}

const BYTES = [
  {
    label: 'BYTE 1',
    gates: [
      'A AND B',
      'A XOR B',
      'B OR NOT A',
      'A AND B',
      'B OR NOT A',
      'A AND C',
      'A AND B',
      'A AND B',
    ],
  },
  {
    label: 'BYTE 2',
    gates: [
      'A AND B',
      'A XOR B',
      'B OR NOT A',
      'A AND B',
      'B OR NOT A',
      'A AND C',
      'A AND B',
      'A AND C',
    ],
  },
]

const TRUTH_TABLES = [
  {
    op: 'AND',
    header: ['A', 'B', 'OUT'],
    rows: [
      ['0', '0', '0'],
      ['0', '1', '0'],
      ['1', '0', '0'],
      ['1', '1', '1'],
    ],
  },
  {
    op: 'OR',
    header: ['A', 'B', 'OUT'],
    rows: [
      ['0', '0', '0'],
      ['0', '1', '1'],
      ['1', '0', '1'],
      ['1', '1', '1'],
    ],
  },
  {
    op: 'XOR',
    header: ['A', 'B', 'OUT'],
    rows: [
      ['0', '0', '0'],
      ['0', '1', '1'],
      ['1', '0', '1'],
      ['1', '1', '0'],
    ],
  },
  {
    op: 'NOT',
    header: ['A', 'OUT'],
    rows: [
      ['0', '1'],
      ['1', '0'],
    ],
  },
]

const parseTerm = (tokens: string[]): Term => {
  const [head, signal] = tokens
  return head === 'NOT'
    ? { signal: signal as Signal, negated: true }
    : { signal: head as Signal, negated: false }
}

const parseGate = (expression: string): Gate => {
  const tokens = expression.split(' ')
  const index = tokens.findIndex((token) => token === 'AND' || token === 'OR' || token === 'XOR')
  const operator = tokens[index] as Operator
  return {
    operator,
    terms: [parseTerm(tokens.slice(0, index)), parseTerm(tokens.slice(index + 1))],
  }
}

function TermPin({ term }: { term: Term }) {
  return (
    <span className="flex items-center gap-1 font-mono text-[11px]">
      <span aria-hidden="true" className="h-px w-2 bg-tech/40" />
      <span className="rounded-sm border border-tech/40 bg-tech/5 px-1.5 text-tech">
        {term.signal}
      </span>
      {term.negated && (
        <span className="rounded-sm border border-warn/40 bg-warn/10 px-1 text-[9px] tracking-[0.14em] text-warn uppercase">
          NOT
        </span>
      )}
    </span>
  )
}

function GateRow({ expression, bit }: { expression: string; bit: number }) {
  const gate = parseGate(expression)
  return (
    <li className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto_auto] items-center gap-2 rounded border border-tech/10 px-2 py-1.5">
      <span className="font-mono text-[10px] tracking-[0.12em] text-muted/50 uppercase">
        bit {bit}
      </span>

      <span className="flex min-w-0 flex-col gap-0.5">
        {gate.terms.map((term, index) => (
          <TermPin key={`${term.signal}-${index}`} term={term} />
        ))}
      </span>

      <span className="flex items-center gap-1 font-mono text-[11px] text-muted/40">
        <span aria-hidden="true" className="h-px w-2 bg-tech/40" />
        <span className="rounded-sm border border-warn/50 bg-warn/10 px-2 py-0.5 text-[10px] tracking-[0.14em] text-warn">
          {gate.operator}
        </span>
      </span>

      <span className="flex items-center gap-1 font-mono text-[11px] text-muted/40">
        <span aria-hidden="true" className="h-px w-2 bg-tech/40" />
        <span
          aria-label="salida por calcular"
          className="grid size-5 place-items-center rounded-sm border border-dashed border-muted/40"
        >
          ?
        </span>
      </span>
    </li>
  )
}

export function LogicGateBoard() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded border border-tech/20 bg-void/40 px-3 py-2">
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
          Bus de señales
        </span>
        {(Object.keys(SIGNALS) as Signal[]).map((signal) => (
          <span
            key={signal}
            className="rounded-sm border border-tech/40 bg-tech/5 px-1.5 font-mono text-[11px] text-tech"
          >
            {signal} = {SIGNALS[signal]}
          </span>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {BYTES.map((byte) => (
          <div key={byte.label} className="rounded border border-tech/20 bg-void/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] tracking-[0.22em] text-tech uppercase">
                {byte.label}
              </p>
              <p className="font-mono text-[10px] text-muted/60">8 bits</p>
            </div>
            <ol className="mt-2 space-y-1">
              {byte.gates.map((gate, index) => (
                <GateRow key={`${byte.label}-${index}`} expression={gate} bit={7 - index} />
              ))}
            </ol>
          </div>
        ))}
      </div>

      <p className="font-mono text-[10px] leading-relaxed text-muted/70">
        Cada fila produce un bit: la primera es el bit más significativo. Une los ocho resultados
        para formar el byte.
      </p>

      <details className="rounded border border-tech/20 bg-void/40 px-3 py-2">
        <summary className="cursor-pointer font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
          Tabla de verdad de referencia
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRUTH_TABLES.map((table) => (
            <div key={table.op}>
              <p className="font-mono text-[10px] tracking-[0.2em] text-warn uppercase">
                {table.op}
              </p>
              <table className="mt-1 w-full border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="text-muted/70">
                    {table.header.map((cell) => (
                      <th key={cell} className="border border-tech/15 px-1 py-0.5 text-left">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="text-ink/80">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${rowIndex}-${cellIndex}`}
                          className="border border-tech/15 px-1 py-0.5"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
