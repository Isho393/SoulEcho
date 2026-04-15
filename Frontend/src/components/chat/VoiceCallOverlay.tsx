import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { PhoneOff } from 'lucide-react'
import type { CallState } from '../../hooks/useVoiceCall'

interface VoiceCallOverlayProps {
  isOpen: boolean
  callState: CallState
  transcript: string
  onClose: () => void
}

const STATE_LABEL: Record<CallState, string> = {
  idle: '',
  listening: 'En écoute…',
  thinking: 'SoulEcho réfléchit…',
  speaking: 'SoulEcho parle…',
}

export default function VoiceCallOverlay({ isOpen, callState, transcript, onClose }: VoiceCallOverlayProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-deep"
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{
                opacity: callState === 'listening' ? [0.15, 0.3, 0.15] : callState === 'speaking' ? [0.2, 0.4, 0.2] : [0.1, 0.1, 0.1],
                scale: callState === 'speaking' ? [1, 1.08, 1] : [1, 1, 1],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet/20 blur-3xl"
            />
          </div>

          {/* Orb */}
          <div className="relative flex items-center justify-center mb-12">
            {/* Outer rings */}
            {callState === 'listening' && (
              <>
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border border-violet/20"
                    animate={{ scale: [1, 1.6 + i * 0.3], opacity: [0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
                    style={{ width: 120, height: 120 }}
                  />
                ))}
              </>
            )}

            {callState === 'speaking' && (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border border-violet/30"
                    animate={{ scale: [1, 1.8 + i * 0.25], opacity: [0.5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25, ease: 'easeOut' }}
                    style={{ width: 120, height: 120 }}
                  />
                ))}
              </>
            )}

            {/* Core orb */}
            <motion.div
              animate={{
                scale: callState === 'speaking' ? [1, 1.08, 1] : callState === 'thinking' ? [1, 1.03, 1] : 1,
                boxShadow: callState === 'listening'
                  ? ['0 0 40px rgba(124,58,237,0.4)', '0 0 60px rgba(124,58,237,0.6)', '0 0 40px rgba(124,58,237,0.4)']
                  : callState === 'speaking'
                  ? ['0 0 50px rgba(124,58,237,0.5)', '0 0 80px rgba(124,58,237,0.8)', '0 0 50px rgba(124,58,237,0.5)']
                  : '0 0 30px rgba(124,58,237,0.2)',
              }}
              transition={{ duration: callState === 'speaking' ? 1.2 : 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-violet to-violet-light flex items-center justify-center shadow-2xl"
            >
              <span className="text-white font-display text-5xl font-bold leading-none select-none">S</span>
            </motion.div>
          </div>

          {/* Status */}
          <motion.p
            key={callState}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-cream/60 text-sm mb-3 h-5"
          >
            {STATE_LABEL[callState]}
          </motion.p>

          {/* Live transcript */}
          <div className="h-8 flex items-center justify-center px-8 mb-16">
            <AnimatePresence mode="wait">
              {transcript && (
                <motion.p
                  key={transcript}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-cream/80 text-base text-center max-w-sm"
                >
                  {transcript}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* End call button */}
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-xl shadow-red-500/30 transition-colors"
            aria-label="Terminer l'appel"
          >
            <PhoneOff size={24} className="text-white" />
          </motion.button>

          <p className="text-cream/20 text-xs mt-4">Appuyez sur Échap pour terminer</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
