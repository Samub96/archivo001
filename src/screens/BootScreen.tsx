import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Screen } from '../components/Screen'
import { Terminal, type TerminalLine } from '../components/Terminal'
import { useGameStore } from '../store/gameStore'

const LINES: TerminalLine[] = [
  { text: 'INITIALIZING SYSTEM...' },
  { text: '' },
  { text: 'Loading communication protocols...', tone: 'muted' },
  { text: 'Checking network integrity...', tone: 'muted' },
  { text: 'Scanning available nodes...', tone: 'muted' },
  { text: '' },
  { text: 'WARNING:', tone: 'warn' },
  { text: 'TRANSMISSION NOT FOUND.', tone: 'error' },
  { text: '' },
  { text: 'SYSTEM STATUS: CRITICAL', tone: 'error' },
  { text: '' },
  { text: 'ARCHIVE 001', tone: 'tech' },
  { text: 'LA CONEXIÓN PERDIDA', tone: 'tech' },
]

const STEP_MS = 240

export function BootScreen() {
  const acknowledgeBoot = useGameStore((state) => state.acknowledgeBoot)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), LINES.length * STEP_MS + 400)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <Screen className="items-center">
      <div className="w-full max-w-2xl">
        <Terminal lines={LINES} step={STEP_MS} cursor={!ready} />

        <div className="mt-6 flex justify-center" aria-live="polite">
          {ready ? (
            <Button onClick={acknowledgeBoot}>Iniciar investigación</Button>
          ) : (
            <span className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
              initializing…
            </span>
          )}
        </div>
      </div>
    </Screen>
  )
}
