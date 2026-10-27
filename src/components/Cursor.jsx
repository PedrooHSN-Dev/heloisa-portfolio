import { useEffect, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

// Anel lilás que acompanha o mouse. Só aparece em telas com mouse (não no celular).
export default function Cursor() {
  const reduce = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [big, setBig] = useState(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 320, damping: 30, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 320, damping: 30, mass: 0.4 })

  useEffect(() => {
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return
    setEnabled(true)

    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setBig(Boolean(e.target.closest?.('a, button')))
    }
    const leave = () => {
      x.set(-100)
      y.set(-100)
    }
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
    }
  }, [reduce, x, y])

  if (!enabled) return null

  return (
    <motion.div
      className="cursor"
      aria-hidden="true"
      style={{ x: sx, y: sy }}
      animate={{ scale: big ? 1.7 : 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    />
  )
}
