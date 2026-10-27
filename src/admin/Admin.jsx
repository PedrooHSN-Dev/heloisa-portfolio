import { useCallback, useEffect, useState } from 'react'
import { hasSupabase, supabase } from '../supabase.js'
import { friendly, loadAll } from './api.js'
import { useToast } from './ui.jsx'
import Login from './Login.jsx'
import CollectionsTab from './CollectionsTab.jsx'
import WorksTab from './WorksTab.jsx'
import SiteTab from './SiteTab.jsx'
import AccountTab from './AccountTab.jsx'
import './admin.css'

const TABS = [
  { id: 'projetos', label: 'Projetos' },
  { id: 'colecoes', label: 'Coleções' },
  { id: 'site', label: 'Sobre e contato' },
  { id: 'conta', label: 'Minha conta' },
]

function useNoIndex() {
  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Painel | Portfólio'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.append(meta)
    return () => {
      meta.remove()
      document.title = prevTitle
    }
  }, [])
}

export default function Admin() {
  useNoIndex()
  const [session, setSession] = useState(undefined) // undefined = ainda verificando
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') {
        setRecovery(true)
        history.replaceState(null, '', '#admin')
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!hasSupabase) {
    return (
      <Shell>
        <div className="a-card a-center">
          <h1>Painel não configurado</h1>
          <p className="a-text">
            Faltam <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_KEY</code> no arquivo <code>.env</code>.
          </p>
        </div>
      </Shell>
    )
  }
  if (session === undefined) return <Shell><p className="a-loading">Carregando…</p></Shell>
  if (recovery && session) return <Shell><NewPassword onDone={() => setRecovery(false)} /></Shell>
  if (!session) return <Shell><Login /></Shell>
  return <Gate session={session} />
}

function Shell({ children }) {
  return <div className="admin admin--center">{children}</div>
}

// Confere se a conta que entrou é mesmo administradora antes de mostrar o painel.
function Gate({ session }) {
  const [state, setState] = useState('checking') // checking | ok | denied | error
  const userId = session.user.id

  useEffect(() => {
    let alive = true
    setState('checking')
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        setState(error ? 'error' : data ? 'ok' : 'denied')
      })
    return () => {
      alive = false
    }
  }, [userId])

  if (state === 'checking') return <Shell><p className="a-loading">Verificando acesso…</p></Shell>
  if (state !== 'ok') {
    return (
      <Shell>
        <div className="a-card a-center">
          <h1>{state === 'denied' ? 'Sem permissão' : 'Não foi possível verificar'}</h1>
          <p className="a-text">
            {state === 'denied'
              ? `A conta ${session.user.email} entrou, mas não está cadastrada como administradora deste portfólio.`
              : 'Houve um problema de conexão. Recarregue a página e tente de novo.'}
          </p>
          <button type="button" className="a-btn a-btn--primary" onClick={() => supabase.auth.signOut()}>
            Sair
          </button>
        </div>
      </Shell>
    )
  }
  return <Panel email={session.user.email} />
}

function Panel({ email }) {
  const [tab, setTab] = useState('projetos')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [toast, toastNode] = useToast()

  const reload = useCallback(async () => {
    try {
      setData(await loadAll())
      setError('')
    } catch (e) {
      setError(friendly(e))
    }
  }, [])
  useEffect(() => {
    reload()
  }, [reload])

  const leave = () => {
    // Recarrega a página sem o #admin para mostrar o site já atualizado.
    window.location.assign(window.location.pathname + window.location.search)
  }

  return (
    <div className="admin">
      <header className="a-top">
        <div className="a-top__in">
          <div>
            <p className="a-eyebrow">Painel</p>
            <h1 className="a-title">Portfólio</h1>
          </div>
          <div className="a-top__actions">
            <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={leave}>
              Ver o site
            </button>
            <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => supabase.auth.signOut()}>
              Sair
            </button>
          </div>
        </div>
        <nav className="a-tabs" aria-label="Seções do painel">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="a-tab"
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="a-main">
        {error && (
          <div className="a-alert" role="alert">
            {error}{' '}
            <button type="button" className="a-link" onClick={reload}>
              Tentar de novo
            </button>
          </div>
        )}
        {!data && !error && <p className="a-loading">Carregando…</p>}
        {data && tab === 'projetos' && <WorksTab data={data} reload={reload} toast={toast} />}
        {data && tab === 'colecoes' && <CollectionsTab data={data} reload={reload} toast={toast} />}
        {data && tab === 'site' && <SiteTab data={data} reload={reload} toast={toast} />}
        {tab === 'conta' && <AccountTab email={email} toast={toast} />}
      </main>
      {toastNode}
    </div>
  )
}

function NewPassword({ onDone }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (pw.length < 8) return setErr('Use pelo menos 8 caracteres.')
    if (pw !== pw2) return setErr('As duas senhas não são iguais.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setErr(friendly(error))
    onDone()
  }

  return (
    <form className="a-card a-form-narrow" onSubmit={submit}>
      <h1>Crie uma nova senha</h1>
      <div className="a-field">
        <label htmlFor="np1">Nova senha</label>
        <input id="np1" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} />
      </div>
      <div className="a-field">
        <label htmlFor="np2">Repita a nova senha</label>
        <input id="np2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
      </div>
      {err && <p className="a-error" role="alert">{err}</p>}
      <button className="a-btn a-btn--primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar senha'}</button>
    </form>
  )
}
