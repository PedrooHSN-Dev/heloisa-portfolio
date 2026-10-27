import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { useData } from '../data.jsx'
import { useLang } from '../i18n.jsx'
import { coverOf, useRatios } from '../images.js'
import { QuoteLink, useQuote } from '../quote.jsx'
import Art from './Art.jsx'
import Masonry from './Masonry.jsx'
import Lightbox from './Lightbox.jsx'

// A coleção aberta vive no endereço (#colecao/posts): o botão voltar do
// navegador funciona e dá para compartilhar o link de uma coleção.
const parseHash = (categories) => {
  const m = window.location.hash.match(/^#colecao\/(.+)$/)
  const id = m ? decodeURIComponent(m[1]) : null
  return categories.some((c) => c.id === id) ? id : null
}
function useRoute(categories) {
  const [current, setCurrent] = useState(() => parseHash(categories))
  useEffect(() => {
    setCurrent(parseHash(categories))
    const onHash = () => setCurrent(parseHash(categories))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [categories])
  const go = (id) => {
    window.location.hash = id ? `colecao/${id}` : 'trabalhos'
  }
  return [current, go]
}

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const rise = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}

const Chevron = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
)

export default function Collections() {
  const reduce = useReducedMotion()
  const { t, tr } = useLang()
  const { categories, works } = useData()
  const { firstName, hasQuote } = useQuote()
  const ratios = useRatios(works)
  const [current, go] = useRoute(categories)
  const byCat = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, works.filter((w) => w.category === c.id)])),
    [categories, works],
  )
  const catLabel = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label])), [categories])
  const artIndex = useMemo(() => new Map(works.map((w, i) => [w.id, i])), [works])
  const [open, setOpen] = useState(null)
  const sectionRef = useRef(null)
  const firstRun = useRef(true)

  const cat = categories.find((c) => c.id === current) || null
  const items = cat ? byCat[cat.id] : []
  const catName = cat ? tr(cat.label) : ''

  // Ao trocar de tela, fecha o lightbox e leva o visitante ao começo da seção.
  useEffect(() => {
    setOpen(null)
    if (firstRun.current) {
      firstRun.current = false
      if (!current) return
    }
    sectionRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  return (
    <section className="work" id="trabalhos" ref={sectionRef}>
      {cat && (
        <motion.div
          className="filters"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <LayoutGroup id="filters">
            <div className="filters__row" role="group" aria-label={t.collections}>
              <button type="button" className="back" onClick={() => go(null)}>
                <Chevron /> {t.collections}
              </button>
              <span className="filters__sep" aria-hidden="true" />
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="pill"
                  aria-pressed={current === c.id}
                  onClick={() => go(c.id)}
                >
                  {current === c.id && (
                    <motion.span
                      layoutId="pill-bg"
                      className="pill__bg"
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="pill__label">{tr(c.label)}</span>
                  <span className="pill__count">{byCat[c.id].length}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </motion.div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={cat ? cat.id : 'overview'}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {cat ? (
            <>
              <header className="work__head work__head--coll">
                <h2>{catName}</h2>
                {cat.description && <p>{tr(cat.description)}</p>}
                <p className="work__meta">{t.projects(items.length)}</p>
              </header>
              <Masonry
                items={items}
                ratios={ratios}
                maxCols={cat.maxCols}
                artIndex={artIndex}
                catLabel={catLabel}
                onOpen={setOpen}
              />
              {hasQuote && (
                <aside className="quote">
                  <h3>{t.quoteCollTitle(catName)}</h3>
                  <p>{t.quoteCollText}</p>
                  <QuoteLink message={t.msgCollection(firstName, catName)}>
                    {t.quoteCollBtn(catName)}
                  </QuoteLink>
                </aside>
              )}
            </>
          ) : (
            <>
              <header className="work__head">
                <h2>{t.collections}</h2>
                <p>{t.collectionsIntro}</p>
              </header>
              <motion.ul
                className="collections"
                variants={list}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '0px 0px -8% 0px' }}
              >
                {categories.map((c, i) => {
                  const first = byCat[c.id][0]
                  const label = tr(c.label)
                  const count = byCat[c.id].length
                  return (
                    <motion.li variants={rise} key={c.id}>
                      <button
                        type="button"
                        className="coll__btn"
                        onClick={() => go(c.id)}
                        aria-label={t.openCollection(label, count)}
                      >
                        <span className="coll__stack">
                          <span className="coll__layer coll__layer--b" aria-hidden="true" />
                          <span className="coll__layer coll__layer--a" aria-hidden="true" />
                          <span className="coll__cover">
                            <Art src={c.cover || (first && coverOf(first))} title={label} index={i} thumb />
                          </span>
                        </span>
                        <span className="coll__name">{label}</span>
                        <span className="coll__count">{t.projects(count)}</span>
                      </button>
                    </motion.li>
                  )
                })}
              </motion.ul>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {open !== null && items[open] && (
          <Lightbox
            key="lightbox"
            items={items}
            start={open}
            artIndex={artIndex}
            ratios={ratios}
            catLabel={catLabel}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
