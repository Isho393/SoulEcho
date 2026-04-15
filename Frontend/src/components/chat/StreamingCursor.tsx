interface StreamingCursorProps {
  isStreaming: boolean
}

export default function StreamingCursor({ isStreaming }: StreamingCursorProps) {
  if (!isStreaming) return null
  return (
    <span
      className="inline-block w-[3px] h-[14px] bg-violet-light ml-0.5 align-middle rounded-full animate-cursor-blink"
      aria-hidden="true"
    />
  )
}
