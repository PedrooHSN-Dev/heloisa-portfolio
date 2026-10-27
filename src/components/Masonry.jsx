import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { useLang } from '../i18n.jsx'
import { coverOf, ratioOf, slidesOf } from '../images.js'
import Art from './Art.jsx'

function useWidth(ref) {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

// Mosaico: cada projeto vai para a coluna mais baixa.
function computeLayout(items, width, ratios, maxCols) {
  const gap = width < 560 ? 12 : 18
  const base = width < 560 ? 2 : width < 900 ? 3 : 4
  const cols = Math.max(1, Math.min(base, maxCols || base))
  const colW = (width - gap * (cols - 1)) / cols
  const heights = Array(cols).fill(0)
  const pos = {}
  items.forEach((it) => {
    let c = 0
    for (let i = 1; i < cols; i++) if (heights[i] < heights[c] - 0.5) c = i
    const h = colW * ratioOf(it, ratios)
    pos[it.id] = { x: c * (colW + gap), y: heights[c], w: colW, h }
    heights[c] += h + gap
  })
  return { pos, height: Math.max(0, Math.max(...heights) - gap) }
}

const StackIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="8" y="8" width="12" height="12" rx="3" />
    <path d="M16 4.5A2.5 2.5 0 0 0 13.5 2h-8A2.5 2.5 0 0 0 3 4.5v8A2.5 2.5 0 0 0 5.5 15" />
  </svg>
)

// Os projetos de uma coleção, em mosaico, aparecendo em cascata.
export default function Masonry({ items, ratios, maxCols, artIndex, catLabel, onOpen }) {
  const reduce = useReducedMotion()
  const { t, tr } = useLang()
  const ref = useRef(null)
  const width = useWidth(ref)
  const shown = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const layout = useMemo(
    () => computeLayout(items, width, ratios, maxCols),
    [items, width, ratios, maxCols],
  )

  return (
    <div className="masonry-wrap">
      <ul className="masonry" ref={ref} style={{ height: layout.height }}>
        <AnimatePresence>
          {width > 0 &&
            items.map((w, i) => {
              const p = layout.pos[w.id]
              const delay = reduce ? 0 : (i % 10) * 0.06
              const pieces = slidesOf(w).length
              const title = tr(w.title)
              const cat = tr(catLabel[w.category])
              return (
                <motion.li
                  key={w.id}
                  className="tile"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                  initial={{ x: p.x, y: p.y, width: p.w, height: p.h, opacity: 0, scale: 0.94 }}
                  animate={{
                    x: p.x,
                    y: p.y,
                    width: p.w,
                    height: p.h,
                    opacity: shown ? 1 : 0,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: reduce ? 0 : 0.2 } }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          default: { type: 'spring', stiffness: 140, damping: 22 },
                          opacity: { duration: 0.55, delay },
                          scale: { duration: 0.55, delay },
                        }
                  }
                >
                  <button
                    type="button"
                    className="tile__btn"
                    onClick={() => onOpen(i)}
                    aria-label={t.openProject(title, cat, pieces)}
                  >
                    <Art src={coverOf(w)} title={title} index={artIndex.get(w.id)} thumb />
                    {pieces > 1 && (
                      <span className="tile__multi" aria-hidden="true">
                        <StackIcon /> {pieces}
                      </span>
                    )}
                    <span className="tile__cap">
                      <span className="tile__title">{title}</span>
                      <span className="tile__cat">{cat}</span>
                    </span>
                  </button>
                </motion.li>
              )
            })}
        </AnimatePresence>
      </ul>
    </div>
  )
}
