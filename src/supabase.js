// Cliente completo do Supabase (login, escrita, envio de arquivos). Só o painel usa,
// por isso ele fica fora do pacote que o visitante baixa.
import { createClient } from '@supabase/supabase-js'
import { BUCKET, SUPABASE_KEY, SUPABASE_URL, hasSupabase, storageUrl } from './config.js'

export { BUCKET, hasSupabase, storageUrl }
export const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_KEY) : null
