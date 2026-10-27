import { BUCKET, storageUrl, supabase } from '../supabase.js'

// Lança o erro do Supabase, se houver, e devolve os dados.
export const must = ({ data, error }) => {
  if (error) throw error
  return data
}

// Mensagens de erro em português claro.
export function friendly(e) {
  const m = String(e?.message || e || '').toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Este e-mail ainda não foi confirmado.'
  if (m.includes('row-level security') || m.includes('permission denied') || m.includes('not authorized'))
    return 'Esta conta não tem permissão para fazer isso. Entre de novo ou fale com quem configurou o painel.'
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('network'))
    return 'Sem conexão com o servidor. Confira a internet e tente de novo.'
  if (m.includes('duplicate key')) return 'Já existe um item com esse identificador.'
  if (m.includes('different from the old password')) return 'A nova senha precisa ser diferente da atual.'
  if (m.includes('pwned') || m.includes('compromised') || m.includes('leaked'))
    return 'Essa senha já apareceu em vazamentos de dados. Escolha outra.'
  if (m.includes('password should be at least') || m.includes('weak password'))
    return 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
  if (m.includes('exceeded') && m.includes('size')) return 'A imagem é grande demais.'
  return e?.message || 'Algo deu errado. Tente de novo.'
}

export const slugify = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })

// ---------------------------------------------------------------
// Leitura de tudo o que o painel mostra (inclui rascunhos)
// ---------------------------------------------------------------
export async function loadAll() {
  const [c, w, s] = await Promise.all([
    supabase.from('categories').select('*').order('position'),
    supabase.from('works').select('*, work_images(id, path, ratio, position)').order('position'),
    supabase.from('site_settings').select('data').eq('id', 1).maybeSingle(),
  ])
  const works = must(w).map((x) => ({
    ...x,
    work_images: [...(x.work_images || [])].sort((a, b) => a.position - b.position),
  }))
  return { categories: must(c), works, settings: must(s)?.data || {} }
}

// ---------------------------------------------------------------
// Imagens: o navegador converte para WebP e cria a miniatura antes de enviar
// ---------------------------------------------------------------
async function decode(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return img
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

const encode = (canvas, type, quality) => new Promise((res) => canvas.toBlob(res, type, quality))

export async function processImage(file, { max = 1600, thumb = 900 } = {}) {
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" não é uma imagem.`)
  let src
  try {
    src = await decode(file)
  } catch {
    throw new Error(`Não consegui abrir "${file.name}". Use JPG, PNG ou WebP.`)
  }
  const w0 = src.width || src.naturalWidth
  const h0 = src.height || src.naturalHeight

  const make = async (limit) => {
    const k = Math.min(1, limit / Math.max(w0, h0))
    const w = Math.max(1, Math.round(w0 * k))
    const h = Math.max(1, Math.round(h0 * k))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(src, 0, 0, w, h)
    let blob = await encode(canvas, 'image/webp', 0.82)
    if (!blob || blob.type !== 'image/webp') blob = await encode(canvas, 'image/jpeg', 0.86)
    return { blob, w, h }
  }

  const full = await make(max)
  const small = thumb ? await make(thumb) : null
  src.close?.()
  return {
    full: full.blob,
    thumb: small?.blob || null,
    ratio: Number((full.h / full.w).toFixed(3)),
    ext: full.blob.type === 'image/webp' ? 'webp' : 'jpg',
  }
}

export const thumbPath = (p) => p.replace(/([^/]+)$/, 'thumbs/$1')

async function put(path, blob) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false })
  if (error) throw error
}

// Envia a imagem (e a miniatura, se houver) com o mesmo nome base. Devolve o caminho.
export async function uploadProcessed(basePath, processed) {
  const path = `${basePath}.${processed.ext}`
  await put(path, processed.full)
  if (processed.thumb) await put(thumbPath(path), processed.thumb)
  return path
}

// Apaga arquivos e miniaturas. Falhar aqui não impede o resto, só deixa um arquivo órfão.
export async function removeFiles(paths) {
  const all = [...new Set(paths.filter(Boolean))].flatMap((p) => [p, thumbPath(p)])
  if (!all.length) return
  try {
    await supabase.storage.from(BUCKET).remove(all)
  } catch (e) {
    console.warn('Não consegui apagar alguns arquivos antigos.', e)
  }
}

export const previewUrl = (path) => storageUrl(thumbPath(path))
export { storageUrl }
