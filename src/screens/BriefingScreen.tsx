import { Button } from '../components/Button'
import { Panel } from '../components/Panel'
import { Screen } from '../components/Screen'
import { PUZZLES, TOTAL_PUZZLES } from '../data/puzzles'
import { useGameStore } from '../store/gameStore'

const RULES = [
  { code: 'RF-06', text: 'Cada protocolo tiene tres niveles de ayuda progresiva.' },
  { code: 'RF-08', text: 'El progreso se conserva si cierras o recargas la página.' },
  { code: 'RNF-07', text: 'Puedes reiniciar la investigación con confirmación.' },
]

export function BriefingScreen() {
  const enterDashboard = useGameStore((state) => state.enterDashboard)

  return (
    <Screen>
      <div className="mx-auto w-full max-w-2xl">
        <p className="label">Mission briefing</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-wide text-ink sm:text-3xl">
          LA CONEXIÓN PERDIDA
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted sm:text-base">
          La aplicación simula un sistema de comunicaciones que ha perdido una transmisión. Recupera
          los ocho fragmentos de información resolviendo un protocolo por vez.
        </p>

        <Panel className="mt-6">
          <p className="label">Protocolos detectados</p>
          <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 font-mono text-xs text-ink/80 sm:grid-cols-2">
            {PUZZLES.map((puzzle) => (
              <li key={puzzle.id} className="flex items-baseline gap-2">
                <span className="text-muted/60">{String(puzzle.order).padStart(2, '0')}</span>
                <span className="truncate">{puzzle.protocol}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
            {TOTAL_PUZZLES} protocolos · 1 investigador · 0 credenciales
          </p>
        </Panel>

        <ul className="mt-4 space-y-2">
          {RULES.map((rule) => (
            <li key={rule.code} className="flex gap-3 text-xs text-muted">
              <span className="font-mono text-tech">{rule.code}</span>
              <span>{rule.text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Button onClick={enterDashboard}>Abrir dashboard</Button>
        </div>
      </div>
    </Screen>
  )
}
