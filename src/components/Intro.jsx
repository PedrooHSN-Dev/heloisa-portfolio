import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useData } from '../data.jsx'
import { useLang } from '../i18n.jsx'

// Abertura curta: o nome sobe letra por letra e a cortina sobe.
export default function Intro({ onDone }) {
  const reduce = useReducedMotion()
  const { tr } = useLang()
  const { site } = useData()

  useEffect(() => {
    const t = setTimeout(onDone, reduce ? 200 : 2100)
    return () => clearTimeout(t)
  }, [onDone, reduce])

  const letters = Array.from(site.name)

  return (
    <motion.div
      className="intro"
      onClick={onDone}
      initial={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: reduce ? 0.01 : 0.9, ease: [0.76, 0, 0.24, 1] }}
      role="presentation"
    >
      <h1 className="intro__name" aria-label={site.name}>
        {letters.map((char, i) => (
          <span className="intro__mask" key={i} aria-hidden="true">
            <motion.span
              style={{ display: 'inline-block' }}
              initial={{ y: reduce ? 0 : '115%' }}
              animate={{ y: 0 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {char === ' ' ? ' ' : char}
            </motion.span>
          </span>
        ))}
      </h1>
      <motion.p
        className="intro__role"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.8 }}
      >
        {tr(site.role)}
      </motion.p>
    </motion.div>
  )
}
