import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLang } from '../i18n.jsx'
import { slideRatio, slidesOf, url } from '../images.js'
import { QuoteLink, useQuote } from '../quote.jsx'
import Art from './Art.jsx'

const variants = {
  enter: (d) => ({ x: d * 70, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (d) => ({ x: d * -70, opacity: 0, scale: 0.97 }),
}

function useViewport() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

const Chevron = ({ dir }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
)

// Tela cheia: as setas percorrem todas as peças da coleção, na ordem, passando de um
// projeto para o próximo. Os botões de projeto pulam direto para o início de outro.
export default function Lightbox({ items, start, artIndex, ratios, catLabel, onClose }) {
  const reduce = useReducedMotion()
  const { t, tr } = useLang()
  const { firstName, hasQuote } = useQuote()
  const { w: vw, h: vh } = useViewport()
  const dir = useRef(0)
  const closeRef = useRef(null)
  const dialogRef = useRef(null)

  const flat = useMemo(
    () => items.flatMap((w, pi) => slidesOf(w).map((s) => ({ pi, s }))),
    [items],
  )
  const [pos, setPos] = useState(() => Math.max(0, flat.findIndex((f) => f.pi === start)))
  const n = flat.length
  const cur = flat[pos]
  const work = items[cur.pi]
  const slides = useMemo(() => slidesOf(work), [work])
  const title = tr(work.title)
  const catName = tr(catLabel[work.category])
  const desc = tr(work.description)
  const multiProject = items.length > 1

  const move = (d) => {
    if (n < 2) return
    dir.current = d
    setPos((p) => (p + d + n) % n)
  }
  const jumpProject = (d) => {
    const m = items.length
    if (m < 2) return
    dir.current = d
    const target = (cur.pi + d + m) % m
    setPos(flat.findIndex((f) => f.pi === target))
  }
  const goToPiece = (i) => {
    dir.current = i > cur.s.i ? 1 : -1
    setPos(pos - cur.s.i + i)
  }

  // Foco: entra no botão de fechar, fica preso dentro do diálogo e volta ao tile ao sair.
  useEffect(() => {
    const previous = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      previous?.focus?.()
    }
  }, [])

  const trapTab = (e) => {
    const root = dialogRef.current
    if (!root) return
    const focusable = [...root.querySelectorAll('button, a[href]')].filter(
      (el) => !el.disabled && el.getClientRects().length > 0,
    )
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!root.contains(document.activeElement)) {
      e.preventDefault()
      first.focus()
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') move(-1)
      else if (e.key === 'ArrowRight') move(1)
      else if (e.key === 'Tab') trapTab(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Carrega antes as peças vizinhas para a troca ser instantânea.
  useEffect(() => {
    ;[pos - 1, pos + 1].forEach((p) => {
      const f = flat[(p + n) % n]
      if (f?.s.src) new Image().src = url(f.s.src)
    })
  }, [pos, flat, n])

  // Tamanho da imagem respeitando a proporção da peça e a tela (sobra espaço para o texto).
  const ratio = slideRatio(work, cur.s, ratios)
  const maxW = Math.min(vw * 0.9, 880)
  const maxH = Math.max(200, vh - (vw < 640 ? 330 : 300))
  const w = Math.min(maxW, maxH / ratio)
  const h = w * ratio

  const stop = (e) => e.stopPropagation()
  const spring = reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 }
  const alt = slides.length > 1 ? `${title}, ${t.pieceOf(cur.s.i + 1, slides.length)}` : title

  return (
    <motion.div
      ref={dialogRef}
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.28 }}
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="lb__btn lb__close"
        onClick={(e) => {
          stop(e)
          onClose()
        }}
        aria-label={t.close}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <div className="lb__col" onClick={stop}>
        <div className="lb__stage" style={{ width: w, height: h }}>
          {n > 1 && (
            <button type="button" className="lb__btn lb__nav lb__nav--prev" onClick={() => move(-1)} aria-label={t.prev}>
              <Chevron dir="left" />
            </button>
          )}

          <AnimatePresence custom={dir.current} mode="popLayout">
            <motion.figure
              key={cur.s.key}
              className="lb__fig"
              custom={dir.current}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={spring}
              drag={n > 1 ? 'x' : false}
              dragSnapToOrigin
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) move(1)
                else if (info.offset.x > 80) move(-1)
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <Art src={cur.s.src} title={alt} index={(artIndex.get(work.id) || 0) + cur.s.i} eager />
            </motion.figure>
          </AnimatePresence>

          {n > 1 && (
            <button type="button" className="lb__btn lb__nav lb__nav--next" onClick={() => move(1)} aria-label={t.next}>
              <Chevron dir="right" />
            </button>
          )}
        </div>

        {slides.length > 1 && (
          <div className="lb__dots">
            {slides.map((s) => (
              <button
                key={s.key}
                type="button"
                className="lb__dot"
                aria-label={t.goToPiece(s.i + 1)}
                aria-current={s.i === cur.s.i}
                onClick={() => goToPiece(s.i)}
              />
            ))}
          </div>
        )}

        <div className="lb__meta">
          <p className="lb__title">{title}</p>
          <p className="lb__info" aria-live="polite">
            <span>{catName}</span>
            {multiProject && <span>{t.projectOf(cur.pi + 1, items.length)}</span>}
            {slides.length > 1 && <span>{t.pieceOf(cur.s.i + 1, slides.length)}</span>}
          </p>
          {desc && <p className="lb__desc">{desc}</p>}

          <div className="lb__actions">
            {hasQuote && (
              <QuoteLink className="btn btn--primary btn--sm" message={t.msgProject(firstName, title, catName)}>
                {t.quoteProjectBtn}
              </QuoteLink>
            )}
            {multiProject && (
              <>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => jumpProject(-1)}>
                  {t.prevProject}
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => jumpProject(1)}>
                  {t.nextProject}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
