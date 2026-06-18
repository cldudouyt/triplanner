import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  size: number
}

interface ConfettiProps {
  active: boolean
  duration?: number
  pieceCount?: number
  colors?: string[]
  onComplete?: () => void
}

const defaultColors = [
  '#06b6d4', // cyan (swim)
  '#22c55e', // green (bike)
  '#f97316', // orange (run)
  '#a855f7', // purple (strength)
  '#3b82f6', // blue (primary)
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
]

export function Confetti({
  active,
  duration = 3000,
  pieceCount = 50,
  colors = defaultColors,
  onComplete,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (!active) {
      setPieces([])
      return
    }

    const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: Math.random() * 8 + 6,
    }))

    setPieces(newPieces)

    const timer = setTimeout(() => {
      setPieces([])
      onComplete?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [active, pieceCount, colors, duration, onComplete])

  if (pieces.length === 0) return null

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.x}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>,
    document.body
  )
}

export function useConfetti() {
  const [isActive, setIsActive] = useState(false)

  const trigger = useCallback(() => {
    setIsActive(true)
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
  }, [])

  const ConfettiComponent = useCallback(
    (props: Omit<ConfettiProps, 'active'>) => (
      <Confetti active={isActive} onComplete={stop} {...props} />
    ),
    [isActive, stop]
  )

  return {
    trigger,
    stop,
    isActive,
    Confetti: ConfettiComponent,
  }
}
