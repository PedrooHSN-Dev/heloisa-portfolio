import { useState } from 'react'
import { supabase } from '../supabase.js'
import { friendly } from './api.js'

export default function AccountTab({ email, toast }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (pw.length < 8) return setErr('Use pelo menos 8 caracteres.')
    if (pw !== pw2) return setErr('As duas senhas não são iguais.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setErr(friendly(error))
    setPw('')
    setPw2('')
    toast('Senha alterada.')
  }

  return (
    <section className="a-section">
      <h2 className="a-h2">Minha conta</h2>
      <form className="a-card a-form-narrow a-form-left" onSubmit={submit}>
        <p className="a-text">
          Você entrou como <strong>{email}</strong>.
        </p>
        <h3 className="a-h3">Trocar a senha</h3>
        <div className="a-field">
          <label htmlFor="acc1">Nova senha</label>
          <input id="acc1" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <small>Pelo menos 8 caracteres. Uma frase longa é mais segura que uma palavra curta.</small>
        </div>
        <div className="a-field">
          <label htmlFor="acc2">Repita a nova senha</label>
          <input id="acc2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        {err && <p className="a-error" role="alert">{err}</p>}
        <button className="a-btn a-btn--primary" disabled={busy || !pw}>
          {busy ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </section>
  )
}
