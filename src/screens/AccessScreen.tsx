import { Button } from '../components/Button'
import { Panel } from '../components/Panel'
import { Screen } from '../components/Screen'
import { useGameStore } from '../store/gameStore'

export function AccessScreen() {
  const acceptMission = useGameStore((state) => state.acceptMission)

  return (
    <Screen className="items-center">
      <Panel className="w-full max-w-xl">
        <p className="label">ACCESS GRANTED</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-wide text-terminal sm:text-3xl">
          ACCESO AUTORIZADO
        </h1>

        <div className="mt-5 space-y-3 text-sm leading-relaxed text-ink/90 sm:text-base">
          <p>Se ha detectado una anomalía en el sistema de comunicaciones.</p>
          <p>Ocho protocolos contienen información fragmentada.</p>
          <p>Se requiere un investigador para recuperar la transmisión.</p>
        </div>

        <p className="mt-6 font-mono text-xs tracking-[0.18em] text-tech uppercase">¿Desea continuar?</p>

        <div className="mt-4">
          <Button onClick={acceptMission}>Aceptar misión</Button>
        </div>
      </Panel>
    </Screen>
  )
}
