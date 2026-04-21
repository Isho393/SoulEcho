/**
 * useVoice — bouton micro inline dans ChatInput.
 *
 * Comportement push-to-talk :
 *   - 1er clic → démarre l'enregistrement
 *   - 2e clic → arrête et envoie l'audio à Whisper pour transcription
 */
import { useState, useRef, useCallback } from 'react'
import { getToken } from '../lib/auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Timeslice de 1s — chunks réguliers avec headers webm valides, décodables par ffmpeg
const TIMESLICE_MS = 1000

interface UseVoiceOptions {
  onResult: (transcript: string) => void
  language?: string
}

export function useVoice({ onResult, language = 'fr' }: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSupported] = useState(() => {
    return typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window.MediaRecorder !== 'undefined'
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef<string>('audio/webm')

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData()
    // Nommer le fichier avec la bonne extension selon le mimeType
    const ext = mimeTypeRef.current.includes('ogg') ? 'ogg' : 'webm'
    formData.append('file', audioBlob, `recording.${ext}`)
    formData.append('language', language)

    console.log('[useVoice] Envoi à Whisper:', audioBlob.size, 'bytes, type:', audioBlob.type)

    const response = await fetch(`${BASE_URL}/api/v1/audio/transcribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || `Erreur STT (${response.status})`)
    }

    const data = await response.json()
    return (data.text || '').trim()
  }, [language])

  const start = useCallback(async () => {
    if (!isSupported || isListening || isProcessing) {
      console.log('[useVoice] start() bloqué:', { isSupported, isListening, isProcessing })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,  // 16kHz — format natif de Whisper, réduit la taille
        }
      })
      streamRef.current = stream

      // Choisir le meilleur format supporté
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/ogg'
      mimeTypeRef.current = mimeType
      console.log('[useVoice] Format audio:', mimeType)

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
          console.log('[useVoice] Chunk:', e.data.size, 'bytes, total chunks:', audioChunksRef.current.length)
        }
      }

      recorder.onstop = async () => {
        console.log('[useVoice] Stop — total chunks:', audioChunksRef.current.length)
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null

        const chunks = audioChunksRef.current
        if (chunks.length === 0) {
          console.warn('[useVoice] Aucun chunk audio collecté')
          setIsProcessing(false)
          return
        }

        const blob = new Blob(chunks, { type: mimeTypeRef.current })
        console.log('[useVoice] Blob final:', blob.size, 'bytes')

        if (blob.size < 2000) {
          console.warn('[useVoice] Audio trop court (<2KB), ignoré')
          setIsProcessing(false)
          return
        }

        try {
          const text = await transcribeAudio(blob)
          console.log('[useVoice] Transcription:', text || '(vide)')
          if (text) onResult(text)
          else console.warn('[useVoice] Transcription vide')
        } catch (err) {
          console.error('[useVoice] STT error:', err)
        } finally {
          setIsProcessing(false)
        }
      }

      // timeslice=1000ms : chunks d'1s avec headers webm complets, décodables par ffmpeg
      recorder.start(TIMESLICE_MS)
      setIsListening(true)
      console.log('[useVoice] Enregistrement démarré avec timeslice', TIMESLICE_MS, 'ms')
    } catch (err) {
      console.error('[useVoice] Microphone error:', err)
      setIsListening(false)
    }
  }, [isSupported, isListening, isProcessing, transcribeAudio, onResult])

  const stop = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return
    console.log('[useVoice] Arrêt demandé, état:', mediaRecorderRef.current.state)
    setIsListening(false)
    setIsProcessing(true)
    mediaRecorderRef.current.stop()  // déclenche ondataavailable puis onstop
  }, [])

  const toggle = useCallback(() => {
    if (isListening) stop()
    else start()
  }, [isListening, start, stop])

  return { isListening, isProcessing, isSupported, toggle }
}
