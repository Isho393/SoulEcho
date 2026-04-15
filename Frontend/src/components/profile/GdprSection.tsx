import { useState } from 'react'
import { Download, Trash2, AlertTriangle } from 'lucide-react'

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
    try {
      await onExport()
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="border border-navy-light rounded-xl p-5">
      <h3 className="text-cream font-medium mb-1">Données personnelles (RGPD)</h3>
      <p className="text-cream/50 text-sm mb-4">
        Vous pouvez exporter ou supprimer définitivement vos données.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-navy border border-navy-light hover:border-violet text-cream px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
        >
          <Download size={16} />
          {exporting ? 'Export…' : 'Exporter mes données'}
        </button>

        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 bg-red-900/30 border border-red-800/50 hover:border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Trash2 size={16} />
          Supprimer mon compte
        </button>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-light rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-400 shrink-0" size={24} />
              <h4 className="text-cream font-semibold">Supprimer mon compte</h4>
            </div>
            <p className="text-cream/60 text-sm mb-6">
              Cette action est irréversible. Toutes vos données seront définitivement supprimées.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-navy border border-navy-light text-cream py-2 rounded-lg text-sm hover:border-cream/30 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
              >
                {deleting ? 'Suppression…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
