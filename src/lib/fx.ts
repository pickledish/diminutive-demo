import confetti from 'canvas-confetti'
import { hex } from './colors'

const palette = Object.values(hex)

export function celebrate(intensity: 'small' | 'big' = 'small') {
  const count = intensity === 'big' ? 160 : 70
  confetti({
    particleCount: count,
    spread: intensity === 'big' ? 100 : 70,
    startVelocity: intensity === 'big' ? 45 : 32,
    origin: { y: 0.65 },
    colors: palette,
    scalar: 1.1,
    disableForReducedMotion: true,
  })
}
