/**
 * Support view for protocol 03 — LOGIC GATES.
 * It renders the literal expressions from the SDD as gate chips and keeps the
 * outputs empty: the player still has to evaluate them. No computed answers.
 */

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

const OPERATORS = new Set(['AND', 'OR', 'XOR', 'NOT'])

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

export function LogicGateBoard() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {BYTES.map((byte) => (
          <div key={byte.label} className="rounded border border-tech/20 bg-void/40 p-3">
            <p className="font-mono text-[10px] tracking-[0.22em] text-tech uppercase">
              {byte.label}
            </p>
            <ol className="mt-2 space-y-1">
              {byte.gates.map((gate, index) => (
                <li
                  key={`${byte.label}-${index}`}
                  className="flex items-center gap-2 rounded border border-tech/10 px-2 py-1"
                >
                  <span className="font-mono text-[10px] text-muted/50">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex flex-1 flex-wrap items-center gap-1 font-mono text-[11px]">
                    {gate.split(' ').map((token, tokenIndex) =>
                      OPERATORS.has(token) ? (
                        <span key={`${token}-${tokenIndex}`} className="text-warn">
                          {token}
                        </span>
                      ) : (
                        <span
                          key={`${token}-${tokenIndex}`}
                          className="rounded-sm border border-tech/30 px-1 text-tech"
                        >
                          {token}
                        </span>
                      ),
                    )}
                  </span>
                  <span
                    className="font-mono text-[11px] text-muted/40"
                    aria-label="salida por calcular"
                  >
                    ?
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

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
