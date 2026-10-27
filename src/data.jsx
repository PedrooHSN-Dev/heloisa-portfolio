import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as fallback from './content.js'
import { setRemoteRatios } from './images.js'
import { SUPABASE_KEY, SUPABASE_URL, hasSupabase, storageUrl } from './config.js'

const Ctx = createContext(null)
const CACHE = 'portfolio-data-v1'
const TIMEOUT = 4500

// Transforma as linhas do banco no mesmo formato de content.js,
// para que os componentes não precisem saber de onde vem o conteúdo.
function fromRows({ cats, works, settings }) {
  const ratios = {}
  const mappedWorks = works
    .map((w) => {
      const imgs = [...(w.work_images || [])].sort((a, b) => a.position - b.position)
      const images = imgs.map((i) => storageUrl(i.path))
      imgs.forEach((i, n) => {
        if (i.ratio) ratios[images[n]] = { ratio: Number(i.ratio) }
      })
      return {
        id: w.id,
        title: { pt: w.title_pt, en: w.title_en || w.title_pt },
        description: { pt: w.description_pt || '', en: w.description_en || w.description_pt || '' },
        category: w.category_id,
        position: w.position,
        images,
      }
    })
    .filter((w) => w.images.length > 0)
    .sort((a, b) => a.position - b.position)

  const categories = cats
    .map((c) => ({
      id: c.id,
      label: { pt: c.label_pt, en: c.label_en || c.label_pt },
      description:
        c.description_pt || c.description_en
          ? { pt: c.description_pt || '', en: c.description_en || c.description_pt || '' }
          : null,
      cover: c.cover_path ? storageUrl(c.cover_path) : null,
      maxCols: c.max_cols || undefined,
    }))

  const s = settings || {}
  const site = {
    name: s.name || fallback.site.name,
    role: s.role?.pt ? { pt: s.role.pt, en: s.role.en || s.role.pt } : fallback.site.role,
    photo: s.photo_path ? storageUrl(s.photo_path) : null,
    about: s.about?.pt?.length
      ? { pt: s.about.pt, en: s.about.en?.length ? s.about.en : s.about.pt }
      : fallback.site.about,
    contact: { ...fallback.site.contact, ...(s.contact || {}) },
  }
  return { site, categories, works: mappedWorks, ratios }
}

// Enquanto não houver nenhum projeto publicado, o site mostra os exemplos de content.js.
// Quando o primeiro projeto é publicado, os exemplos somem. Coleções vazias não aparecem.
function resolve(remote) {
  if (!remote) return { ...fallback, ratios: {}, example: true }
  if (remote.works.length === 0) {
    return { site: remote.site, categories: fallback.categories, works: fallback.works, ratios: {}, example: true }
  }
  const used = new Set(remote.works.map((w) => w.category))
  return {
    site: remote.site,
    categories: remote.categories.filter((c) => used.has(c.id)),
    works: remote.works,
    ratios: remote.ratios,
    example: false,
  }
}

// Leitura pública direto pela API REST: evita baixar o cliente completo do Supabase no site.
async function get(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, { headers: { apikey: SUPABASE_KEY } })
  if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`)
  return res.json()
}

async function fetchRemote() {
  const [cats, works, settings] = await Promise.all([
    get('categories?select=*&order=position'),
    get('works?select=*,work_images(path,ratio,position)&published=eq.true&order=position'),
    get('site_settings?select=data&id=eq.1'),
  ])
  return fromRows({ cats, works, settings: settings[0]?.data })
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function writeCache(remote) {
  try {
    localStorage.setItem(CACHE, JSON.stringify(remote))
  } catch {
    /* sem armazenamento: segue sem cache */
  }
}

export function DataProvider({ children }) {
  // Visita repetida: mostra na hora o que foi baixado da última vez e atualiza em segundo plano.
  const [state, setState] = useState(() => {
    if (!hasSupabase) return { remote: null, ready: true }
    const cached = readCache()
    if (cached) {
      setRemoteRatios(cached.ratios)
      return { remote: cached, ready: true }
    }
    return { remote: null, ready: false }
  })

  useEffect(() => {
    if (!hasSupabase) return
    let alive = true
    const timer = setTimeout(() => alive && setState((s) => (s.ready ? s : { ...s, ready: true })), TIMEOUT)
    fetchRemote()
      .then((remote) => {
        if (!alive) return
        setRemoteRatios(remote.ratios)
        writeCache(remote)
        setState({ remote, ready: true })
      })
      .catch((e) => {
        console.warn('Não foi possível carregar o conteúdo do Supabase; usando a cópia local.', e)
        if (alive) setState((s) => ({ ...s, ready: true }))
      })
      .finally(() => clearTimeout(timer))
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [])

  const value = useMemo(() => ({ ...resolve(state.remote), ready: state.ready }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useData = () => useContext(Ctx)
