import { useState } from 'react'
import { supabase } from '../supabase.js'
import { friendly, must, processImage, removeFiles, storageUrl, uploadProcessed } from './api.js'
import { Field } from './ui.jsx'

const toText = (arr) => (Array.isArray(arr) ? arr.join('\n\n') : '')
const toList = (text) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

const withHttp = (v) => {
  const t = v.trim()
  return !t || /^https?:\/\//i.test(t) ? t : `https://${t}`
}

export default function SiteTab({ data, reload, toast }) {
  const s = data.settings || {}
  const c = s.contact || {}
  const [f, setF] = useState({
    name: s.name || '',
    role_pt: s.role?.pt || '',
    role_en: s.role?.en || '',
    about_pt: toText(s.about?.pt),
    about_en: toText(s.about?.en),
    email: c.email || '',
    whatsapp: c.whatsapp || '',
    instagram: c.instagram || '',
    linkedin: c.linkedin || '',
  })
  const [photo, setPhoto] = useState(null) // { processed, preview } | 'remove' | null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const processed = await processImage(file, { max: 1200, thumb: 0 })
      setPhoto({ processed, preview: URL.createObjectURL(processed.full) })
      setError('')
    } catch (err) {
      setError(friendly(err))
    }
  }
  const shownPhoto = photo === 'remove' ? null : photo?.preview || (s.photo_path ? storageUrl(s.photo_path) : null)

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (!f.name.trim()) return setError('Escreva o nome que aparece no topo do site.')
    const email = f.email.trim()
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setError('O e-mail parece estar incompleto.')
    const whatsapp = f.whatsapp.replace(/\D/g, '')
    if (whatsapp && whatsapp.length < 10) return setError('O WhatsApp precisa ter o código do país e o DDD, por exemplo 5562999999999.')

    setBusy(true)
    try {
      let photo_path = s.photo_path || null
      let old = null
      if (photo === 'remove') {
        old = photo_path
        photo_path = null
      } else if (photo?.processed) {
        old = photo_path
        photo_path = await uploadProcessed(`perfil/foto-${Date.now()}`, photo.processed)
      }
      const next = {
        ...s,
        name: f.name.trim(),
        role: { pt: f.role_pt.trim(), en: f.role_en.trim() || f.role_pt.trim() },
        photo_path,
        about: { pt: toList(f.about_pt), en: toList(f.about_en) },
        contact: {
          email,
          whatsapp,
          instagram: withHttp(f.instagram),
          linkedin: withHttp(f.linkedin),
        },
      }
      const rows = must(await supabase.from('site_settings').update({ data: next }).eq('id', 1).select('id'))
      if (!rows?.length) throw new Error('Não foi possível salvar. Entre de novo e tente outra vez.')
      if (old && old !== photo_path) await removeFiles([old])
      setPhoto(null)
      toast('Alterações salvas.')
      await reload()
    } catch (err) {
      setError(friendly(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="a-section">
      <h2 className="a-h2">Sobre e contato</h2>
      <p className="a-text">Esses dados aparecem no topo e no rodapé do site, e nos botões de orçamento.</p>
      <form className="a-form a-card" onSubmit={save}>
        <div className="a-field">
          <span className="a-label">Foto</span>
          <div className="a-cover">
            <div className="a-thumb a-thumb--photo">{shownPhoto ? <img src={shownPhoto} alt="Foto atual" /> : <span>sem foto</span>}</div>
            <div className="a-cover__btns">
              <label className="a-btn a-btn--ghost a-btn--sm a-file">
                {shownPhoto ? 'Trocar foto' : 'Escolher foto'}
                <input type="file" accept="image/*" onChange={pick} />
              </label>
              {shownPhoto && (
                <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setPhoto('remove')}>Remover foto</button>
              )}
              <small>Uma foto vertical funciona melhor: o site mostra num formato 4:5.</small>
            </div>
          </div>
        </div>

        <div className="a-grid2">
          <Field label="Nome">{(id) => <input id={id} value={f.name} onChange={set('name')} required />}</Field>
          <span />
          <Field label="Profissão (português)">{(id) => <input id={id} value={f.role_pt} onChange={set('role_pt')} />}</Field>
          <Field label="Profissão (inglês)">{(id) => <input id={id} value={f.role_en} onChange={set('role_en')} />}</Field>
          <Field label="Sobre mim (português)" hint="Separe os parágrafos com uma linha em branco.">
            {(id) => <textarea id={id} rows={8} value={f.about_pt} onChange={set('about_pt')} />}
          </Field>
          <Field label="Sobre mim (inglês)" hint="Se ficar vazio, o site mostra o texto em português.">
            {(id) => <textarea id={id} rows={8} value={f.about_en} onChange={set('about_en')} />}
          </Field>
        </div>

        <h3 className="a-h3">Contatos</h3>
        <p className="a-text">Deixe em branco o que não quiser mostrar.</p>
        <div className="a-grid2">
          <Field label="E-mail">{(id) => <input id={id} type="email" value={f.email} onChange={set('email')} />}</Field>
          <Field label="WhatsApp" hint="Com país e DDD, só números. Ex.: 5562999999999">
            {(id) => <input id={id} inputMode="numeric" value={f.whatsapp} onChange={set('whatsapp')} />}
          </Field>
          <Field label="Instagram (link)">{(id) => <input id={id} value={f.instagram} onChange={set('instagram')} placeholder="https://instagram.com/seuperfil" />}</Field>
          <Field label="LinkedIn (link)">{(id) => <input id={id} value={f.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/in/seuperfil" />}</Field>
        </div>

        {error && <p className="a-error" role="alert">{error}</p>}
        <div>
          <button className="a-btn a-btn--primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar alterações'}</button>
        </div>
      </form>
    </section>
  )
}
