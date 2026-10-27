import { useData } from '../data.jsx'
import { useLang } from '../i18n.jsx'
import LangToggle from './LangToggle.jsx'

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M3.5 7.5l8.5 6 8.5-6" />
  </svg>
)
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20l1.4-4.2A8 8 0 1 1 8.2 18.6L4 20z" />
  </svg>
)
const InstaIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export default function Contact() {
  const { t } = useLang()
  const { site } = useData()
  const c = site.contact
  const year = new Date().getFullYear()

  return (
    <section className="contact" id="contato">
      <div className="blob blob--d" aria-hidden="true" />
      <div className="contact__inner">
        <h2>{t.contactTitle}</h2>
        <p>{t.contactText}</p>

        <div className="contact__cta">
          {c.email && (
            <a className="btn btn--primary breathe" href={`mailto:${c.email}`}>
              <MailIcon /> {t.sendEmail}
            </a>
          )}
          {c.whatsapp && (
            <a className="btn btn--ghost" href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer">
              <ChatIcon /> {t.whatsapp}
            </a>
          )}
        </div>

        <div className="contact__social">
          {c.instagram && (
            <a className="chip" href={c.instagram} target="_blank" rel="noreferrer">
              <InstaIcon /> Instagram
            </a>
          )}
          {c.linkedin && (
            <a className="chip" href={c.linkedin} target="_blank" rel="noreferrer">
              <span className="glyph" aria-hidden="true">in</span> LinkedIn
            </a>
          )}
        </div>

        <LangToggle className="lang--footer" />
        <p className="contact__foot">© {year} {site.name}</p>
      </div>
    </section>
  )
}
