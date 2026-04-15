import { useState, useRef, useCallback } from 'react'

interface UseVoiceOptions {
  onResult: (transcript: string) => void
  lang?: string
}

export function useVoice({ onResult, lang = 'fr-FR' }: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const start = useCallback(() => {
    if (!isSupported || isListening) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      if (transcript.trim()) onResult(transcript.trim())
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isSupported, isListening, lang, onResult])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const toggle = useCallback(() => {
    isListening ? stop() : start()
  }, [isListening, start, stop])

  return { isListening, isSupported, toggle }
}
