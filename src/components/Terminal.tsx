export type Tone = 'normal' | 'muted' | 'ok' | 'warn' | 'error' | 'tech'

const toneClass: Record<Tone, string> = {
  normal: 'text-ink',
  muted: 'text-muted',
  ok: 'text-terminal',
  warn: 'text-warn',
  error: 'text-error',
  tech: 'text-tech',
}

export interface TerminalLine {
  text: string
  tone?: Tone
}

interface TerminalProps {
  lines: TerminalLine[]
  step?: number
  className?: string
  cursor?: boolean
}

export function Terminal({ lines, step = 0.45, className = '', cursor = false }: TerminalProps) {
  return (
    <div
      className={`scanline rounded-md border border-tech/20 bg-[#060a12]/90 p-4 font-mono text-xs leading-relaxed sm:p-5 sm:text-sm ${className}`}
    >
      {lines.map((line, index) => (
        <div
          key={`${index}-${line.text}`}
          className={toneClass[line.tone ?? 'normal']}
          style={{
            animation: `boot-in 320ms ease-out both`,
            animationDelay: `${index * step}ms`,
            minHeight: line.text === '' ? '0.9em' : undefined,
          }}
        >
          {line.text || '\u00a0'}
        </div>
      ))}
      {cursor && (
        <span
          className="mt-1 inline-block h-3.5 w-2 bg-terminal align-middle"
          style={{ animation: 'pulse-dot 1.1s steps(1) infinite' }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
