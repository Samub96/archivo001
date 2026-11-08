const MORSE: [string, string][] = [
  ['A', '.-'],
  ['B', '-...'],
  ['C', '-.-.'],
  ['D', '-..'],
  ['E', '.'],
  ['F', '..-.'],
  ['G', '--.'],
  ['H', '....'],
  ['I', '..'],
  ['J', '.---'],
  ['K', '-.-'],
  ['L', '.-..'],
  ['M', '--'],
  ['N', '-.'],
  ['O', '---'],
  ['P', '.--.'],
  ['Q', '--.-'],
  ['R', '.-.'],
  ['S', '...'],
  ['T', '-'],
  ['U', '..-'],
  ['V', '...-'],
  ['W', '.--'],
  ['X', '-..-'],
  ['Y', '-.--'],
  ['Z', '--..'],
]

export function MorseReference() {
  return (
    <details className="rounded border border-tech/20 bg-void/40 px-3 py-2">
      <summary className="cursor-pointer font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
        Tabla Morse de consulta
      </summary>
      <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-1 font-mono text-[11px] sm:grid-cols-5 lg:grid-cols-7">
        {MORSE.map(([letter, code]) => (
          <div key={letter} className="flex items-baseline justify-between gap-2">
            <dt className="text-tech">{letter}</dt>
            <dd className="text-muted">{code}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
