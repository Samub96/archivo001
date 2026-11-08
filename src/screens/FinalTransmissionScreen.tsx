import { useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Screen } from '../components/Screen'
import { Terminal } from '../components/Terminal'
import { CLOSING_MESSAGE, MESSAGE } from '../data/config'
import { useGameStore } from '../store/gameStore'

const HEADER_LINES = [
  { text: 'TRANSMISSION RESTORED', tone: 'ok' as const },
  { text: '' },
  { text: 'CONNECTION STATUS: ONLINE', tone: 'tech' as const },
  { text: 'ALL FRAGMENTS VERIFIED.', tone: 'muted' as const },
]

const WORDS = MESSAGE.split(' ')

export function FinalTransmissionScreen() {
  const finalRevealed = useGameStore((state) => state.finalRevealed)
  const enterDashboard = useGameStore((state) => state.enterDashboard)
  const reset = useGameStore((state) => state.reset)
  const [confirmReset, setConfirmReset] = useState(false)

  if (!finalRevealed) {
    return (
      <Screen className="items-center">
        <div className="panel w-full max-w-md p-5 text-center">
          <p className="label">Final transmission</p>
          <p className="mt-3 text-sm text-warn">La transmisión todavía no está restaurada.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="quiet" onClick={enterDashboard}>
              Volver al dashboard
            </Button>
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen className="items-center">
      <div className="w-full max-w-2xl">
        <Terminal lines={HEADER_LINES} step={220} />

        <div className="mt-6 border-y border-terminal/25 py-6 text-center">
          <p className="font-display text-lg leading-relaxed font-medium text-ink sm:text-2xl">
            {WORDS.map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                initial={{ opacity: 0, filter: 'blur(6px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.16 }}
                className="inline-block"
              >
                {word}
                {index < WORDS.length - 1 ? '\u00a0' : ''}
              </motion.span>
            ))}
          </p>
        </div>

        <div className="mt-6 space-y-1 text-center font-mono text-[11px] leading-relaxed text-muted sm:text-xs">
          {CLOSING_MESSAGE.map((line, index) => (
            <motion.p
              key={`${line}-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.6 + index * 0.35 }}
            >
              {line || '\u00a0'}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 5.2 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <p className="font-mono text-[10px] tracking-[0.28em] text-muted/70 uppercase">
            End of archive 001
          </p>
          <Button variant="quiet" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reiniciar partida
          </Button>
        </motion.div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reiniciar la investigación"
        confirmLabel="Reiniciar"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          reset()
        }}
      >
        Se borrarán el progreso, los fragmentos y las pistas consumidas. Esta acción no se puede
        deshacer.
      </ConfirmDialog>
    </Screen>
  )
}
