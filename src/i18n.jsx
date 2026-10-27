import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { languages } from './content.js'
import { useData } from './data.jsx'
import { ui } from './ui.js'

const Ctx = createContext(null)
const KEY = 'portfolio-lang'

// Idioma inicial: o que o visitante escolheu antes; senão, o do navegador; senão, o primeiro da lista.
function initialLang() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && languages.includes(saved)) return saved
  } catch {
    /* sem armazenamento: segue sem lembrar */
  }
  const nav = (navigator.language || '').slice(0, 2).toLowerCase()
  return languages.includes(nav) ? nav : languages[0]
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)
  const { site } = useData()

  const setLang = useCallback((l) => {
    setLangState(l)
    try {
      localStorage.setItem(KEY, l)
    } catch {
      /* ignora */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang
    document.title = `${site.name} | ${ui[lang].docTitle}`
  }, [lang, site.name])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: ui[lang],
      // Escolhe o texto do idioma atual. Aceita texto simples ou { pt, en }.
      tr: (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.pt ?? '') : v),
    }),
    [lang, setLang],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)
