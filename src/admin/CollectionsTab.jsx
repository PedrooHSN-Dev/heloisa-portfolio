import { useState } from 'react'
import { supabase } from '../supabase.js'
import { friendly, must, previewUrl, processImage, removeFiles, slugify, uploadProcessed } from './api.js'
import { Confirm, Empty, Field, Modal } from './ui.jsx'

// Reescreve as posições 1..n e grava só as que mudaram.
async function renumber(table, rows) {
  const jobs = rows
    .map((r, i) => ({ r, pos: i + 1 }))
    .filter(({ r, pos }) => r.position !== pos)
    .map(({ r, pos }) => supabase.from(table).update({ position: pos }).eq('id', r.id).then(must))
  await Promise.all(jobs)
}

export default function CollectionsTab({ data, reload, toast }) {
  const { categories, works } = data
  const [editing, setEditing] = useState(null) // null | 'new' | categoria
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const move = async (index, d) => {
    const list = [...categories]
    const j = index + d
    if (j < 0 || j >= list.length) return
    ;[list[index], list[j]] = [list[j], list[index]]
    try {
      await renumber('categories', list)
      await reload()
    } catch (e) {
      toast(friendly(e), 'error')
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      const files = works.filter((w) => w.category_id === deleting.id).flatMap((w) => w.work_images.map((i) => i.path))
      must(await supabase.from('categories').delete().eq('id', deleting.id))
      await removeFiles([...files, deleting.cover_path])
      toast('Coleção excluída.')
      setDeleting(null)
      await reload()
    } catch (e) {
      toast(friendly(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="a-section">
      <div className="a-bar">
        <div>
          <h2 className="a-h2">Coleções</h2>
          <p className="a-text">As coleções são os grandes grupos do site (Posts, Desenhos…). A ordem daqui é a ordem no site.</p>
        </div>
        <button type="button" className="a-btn a-btn--primary" onClick={() => setEditing('new')}>
          Nova coleção
        </button>
      </div>

      {categories.length === 0 && <Empty>Nenhuma coleção ainda. Crie a primeira.</Empty>}
      <ul className="a-list">
        {categories.map((c, i) => {
          const ws = works.filter((w) => w.category_id === c.id)
          const pub = ws.filter((w) => w.published).length
          const cover = c.cover_path || ws[0]?.work_images[0]?.path
          return (
            <li className="a-row" key={c.id}>
              <div className="a-thumb a-thumb--sm">{cover ? <img src={previewUrl(cover)} alt="" loading="lazy" /> : <span>sem capa</span>}</div>
              <div className="a-row__main">
                <strong>{c.label_pt}</strong>
                <span className="a-muted">
                  {ws.length === 0 ? 'Sem projetos' : `${pub} publicado${pub === 1 ? '' : 's'}${ws.length > pub ? `, ${ws.length - pub} rascunho${ws.length - pub === 1 ? '' : 's'}` : ''}`}
                  {pub === 0 && ' · não aparece no site'}
                </span>
              </div>
              <div className="a-row__actions">
                <button type="button" className="a-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Subir ${c.label_pt}`}>↑</button>
                <button type="button" className="a-icon" onClick={() => move(i, 1)} disabled={i === categories.length - 1} aria-label={`Descer ${c.label_pt}`}>↓</button>
                <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setEditing(c)}>Editar</button>
                <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--warn" onClick={() => setDeleting(c)}>Excluir</button>
              </div>
            </li>
          )
        })}
      </ul>

      {editing && (
        <CollectionForm
          category={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            toast('Coleção salva.')
            await reload()
          }}
          toast={toast}
        />
      )}

      {deleting && (
        <Confirm
          title={`Excluir "${deleting.label_pt}"?`}
          text={(() => {
            const n = works.filter((w) => w.category_id === deleting.id).length
            return n
              ? `Isso também apaga os ${n} projeto${n === 1 ? '' : 's'} desta coleção e todas as imagens deles. Não dá para desfazer.`
              : 'Esta coleção não tem projetos. Não dá para desfazer.'
          })()}
          busy={busy}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  )
}

function CollectionForm({ category, categories, onClose, onSaved, toast }) {
  const isNew = !category
  const [f, setF] = useState({
    label_pt: category?.label_pt || '',
    label_en: category?.label_en || '',
    description_pt: category?.description_pt || '',
    description_en: category?.description_en || '',
    max_cols: category?.max_cols ? String(category.max_cols) : '',
  })
  const [cover, setCover] = useState(null) // { processed, preview } | 'remove' | null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const processed = await processImage(file, { max: 1200, thumb: 700 })
      setCover({ processed, preview: URL.createObjectURL(processed.thumb) })
    } catch (err) {
      setError(friendly(err))
    }
  }

  const shownCover = cover === 'remove' ? null : cover?.preview || (category?.cover_path ? previewUrl(category.cover_path) : null)

  const save = async (e) => {
    e.preventDefault()
    setError('')
    const name = f.label_pt.trim()
    if (!name) return setError('Dê um nome para a coleção.')
    let id = category?.id
    if (isNew) {
      const base = slugify(name) || 'colecao'
      const used = new Set(categories.map((c) => c.id))
      id = base
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`
    }
    setBusy(true)
    try {
      let cover_path = category?.cover_path || null
      let oldCover = null
      if (cover === 'remove') {
        oldCover = cover_path
        cover_path = null
      } else if (cover?.processed) {
        oldCover = cover_path
        cover_path = await uploadProcessed(`capas/${id}-${Date.now()}`, cover.processed)
      }
      const row = {
        label_pt: name,
        label_en: f.label_en.trim() || null,
        description_pt: f.description_pt.trim() || null,
        description_en: f.description_en.trim() || null,
        max_cols: f.max_cols ? Number(f.max_cols) : null,
        cover_path,
      }
      if (isNew) {
        must(await supabase.from('categories').insert({ id, ...row, position: Math.max(0, ...categories.map((c) => c.position)) + 1 }))
      } else {
        must(await supabase.from('categories').update(row).eq('id', id))
      }
      if (oldCover && oldCover !== cover_path) await removeFiles([oldCover])
      await onSaved()
    } catch (err) {
      setError(friendly(err))
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isNew ? 'Nova coleção' : `Editar "${category.label_pt}"`}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="a-btn a-btn--ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" form="coll-form" className="a-btn a-btn--primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
        </>
      }
    >
      <form id="coll-form" onSubmit={save} className="a-form">
        <div className="a-grid2">
          <Field label="Nome (português)">{(id) => <input id={id} value={f.label_pt} onChange={set('label_pt')} data-autofocus required />}</Field>
          <Field label="Nome (inglês)" hint="Se ficar vazio, o site usa o nome em português.">{(id) => <input id={id} value={f.label_en} onChange={set('label_en')} />}</Field>
          <Field label="Frase curta (português)" hint="Aparece embaixo do título, dentro da coleção.">{(id) => <textarea id={id} rows={2} value={f.description_pt} onChange={set('description_pt')} />}</Field>
          <Field label="Frase curta (inglês)">{(id) => <textarea id={id} rows={2} value={f.description_en} onChange={set('description_en')} />}</Field>
        </div>
        <Field label="Colunas dentro da coleção" hint="Peças largas, como banners, ficam melhores em 1 ou 2 colunas.">
          {(id) => (
            <select id={id} value={f.max_cols} onChange={set('max_cols')}>
              <option value="">Automático</option>
              <option value="1">No máximo 1</option>
              <option value="2">No máximo 2</option>
              <option value="3">No máximo 3</option>
            </select>
          )}
        </Field>
        <div className="a-field">
          <span className="a-label">Capa do cartão</span>
          <div className="a-cover">
            <div className="a-thumb">{shownCover ? <img src={shownCover} alt="Capa atual" /> : <span>usa a 1ª imagem</span>}</div>
            <div className="a-cover__btns">
              <label className="a-btn a-btn--ghost a-btn--sm a-file">
                Escolher imagem
                <input type="file" accept="image/*" onChange={pick} />
              </label>
              {(cover?.preview || category?.cover_path) && cover !== 'remove' && (
                <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setCover('remove')}>Usar a 1ª imagem da coleção</button>
              )}
            </div>
          </div>
        </div>
        {error && <p className="a-error" role="alert">{error}</p>}
      </form>
    </Modal>
  )
}
