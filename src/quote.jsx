import { useData } from './data.jsx'
import { useLang } from './i18n.jsx'

// Nome e contatos vêm do conteúdo atual (banco ou content.js).
export function useQuote() {
  const { site } = useData()
  return {
    firstName: site.name.split(' ')[0],
    hasQuote: Boolean(site.contact.whatsapp || site.contact.email),
  }
}

// Link de orçamento: abre o WhatsApp com a mensagem pronta; sem WhatsApp, abre o e-mail.
export function QuoteLink({ message, className = 'btn btn--primary', children }) {
  const { t } = useLang()
  const { site } = useData()
  const c = site.contact
  let href = null
  let external = false

  if (c.whatsapp) {
    href = `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(message)}`
    external = true
  } else if (c.email) {
    href = `mailto:${c.email}?subject=${encodeURIComponent(t.emailSubject)}&body=${encodeURIComponent(message)}`
  }
  if (!href) return null

  return (
    <a className={className} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {children}
    </a>
  )
}
