import { languages } from '../content.js'
import { ui } from '../ui.js'
import { useLang } from '../i18n.jsx'

// Botão PT | EN. Some sozinho se o site tiver só um idioma.
export default function LangToggle({ className = '' }) {
  const { lang, setLang, t } = useLang()
  if (languages.length < 2) return null

  return (
    <div className={`lang ${className}`} role="group" aria-label={t.language}>
      {languages.map((l) => (
        <button
          key={l}
          type="button"
          className="lang__btn"
          lang={l}
          aria-pressed={lang === l}
          aria-label={ui[l].langName}
          onClick={() => setLang(l)}
        >
          {ui[l].langShort}
        </button>
      ))}
    </div>
  )
}
