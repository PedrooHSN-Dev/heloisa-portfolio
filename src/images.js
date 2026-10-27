import { useEffect, useState } from 'react'
import meta from './imageMeta.json'

// Os caminhos em content.js são relativos à pasta public (ex.: 'projetos/aurora.webp').
const base = import.meta.env.BASE_URL
const isAbsolute = (p) => /^(https?:)?\/\//.test(p)

export const url = (p) => (!p ? null : isAbsolute(p) ? p : base + p.replace(/^\//, ''))

// O comando "npm run imagens" cria uma miniatura em "thumbs/" ao lado de cada imagem.
export const thumbUrl = (p) => (!p ? null : url(p.replace(/([^/]+)$/, 'thumbs/$1')))

// Proporções vindas do banco (o painel grava a medida de cada imagem ao enviar).
let remote = {}
export const setRemoteRatios = (r) => {
  remote = r || {}
}
const metaOf = (s) => remote[s] || meta[s]

export const coverOf = (w) => w.src || w.images?.[0] || null

// Peças do projeto. Sem imagem real, "pieces" cria blocos de exemplo.
export function slidesOf(w) {
  if (w.images?.length) return w.images.map((src, i) => ({ src, i, key: `${w.id}-${i}` }))
  const n = w.src ? 1 : Math.max(1, w.pieces || 1)
  return Array.from({ length: n }, (_, i) => ({
    src: i === 0 ? w.src || null : null,
    i,
    key: `${w.id}-${i}`,
  }))
}

// Proporção (altura ÷ largura): declarada, medida pelo script de imagens ou detectada no navegador.
export function ratioOf(w, detected) {
  if (w.ratio) return w.ratio
  const c = coverOf(w)
  return (c && (metaOf(c)?.ratio || detected[c])) || 1.25
}

export function slideRatio(w, slide, detected) {
  if (!slide.src) return w.ratio || 1.25
  if (slide.src === coverOf(w) && w.ratio) return w.ratio
  return metaOf(slide.src)?.ratio || detected[slide.src] || w.ratio || 1.25
}

// Só mede no navegador as imagens que o script ainda não mediu (ex.: arquivos colocados à mão).
export function useRatios(works) {
  const [ratios, setRatios] = useState({})
  useEffect(() => {
    const todo = new Set()
    works.forEach((w) => {
      ;[...(w.images || []), w.src].filter(Boolean).forEach((s) => {
        if (!metaOf(s) && !(s === coverOf(w) && w.ratio)) todo.add(s)
      })
    })
    todo.forEach((s) => {
      const img = new Image()
      let triedFull = false
      img.onload = () => {
        if (img.naturalWidth) setRatios((prev) => ({ ...prev, [s]: img.naturalHeight / img.naturalWidth }))
      }
      img.onerror = () => {
        if (!triedFull) {
          triedFull = true
          img.src = url(s)
        }
      }
      img.src = thumbUrl(s)
    })
  }, [works])
  return ratios
}
