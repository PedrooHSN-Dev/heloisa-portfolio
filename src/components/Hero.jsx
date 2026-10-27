import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { useData } from '../data.jsx'
import { useLang } from '../i18n.jsx'
import { url } from '../images.js'
import LangToggle from './LangToggle.jsx'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}
const rise = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
}

export default function Hero({ ready }) {
  const reduce = useReducedMotion()
  const { t, tr } = useLang()
  const { site } = useData()

  // Parallax: a moldura da foto e o contorno se movem em sentidos opostos com o mouse.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 70, damping: 16 })
  const sy = useSpring(my, { stiffness: 70, damping: 16 })
  const frameX = useTransform(sx, (v) => v * 14)
  const frameY = useTransform(sy, (v) => v * 14)
  const ringX = useTransform(sx, (v) => 18 - v * 22)
  const ringY = useTransform(sy, (v) => 18 - v * 22)

  const onMove = (e) => {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1)
    my.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }
  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <section className="hero" onMouseMove={onMove} onMouseLeave={onLeave} aria-label={t.intro}>
      <div className="hero__blobs" aria-hidden="true">
        <span className="blob blob--a" />
        <span className="blob blob--b" />
        <span className="blob blob--c" />
      </div>

      <LangToggle className="lang--hero" />

      <div className="hero__grid">
        <motion.div
          className="hero__photo"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div className="hero__ring" style={{ x: ringX, y: ringY }} aria-hidden="true" />
          <motion.div className="hero__frame" style={{ x: frameX, y: frameY }}>
            {site.photo ? (
              <img src={url(site.photo)} alt={t.portrait(site.name)} />
            ) : (
              <div className="hero__ph" role="img" aria-label={t.photoReserved}>
                <svg viewBox="0 0 120 150" aria-hidden="true">
                  <circle cx="60" cy="54" r="25" />
                  <path d="M12 150c0-31 21-54 48-54s48 23 48 54z" />
                </svg>
              </div>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          className="hero__text"
          variants={container}
          initial="hidden"
          animate={ready ? 'show' : 'hidden'}
        >
          <motion.h1 variants={rise}>{site.name}</motion.h1>
          <motion.p className="hero__role" variants={rise}>
            {tr(site.role)}
          </motion.p>

          <motion.h2 className="hero__about-title" variants={rise}>
            {t.aboutTitle}
          </motion.h2>
          {tr(site.about).map((text, i) => (
            <motion.p className="hero__about" variants={rise} key={i}>
              {text}
            </motion.p>
          ))}

          <motion.div className="hero__actions" variants={rise}>
            <a className="btn btn--primary" href="#trabalhos">
              {t.viewCollections}
            </a>
            <a className="btn btn--ghost" href="#contato">
              {t.talkToMe}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
