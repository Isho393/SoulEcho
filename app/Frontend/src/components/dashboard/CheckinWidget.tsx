import { useState } from 'react'
import { z } from 'zod'
import { useDashboard } from '../../hooks/useDashboard'
import { toast } from 'sonner'

const checkinSchema = z.object({
  score: z.number().int().min(1).max(10),
  note: z.string().max(200).optional(),
})

export default function CheckinWidget() {
  const { submitCheckin } = useDashboard()
  const [score, setScore] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (score === null) {
      setError('Veuillez sélectionner un score.')
      return
    }

    const result = checkinSchema.safeParse({ score, note: note || undefined })
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? 'Données invalides.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      await submitCheckin(result.data)
      toast.success('Check-in enregistré')
      setScore(null)
      setNote('')
    } catch {
      toast.error('Erreur lors du check-in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-navy-light rounded-xl p-4">
      <h3 className="text-cream/70 text-sm font-medium mb-4">Comment vous sentez-vous ?</h3>

      <div className="flex gap-2 flex-wrap mb-4">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
              score === n
                ? 'bg-violet text-white scale-110'
                : 'bg-navy text-cream/60 hover:bg-navy-light hover:text-cream'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={200}
        rows={2}
        placeholder="Note optionnelle (max 200 caractères)…"
        className="w-full bg-navy border border-navy-light rounded-lg px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-violet resize-none text-sm mb-1"
      />
      <p className="text-cream/30 text-xs text-right mb-3">{note.length}/200</p>

      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || score === null}
        className="w-full bg-violet hover:bg-violet-light text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
      >
        {submitting ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  )
}
