import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { PhoneOff, Mic, Volume2, Brain } from 'lucide-react'
import type { CallState } from '../../hooks/useVoiceCall'

interface VoiceCallOverlayProps {
  isOpen: boolean
  callState: CallState
  transcript: string
  onClose: () => void
}

const STATE_CONFIG: Record<CallState, { label: string; icon: React.ElementType | null; color: string }> = {
  idle:      { label: '',                    icon: null,     color: '#7C3AED' },
  listening: { label: 'En écoute…',          icon: Mic,      color: '#9D5CF6' },
  thinking:  { label: 'SoulEcho réfléchit…', icon: Brain,    color: '#06b6d4' },
  speaking:  { label: 'SoulEcho parle…',     icon: Volume2,  color: '#10b981' },
}

// Waveform bars for speaking state
function Waveform({ active }: { active: boolean }) {
  const bars = [3, 6, 9, 5, 8, 4, 7, 10, 6, 4, 8, 5, 9, 3, 7]
  return (
    <div className="flex items-center gap-[3px] h-10">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{ background: 'rgba(157,92,246,0.7)' }}
          animate={active ? {
            height: [`${h * 2}px`, `${h * 4}px`, `${h * 2}px`],
            opacity: [0.5, 1, 0.5],
          } : { height: '4px', opacity: 0.2 }}
          transition={{
            duration: 0.6 + (i % 4) * 0.15,
            repeat: Infinity,
            delay: i * 0.05,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Timer hook
function useCallTimer(isOpen: boolean) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!isOpen) { setSeconds(0); return }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [isOpen])
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function VoiceCallOverlay({ isOpen, callState, transcript, onClose }: VoiceCallOverlayProps) {
  const timer = useCallTimer(isOpen)
  const config = STATE_CONFIG[callState]

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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#06090e' }}
        >
          {/* Multi-layer ambient */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{
                opacity: callState === 'speaking' ? [0.12, 0.22, 0.12] : [0.06, 0.12, 0.06],
                scale: callState === 'speaking' ? [1, 1.1, 1] : [1, 1.04, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
              style={{ background: config.color }}
            />
            <motion.div
              animate={{ opacity: [0.04, 0.08, 0.04] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full blur-3xl"
              style={{ background: '#7C3AED' }}
            />
          </div>

          {/* Top bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-8 flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" style={{ background: '#10b981' }} />
            <span className="text-cream/50 text-sm font-mono tracking-wider">{timer}</span>
          </motion.div>

          {/* Orb area */}
          <div className="relative flex items-center justify-center mb-10">
            {/* Ripple rings */}
            {(callState === 'listening' || callState === 'speaking') && (
              <>
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: 140,
                      height: 140,
                      border: `1px solid ${config.color}`,
                    }}
                    animate={{ scale: [1, 2.2 + i * 0.4], opacity: [0.35, 0] }}
                    transition={{
                      duration: callState === 'speaking' ? 1.2 : 2,
                      repeat: Infinity,
                      delay: i * (callState === 'speaking' ? 0.3 : 0.5),
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </>
            )}

            {/* Core orb */}
            <motion.div
              animate={{
                scale: callState === 'speaking'
                  ? [1, 1.07, 0.98, 1.05, 1]
                  : callState === 'thinking'
                  ? [1, 1.03, 1]
                  : 1,
                boxShadow: [
                  `0 0 40px ${config.color}40`,
                  `0 0 70px ${config.color}70`,
                  `0 0 40px ${config.color}40`,
                ],
              }}
              transition={{
                duration: callState === 'speaking' ? 1.5 : 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative w-32 h-32 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, #7C3AED, ${config.color})` }}
            >
              {/* Inner shine */}
              <div className="absolute inset-0 rounded-full"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
              <span className="relative text-white font-display text-5xl font-bold leading-none select-none">S</span>
            </motion.div>
          </div>

          {/* State indicator */}
          <motion.div
            key={callState}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 mb-6"
          >
            {config.icon && (
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <config.icon size={16} style={{ color: config.color }} />
              </motion.div>
            )}
            <span className="text-cream/60 text-sm">{config.label}</span>
          </motion.div>

          {/* Waveform (speaking) or thinking dots */}
          <div className="h-12 flex items-center justify-center mb-4">
            {callState === 'speaking' && <Waveform active />}
            {callState === 'thinking' && (
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: config.color }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            )}
            {callState === 'listening' && (
              <motion.div
                className="w-3 h-3 rounded-full"
                style={{ background: config.color }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
          </div>

          {/* Live transcript */}
          <div className="min-h-[40px] flex items-center justify-center px-10 mb-14 max-w-md w-full">
            <AnimatePresence mode="wait">
              {transcript && (
                <motion.div
                  key={transcript}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="px-5 py-3 rounded-2xl text-center"
                  style={{
                    background: 'rgba(26,45,66,0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <p className="text-cream/80 text-sm leading-relaxed">{transcript}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* End call button */}
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            className="relative w-16 h-16 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'linear-gradient(135deg, #e11d48, #f43f5e)', boxShadow: '0 8px 32px rgba(244,63,94,0.4)' }}
            aria-label="Terminer l'appel"
          >
            <PhoneOff size={22} className="text-white" />
          </motion.button>

          <p className="text-cream/18 text-xs mt-4 select-none">Échap pour terminer</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
