import { motion } from 'motion/react'

interface StreamingCursorProps {
  isStreaming: boolean
}

export default function StreamingCursor({ isStreaming }: StreamingCursorProps) {
  if (!isStreaming) return null
  return (
    <motion.span
      className="inline-block w-[3px] h-[15px] ml-0.5 align-middle rounded-full"
      style={{ background: 'linear-gradient(180deg, #9D5CF6, #7C3AED)' }}
      animate={{ opacity: [1, 0, 1], scaleY: [1, 0.7, 1] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    />
  )
}
