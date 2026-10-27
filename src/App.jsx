import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Intro from './components/Intro.jsx'
import Cursor from './components/Cursor.jsx'
import Hero from './components/Hero.jsx'
import Collections from './components/Collections.jsx'
import Contact from './components/Contact.jsx'
import { useData } from './data.jsx'

// O painel só é baixado por quem abre o endereço com #admin.
const Admin = lazy(() => import('./admin/Admin.jsx'))
const isAdminHash = () => /^#admin/.test(window.location.hash) || /type=recovery/.test(window.location.hash)

const SEEN = 'portfolio-intro-seen'

// A abertura aparece uma vez por visita e é pulada quando o link já aponta para uma coleção.
function shouldShowIntro() {
  if (window.location.hash.startsWith('#colecao')) return false
  try {
    return sessionStorage.getItem(SEEN) !== '1'
  } catch {
    return true
  }
}

export default function App() {
  const [admin, setAdmin] = useState(isAdminHash)
  useEffect(() => {
    const onHash = () => setAdmin(isAdminHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (admin) {
    return (
      <Suspense fallback={<div className="boot" aria-busy="true" />}>
        <Admin />
      </Suspense>
    )
  }
  return <Site />
}

function Site() {
  const { ready } = useData()
  const [intro, setIntro] = useState(shouldShowIntro)

  const finishIntro = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN, '1')
    } catch {
      /* ignora */
    }
    setIntro(false)
  }, [])

  // Trava a rolagem enquanto a abertura está na tela.
  useEffect(() => {
    document.body.style.overflow = intro ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [intro])

  return (
    <>
      <Cursor />
      <AnimatePresence>{intro && <Intro key="intro" onDone={finishIntro} />}</AnimatePresence>
      {ready ? (
        <main>
          <Hero ready={!intro} />
          <Collections />
          <Contact />
        </main>
      ) : (
        <div className="boot" aria-busy="true" />
      )}
    </>
  )
}
