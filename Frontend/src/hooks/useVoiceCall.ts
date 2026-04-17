import { useState, useRef, useCallback, useEffect } from 'react'

export type CallState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface UseVoiceCallOptions {
  onSendMessage: (text: string) => void
  isStreaming: boolean
  lang?: string
}

export function useVoiceCall({ onSendMessage, isStreaming, lang = 'fr-FR' }: UseVoiceCallOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [callState, setCallState] = useState<CallState>('idle')
  const [transcript, setTranscript] = useState('')
  const [isSupported] = useState(
    () => ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && 'speechSynthesis' in window
  )

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef(window.speechSynthesis)
  const isOpenRef = useRef(false)
  const isStreamingRef = useRef(isStreaming)
  isStreamingRef.current = isStreaming

  // When streaming ends → state goes back to listening
  useEffect(() => {
    if (!isOpen) return
    if (!isStreaming && callState === 'thinking') {
      setCallState('speaking')
    }
  }, [isStreaming, isOpen, callState])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }, [])

  const startListening = useCallback(() => {
    if (!isOpenRef.current) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onresult = (e) => {
      const result = e.results[e.results.length - 1]
      const text = result[0].transcript
      setTranscript(text)
      if (result.isFinal && text.trim()) {
        stopListening()
        setCallState('thinking')
        setTranscript('')
        onSendMessage(text.trim())
      }
    }

    recognition.onend = () => {
      // Restart listening if call is still open and not thinking/speaking
      if (isOpenRef.current && !isStreamingRef.current) {
        setTimeout(() => {
          if (isOpenRef.current) startListening()
        }, 300)
      }
    }

    recognition.onerror = (e) => {
      if (e.error === 'no-speech' && isOpenRef.current) {
        setTimeout(() => {
          if (isOpenRef.current) startListening()
        }, 300)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setCallState('listening')
  }, [lang, onSendMessage, stopListening])

  const speakText = useCallback((text: string) => {
    synthRef.current.cancel()
    // Strip markdown-like symbols for cleaner speech
    const clean = text.replace(/[*_~`#]/g, '').replace(/\n+/g, ' ').trim()
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = lang
    utterance.rate = 0.95
    utterance.pitch = 1

    // Pick a natural-sounding voice if available
    const voices = synthRef.current.getVoices()
    const preferred = voices.find(
      (v) => v.lang.startsWith('fr') && (v.name.includes('Google') || v.name.includes('Natural'))
    ) || voices.find((v) => v.lang.startsWith('fr'))
    if (preferred) utterance.voice = preferred

    utterance.onend = () => {
      if (isOpenRef.current) startListening()
    }

    synthRef.current.speak(utterance)
  }, [lang, startListening])

  // When state becomes 'speaking', find the last assistant message and read it
  const speakLastResponse = useCallback((text: string) => {
    speakText(text)
  }, [speakText])

  const open = useCallback(() => {
    if (!isSupported) return
    isOpenRef.current = true
    setIsOpen(true)
    setCallState('listening')
    synthRef.current.cancel()
    setTimeout(() => startListening(), 200)
  }, [isSupported, startListening])

  const close = useCallback(() => {
    isOpenRef.current = false
    setIsOpen(false)
    setCallState('idle')
    setTranscript('')
    stopListening()
    synthRef.current.cancel()
  }, [stopListening])

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
