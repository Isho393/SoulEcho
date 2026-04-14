interface StreamingCursorProps {
  isStreaming: boolean
}

export default function StreamingCursor({ isStreaming }: StreamingCursorProps) {
  if (!isStreaming) return null

  return (
    <span
      className="inline-block w-0.5 h-4 bg-violet-light ml-0.5 align-middle animate-cursor-blink"
      aria-hidden="true"
    />
  )
}
