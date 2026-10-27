import { useState } from 'react'
import { supabase } from '../supabase.js'
import { friendly } from './api.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(friendly(error))
  }

  const forgot = async () => {
    setError('')
    setInfo('')
    if (!email.trim()) return setError('Digite seu e-mail acima e clique de novo em "Esqueci a senha".')
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + window.location.pathname + '#admin',
    })
    setBusy(false)
    if (error) return setError(friendly(error))
    setInfo('Se esse e-mail tiver cadastro, você vai receber um link para criar uma nova senha.')
  }

  return (
    <form className="a-card a-form-narrow" onSubmit={submit}>
      <p className="a-eyebrow">Área restrita</p>
      <h1>Entrar no painel</h1>
      <div className="a-field">
        <label htmlFor="em">E-mail</label>
        <input id="em" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </div>
      <div className="a-field">
        <label htmlFor="pw">Senha</label>
        <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="a-error" role="alert">{error}</p>}
      {info && <p className="a-info" role="status">{info}</p>}
      <button className="a-btn a-btn--primary" disabled={busy}>
        {busy ? 'Entrando…' : 'Entrar'}
      </button>
      <button type="button" className="a-link" onClick={forgot} disabled={busy}>
        Esqueci a senha
      </button>
    </form>
  )
}
