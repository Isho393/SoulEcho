import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboard } from '../../hooks/useDashboard'
import { toast } from 'sonner'

const SCORE_CONFIG: Record<number, { emoji: string; label: string; color: string }> = {
  1:  { emoji: '😔', label: 'Très mal',    color: '#ef4444' },
  2:  { emoji: '😟', label: 'Mal',         color: '#f97316' },
  3:  { emoji: '😕', label: 'Pas bien',    color: '#f59e0b' },
  4:  { emoji: '😐', label: 'Moyen',       color: '#eab308' },
  5:  { emoji: '🙂', label: 'Correct',     color: '#84cc16' },
  6:  { emoji: '😊', label: 'Bien',        color: '#22c55e' },
  7:  { emoji: '😄', label: 'Assez bien',  color: '#10b981' },
  8:  { emoji: '😁', label: 'Très bien',   color: '#06b6d4' },
  9:  { emoji: '🤩', label: 'Excellent',   color: '#8b5cf6' },
  10: { emoji: '✨', label: 'Parfait',     color: '#a855f7' },
}

export default function CheckinWidget() {
  const { submitCheckin } = useDashboard()
  const [score, setScore] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!score) return
    setSubmitting(true)
    try {
      await submitCheckin({ score, note: note || undefined })
      setDone(true)
      setTimeout(() => { setDone(false); setScore(null); setNote('') }, 2500)
      toast.success('Check-in enregistré ✓')
    } catch {
      toast.error('Erreur lors du check-in')
    } finally {
      setSubmitting(false)
    }
  }

  const selected = score ? SCORE_CONFIG[score] : null

  return (
    <div className="rounded-2xl border border-white/6 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(26,45,66,0.8) 0%, rgba(13,27,42,0.9) 100%)' }}>

      <div className="px-5 pt-5 pb-4">
        <p className="text-cream/60 text-xs font-medium uppercase tracking-wider mb-1">Check-in du moment</p>
        <h3 className="text-cream font-display text-lg font-semibold">Comment vous sentez-vous ?</h3>
      </div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-10 px-5"
          >
            <span className="text-5xl mb-3">🌟</span>
            <p className="text-cream/70 text-sm">Enregistré, merci !</p>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pb-5">
            {/* Score selector */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Object.entries(SCORE_CONFIG).map(([n, cfg]) => {
                const num = Number(n)
                const isSelected = score === num
                return (
                  <motion.button
                    key={n}
                    type="button"
                    onClick={() => setScore(num)}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-transparent text-white'
                        : 'border-white/6 text-cream/40 hover:border-white/15 hover:text-cream/70'
                    }`}
                    style={isSelected ? { background: cfg.color + '33', borderColor: cfg.color + '66' } : {}}
                  >
                    <span className="text-xl leading-none">{cfg.emoji}</span>
                    <span className="text-[10px] font-medium">{n}</span>
                  </motion.button>
                )
              })}
            </div>

            {/* Selected label */}
            <AnimatePresence>
              {selected && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-sm font-medium mb-4"
                  style={{ color: selected.color }}
                >
                  {selected.emoji} {selected.label}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Note */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="Une note ? (optionnel)"
              className="w-full rounded-xl px-3 py-2.5 text-cream/80 placeholder-cream/25 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet/40 mb-3 border border-white/6"
              style={{ background: 'rgba(13,27,42,0.6)' }}
            />

            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !score}
              whileTap={{ scale: 0.97 }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={score ? {
                background: `linear-gradient(135deg, ${SCORE_CONFIG[score].color}CC, ${SCORE_CONFIG[score].color}88)`,
                color: 'white',
                boxShadow: `0 4px 20px ${SCORE_CONFIG[score].color}33`,
              } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(245,240,235,0.4)' }}
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer mon état'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
