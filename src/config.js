const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

export const SUPABASE_URL = url
export const SUPABASE_KEY = key
// Sem as duas variáveis no .env, o site funciona só com o conteúdo de content.js.
export const hasSupabase = Boolean(url && key)
export const BUCKET = 'portfolio'

// Endereço público de um arquivo guardado no Supabase Storage.
export const storageUrl = (path) => (path ? `${url}/storage/v1/object/public/${BUCKET}/${path}` : null)
