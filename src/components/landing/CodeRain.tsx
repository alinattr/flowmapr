'use client'
import { useEffect, useRef } from 'react'

const SYMBOLS = [
  '{}', '[]', '/>', '=>', '()', '01', '10', '00', '11',
  '</>', '&&', '||', '!=', '==', '::', '--', '++',
  'fn', 'if', '{}',
]

interface Flake {
  x: number
  y: number
  symbol: string
  speed: number
  opacity: number
  size: number
  drift: number
  driftSpeed: number
  driftAngle: number
}

export function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const flakes: Flake[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      speed: 0.2 + Math.random() * 0.5,
      opacity: 0.28 + Math.random() * 0.32,
      size: 12 + Math.random() * 6,
      drift: 0,
      driftSpeed: 0.003 + Math.random() * 0.008,
      driftAngle: Math.random() * Math.PI * 2,
    }))

    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      flakes.forEach(f => {
        f.driftAngle += f.driftSpeed
        f.drift = Math.sin(f.driftAngle) * 0.4
        f.y += f.speed
        f.x += f.drift

        if (f.y > canvas.height + 20) {
          f.y = -20
          f.x = Math.random() * canvas.width
          f.symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        }
        if (f.x > canvas.width + 20) f.x = -20
        if (f.x < -20) f.x = canvas.width + 20

        const colors = [
          `rgba(99,102,241,${f.opacity})`,
          `rgba(139,92,246,${f.opacity})`,
          `rgba(6,182,212,${f.opacity})`,
        ]
        const colorIndex = Math.floor(f.x / (canvas.width / 3))

        ctx.font = `${f.size}px 'JetBrains Mono', 'Fira Code', monospace`
        ctx.fillStyle = colors[colorIndex] ?? colors[0]
        ctx.fillText(f.symbol, f.x, f.y)
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1,
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 85%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 85%)',
      }}
    />
  )
}
