import { StatusBar } from './components/StatusBar'
import { AccessScreen } from './screens/AccessScreen'
import { BootScreen } from './screens/BootScreen'
import { BriefingScreen } from './screens/BriefingScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { DataRecoveryScreen } from './screens/DataRecoveryScreen'
import { FinalTransmissionScreen } from './screens/FinalTransmissionScreen'
import { PuzzleScreen } from './screens/PuzzleScreen'
import { useGameStore } from './store/gameStore'
import type { Phase } from './types'

const VIEWS: Record<Phase, () => React.JSX.Element> = {
  boot: BootScreen,
  access: AccessScreen,
  briefing: BriefingScreen,
  dashboard: DashboardScreen,
  puzzle: PuzzleScreen,
  recovery: DataRecoveryScreen,
  final: FinalTransmissionScreen,
}

export default function App() {
  const phase = useGameStore((state) => state.phase)
  const persistenceAvailable = useGameStore((state) => state.persistenceAvailable)
  const View = VIEWS[phase]

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="grid-backdrop" aria-hidden="true" />
      {phase !== 'boot' && <StatusBar />}
      {!persistenceAvailable && (
        <p
          role="status"
          className="relative z-10 border-b border-warn/30 bg-warn/10 px-4 py-2 text-center font-mono text-[10px] tracking-[0.18em] text-warn uppercase"
        >
          LocalStorage no disponible: la partida no se guardará
        </p>
      )}
      <View />
    </div>
  )
}
