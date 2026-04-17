import { useState } from 'react'
import { Download, Trash2, AlertTriangle, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface GdprSectionProps {
  onExport: () => Promise<void>
  onDelete: () => Promise<void>
}

export default function GdprSection({ onExport, onDelete }: GdprSectionProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try { await onExport() } finally { setExporting(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete() } finally { setDeleting(false); setShowConfirm(false) }
  }

  return (
    <>
      <div className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(145deg, rgba(26,45,66,0.5) 0%, rgba(13,27,42,0.7) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
            <Shield size={15} className="text-cream/50" />
          </div>
          <div>
            <p className="text-cream/75 text-sm font-medium">Données personnelles (RGPD)</p>
            <p className="text-cream/30 text-xs">Exportez ou supprimez vos données</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-cream/65 hover:text-cream/90 transition-all disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Download size={14} />
            {exporting ? 'Export…' : 'Exporter mes données'}
          </button>

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-rose-400/80 hover:text-rose-400 transition-all"
            style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.15)' }}
          >
            <Trash2 size={14} />
            Supprimer mon compte
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              style={{ background: 'rgba(17,31,48,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center mb-4">
                <AlertTriangle className="text-rose-400" size={22} />
              </div>
              <h4 className="text-cream font-semibold text-lg mb-2">Supprimer mon compte</h4>
              <p className="text-cream/50 text-sm mb-6 leading-relaxed">
                Cette action est irréversible. Toutes vos conversations, données et préférences seront définitivement supprimées.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-cream/60 hover:text-cream/85 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #e11d48, #f43f5e)' }}
                >
                  {deleting ? 'Suppression…' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
