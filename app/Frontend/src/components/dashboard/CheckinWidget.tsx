import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDashboard } from '../../hooks/useDashboard'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

const SCORE_CONFIG: Record<number, { emoji: string; label: string; color: string; bg: string }> = {
  1:  { emoji: '😔', label: 'Très mal',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  2:  { emoji: '😟', label: 'Mal',        color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  3:  { emoji: '😕', label: 'Pas bien',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  4:  { emoji: '😐', label: 'Moyen',      color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  5:  { emoji: '🙂', label: 'Correct',    color: '#84cc16', bg: 'rgba(132,204,22,0.12)' },
  6:  { emoji: '😊', label: 'Bien',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  7:  { emoji: '😄', label: 'Assez bien', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  8:  { emoji: '😁', label: 'Très bien',  color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  9:  { emoji: '🤩', label: 'Excellent',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  10: { emoji: '✨', label: 'Parfait',    color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
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
      setTimeout(() => { setDone(false); setScore(null); setNote('') }, 3000)
      toast.success('Check-in enregistré ✓')
    } catch {
      toast.error('Erreur lors du check-in')
    } finally {
      setSubmitting(false)
    }
  }

  const selected = score ? SCORE_CONFIG[score] : null

  return (
    <div className="rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(145deg, rgba(26,45,66,0.75) 0%, rgba(13,27,42,0.9) 100%)',
        border: selected ? `1px solid ${selected.color}30` : '1px solid rgba(255,255,255,0.07)',
        transition: 'border-color 0.4s ease',
      }}
    >
      {/* Ambient color glow based on score */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={score}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: selected.color, opacity: 0.06, transform: 'translate(30%, -30%)' }}
          />
        )}
      </AnimatePresence>

      <div className="px-5 pt-5 pb-4 relative z-10">
        <p className="text-cream/35 text-xs font-medium uppercase tracking-widest mb-1">Check-in du moment</p>
        <h3 className="text-cream font-display text-xl font-semibold">Comment vous sentez-vous ?</h3>
      </div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex flex-col items-center justify-center py-12 px-5 relative z-10"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-6xl mb-4"
            >
              🌟
            </motion.div>
            <p className="text-cream/80 font-medium text-base mb-1">Enregistré, merci !</p>
            <p className="text-cream/35 text-sm">Votre état a été sauvegardé.</p>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pb-5 relative z-10">
            {/* Score grid */}
            <div className="grid grid-cols-5 gap-2 mb-5">
              {Object.entries(SCORE_CONFIG).map(([n, cfg]) => {
                const num = Number(n)
                const isSelected = score === num
                const isPast = score !== null && num < score
                return (
                  <motion.button
                    key={n}
                    type="button"
                    onClick={() => setScore(num)}
                    whileTap={{ scale: 0.88 }}
                    whileHover={{ scale: 1.08, y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all relative overflow-hidden"
                    style={{
                      background: isSelected ? cfg.bg : isPast ? `${cfg.color}08` : 'rgba(255,255,255,0.03)',
                      border: isSelected ? `1px solid ${cfg.color}50` : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: isSelected ? `0 4px 20px ${cfg.color}25` : 'none',
                    }}
                  >
                    <motion.span
                      animate={isSelected ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className="text-2xl leading-none"
                    >
                      {cfg.emoji}
                    </motion.span>
                    <span className="text-[10px] font-semibold" style={{ color: isSelected ? cfg.color : 'rgba(245,240,235,0.35)' }}>
                      {n}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Selected label with color bar */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                    style={{ background: selected.bg, border: `1px solid ${selected.color}25` }}>
                    <span className="text-xl">{selected.emoji}</span>
                    <span className="text-sm font-semibold" style={{ color: selected.color }}>{selected.label}</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden ml-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(score! / 10) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: selected.color }}
                      />
                    </div>
                    <span className="text-xs font-bold" style={{ color: selected.color }}>{score}/10</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Note textarea */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="Une note ? (optionnel)"
              className="w-full rounded-xl px-4 py-3 text-cream/80 placeholder-cream/20 text-sm resize-none focus:outline-none transition-all mb-3 input-glow"
              style={{ background: 'rgba(8,17,26,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = selected ? `${selected.color}40` : 'rgba(124,58,237,0.4)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
            />

            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !score}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={score ? {
                background: `linear-gradient(135deg, ${SCORE_CONFIG[score].color}DD, ${SCORE_CONFIG[score].color}99)`,
                color: 'white',
                boxShadow: `0 6px 24px ${SCORE_CONFIG[score].color}30`,
              } : {
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(245,240,235,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles size={14} />
                  Enregistrer mon état
                </span>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
