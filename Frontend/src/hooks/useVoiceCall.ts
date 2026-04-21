/**
 * useVoiceCall — hook pour le mode "appel vocal" immersif.
 *
 * Pipeline :
 *   1. MediaRecorder enregistre la voix de l'utilisateur
 *   2. Audio envoyé au backend → faster-whisper (STT) → texte
 *   3. Texte envoyé au chat (sendMessage)
 *   4. Réponse IA envoyée au backend → Piper TTS → audio WAV
 *   5. Audio WAV joué dans le navigateur
 *   6. Retour à l'écoute automatiquement
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { getToken } from '../lib/auth'

export type CallState = 'idle' | 'listening' | 'thinking' | 'speaking'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface UseVoiceCallOptions {
  onSendMessage: (text: string) => void
  isStreaming: boolean
  language?: string // code langue profil (fr, en, es…)
}

// Durée max d'enregistrement par segment (ms) — évite les segments trop longs
const MAX_RECORD_MS = 30_000
// Silence détecté → on arrête l'enregistrement après N ms sans parole
const SILENCE_TIMEOUT_MS = 900  // réduit à 900ms pour plus de réactivité en mode appel

export function useVoiceCall({ onSendMessage, isStreaming, language = 'fr' }: UseVoiceCallOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [callState, setCallState] = useState<CallState>('idle')
  const [transcript, setTranscript] = useState('')
  const [isSupported] = useState(() => {
    return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder)
  })

  const isOpenRef = useRef(false)
  const isStreamingRef = useRef(isStreaming)
  isStreamingRef.current = isStreaming

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxRecordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Ref stable vers startListening pour éviter les closures stales dans speakLastResponse
  const startListeningRef = useRef<() => Promise<void>>(() => Promise.resolve())
  // Nettoyage des timers
  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    if (maxRecordTimerRef.current) { clearTimeout(maxRecordTimerRef.current); maxRecordTimerRef.current = null }
    if (silenceCheckIntervalRef.current) { clearInterval(silenceCheckIntervalRef.current); silenceCheckIntervalRef.current = null }
  }, [])

  // Arrêter la lecture audio en cours
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.src = ''
      currentAudioRef.current = null
    }
  }, [])

  // Arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    clearTimers()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()  // déclenche ondataavailable puis onstop
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
      analyserRef.current = null
    }
  }, [clearTimers])

  // Transcrire l'audio via le backend (faster-whisper)
  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.webm')
    formData.append('language', language)

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

  // Synthétiser la réponse IA via le backend (Piper TTS)
  const synthesizeAndPlay = useCallback(async (text: string): Promise<void> => {
    const formData = new FormData()
    formData.append('text', text)
    formData.append('language', language)

    const response = await fetch(`${BASE_URL}/api/v1/audio/synthesize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Erreur TTS (${response.status})`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    return new Promise((resolve) => {
      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        currentAudioRef.current = null
        resolve()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl)
        currentAudioRef.current = null
        resolve() // on continue même en cas d'erreur
      }

      audio.play().catch(() => resolve())
    })
  }, [language])

  // Démarrer l'enregistrement micro
  const startListening = useCallback(async () => {    if (!isOpenRef.current || isStreamingRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setCallState('listening')
      setTranscript('')

      // Détection de silence via AnalyserNode
      const audioCtx = new AudioContext()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let silentFrames = 0
      const SILENCE_THRESHOLD = 10
      const FRAMES_FOR_SILENCE = Math.floor(SILENCE_TIMEOUT_MS / 100)

      // Choisir le meilleur format supporté
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Libérer le stream micro
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        clearTimers()

        if (!isOpenRef.current) return

        const chunks = audioChunksRef.current
        if (chunks.length === 0) {
          setTimeout(() => { if (isOpenRef.current) startListening() }, 300)
          return
        }

        const audioBlob = new Blob(chunks, { type: mimeType })

        if (audioBlob.size < 1000) {
          setTimeout(() => { if (isOpenRef.current) startListening() }, 300)
          return
        }

        setCallState('thinking')

        try {
          const text = await transcribeAudio(audioBlob)
          if (text && text.length > 1) {
            setTranscript(text)
            onSendMessage(text)
          } else {
            setTimeout(() => { if (isOpenRef.current) startListening() }, 300)
          }
        } catch (err) {
          console.error('[VoiceCall] STT error:', err)
          setTimeout(() => { if (isOpenRef.current) startListening() }, 500)
        }
      }

      // timeslice=1000ms : chunks d'1s avec headers webm complets, décodables par ffmpeg
      recorder.start(1000)

      // Détection de silence
      silenceCheckIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length

        if (avg < SILENCE_THRESHOLD) {
          silentFrames++
          if (silentFrames >= FRAMES_FOR_SILENCE) {
            // Silence détecté → arrêter l'enregistrement
            clearInterval(silenceCheckIntervalRef.current!)
            silenceCheckIntervalRef.current = null
            stopRecording()
          }
        } else {
          silentFrames = 0
        }
      }, 100)

      // Sécurité : durée max
      maxRecordTimerRef.current = setTimeout(() => {
        stopRecording()
      }, MAX_RECORD_MS)

    } catch (err) {
      console.error('[VoiceCall] Microphone error:', err)
      setCallState('idle')
    }
  }, [transcribeAudio, onSendMessage, stopRecording, clearTimers])

  // Mettre à jour la ref stable après chaque recréation de startListening
  useEffect(() => {
    startListeningRef.current = startListening
  }, [startListening])

  // Appelé par ChatPage quand l'IA a fini de streamer sa réponse
  const speakLastResponse = useCallback(async (text: string) => {
    if (!isOpenRef.current) return
    setCallState('speaking')
    setTranscript('')

    try {
      await synthesizeAndPlay(text)
    } catch (err) {
      console.error('[VoiceCall] TTS error:', err)
    }

    // Après la lecture → relancer l'écoute via la ref stable
    if (isOpenRef.current) {
      setTimeout(() => startListeningRef.current(), 300)
    }
  }, [synthesizeAndPlay])

  // Quand le streaming IA se termine → déclencher la synthèse vocale
  // (géré via speakLastResponse appelé depuis ChatPage)

  const open = useCallback(() => {
    if (!isSupported) return
    isOpenRef.current = true
    setIsOpen(true)
    setCallState('listening')
    setTranscript('')
    stopAudio()
    setTimeout(() => startListeningRef.current(), 200)
  }, [isSupported, stopAudio])

  const close = useCallback(() => {
    isOpenRef.current = false
    setIsOpen(false)
    setCallState('idle')
    setTranscript('')
    stopRecording()
    stopAudio()
    // Libérer le stream si encore actif
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [stopRecording, stopAudio])

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      isOpenRef.current = false
      stopRecording()
      stopAudio()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [stopRecording, stopAudio])

  return {
    isOpen,
    isSupported,
    callState,
    transcript,
    open,
    close,
    speakLastResponse,
  }
}
