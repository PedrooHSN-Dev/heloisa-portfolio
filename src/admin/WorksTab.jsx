import { useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase.js'
import { friendly, must, previewUrl, processImage, removeFiles, storageUrl, uid, uploadProcessed } from './api.js'
import { Confirm, Empty, Field, Modal } from './ui.jsx'

export default function WorksTab({ data, reload, toast }) {
  const { categories, works } = data
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | projeto
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label_pt])), [categories])
  const list = works
    .filter((w) => !filter || w.category_id === filter)
    .sort((a, b) => (a.category_id === b.category_id ? a.position - b.position : categories.findIndex((c) => c.id === a.category_id) - categories.findIndex((c) => c.id === b.category_id)))

  const move = async (w, d) => {
    const sibs = works.filter((x) => x.category_id === w.category_id).sort((a, b) => a.position - b.position)
    const i = sibs.findIndex((x) => x.id === w.id)
    const j = i + d
    if (j < 0 || j >= sibs.length) return
    ;[sibs[i], sibs[j]] = [sibs[j], sibs[i]]
    try {
      await Promise.all(
        sibs
          .map((x, n) => ({ x, pos: n + 1 }))
          .filter(({ x, pos }) => x.position !== pos)
          .map(({ x, pos }) => supabase.from('works').update({ position: pos }).eq('id', x.id).then(must)),
      )
      await reload()
    } catch (e) {
      toast(friendly(e), 'error')
    }
  }

  const togglePublished = async (w) => {
    if (!w.published && w.work_images.length === 0) return toast('Adicione ao menos uma imagem antes de publicar.', 'error')
    try {
      must(await supabase.from('works').update({ published: !w.published }).eq('id', w.id))
      toast(w.published ? 'Projeto escondido do site (rascunho).' : 'Projeto publicado.')
      await reload()
    } catch (e) {
      toast(friendly(e), 'error')
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      must(await supabase.from('works').delete().eq('id', deleting.id))
      await removeFiles(deleting.work_images.map((i) => i.path))
      toast('Projeto excluído.')
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
          <h2 className="a-h2">Projetos</h2>
          <p className="a-text">Cada projeto pode ter várias imagens. A primeira é a capa na grade.</p>
        </div>
        <button
          type="button"
          className="a-btn a-btn--primary"
          onClick={() => (categories.length ? setEditing('new') : toast('Crie uma coleção antes de adicionar projetos.', 'error'))}
        >
          Novo projeto
        </button>
      </div>

      {categories.length > 0 && (
        <div className="a-filter">
          <label htmlFor="flt">Coleção</label>
          <select id="flt" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label_pt}</option>
            ))}
          </select>
          {!filter && works.length > 1 && <small className="a-muted">Escolha uma coleção para mudar a ordem.</small>}
        </div>
      )}

      {categories.length === 0 && <Empty>Crie uma coleção na aba "Coleções" para começar.</Empty>}
      {categories.length > 0 && list.length === 0 && <Empty>Nenhum projeto aqui ainda.</Empty>}

      <ul className="a-cards">
        {list.map((w) => {
          const first = list.filter((x) => x.category_id === w.category_id)
          const idx = first.findIndex((x) => x.id === w.id)
          const cover = w.work_images[0]?.path
          return (
            <li className="a-card-work" key={w.id}>
              <div className="a-thumb">{cover ? <img src={previewUrl(cover)} alt="" loading="lazy" onError={(e) => (e.currentTarget.src = storageUrl(cover))} /> : <span>sem imagem</span>}</div>
              <div className="a-card-work__body">
                <strong>{w.title_pt}</strong>
                <span className="a-muted">
                  {catName[w.category_id]} · {w.work_images.length} {w.work_images.length === 1 ? 'imagem' : 'imagens'}
                </span>
                <span className={`a-badge ${w.published ? 'a-badge--on' : ''}`}>{w.published ? 'Publicado' : 'Rascunho'}</span>
              </div>
              <div className="a-card-work__actions">
                {filter && (
                  <>
                    <button type="button" className="a-icon" onClick={() => move(w, -1)} disabled={idx === 0} aria-label={`Mover ${w.title_pt} para antes`}>↑</button>
                    <button type="button" className="a-icon" onClick={() => move(w, 1)} disabled={idx === first.length - 1} aria-label={`Mover ${w.title_pt} para depois`}>↓</button>
                  </>
                )}
                <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setEditing(w)}>Editar</button>
                <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => togglePublished(w)}>{w.published ? 'Esconder' : 'Publicar'}</button>
                <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--warn" onClick={() => setDeleting(w)}>Excluir</button>
              </div>
            </li>
          )
        })}
      </ul>

      {editing && (
        <WorkEditor
          work={editing === 'new' ? null : editing}
          works={works}
          categories={categories}
          defaultCategory={filter || categories[0]?.id}
          onClose={() => setEditing(null)}
          onSaved={async (msg) => {
            setEditing(null)
            toast(msg)
            await reload()
          }}
        />
      )}

      {deleting && (
        <Confirm
          title={`Excluir "${deleting.title_pt}"?`}
          text={'O projeto e as imagens dele serão apagados. Não dá para desfazer. Se só quer tirar do site por um tempo, use "Esconder".'}
          busy={busy}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  )
}

function WorkEditor({ work, works, categories, defaultCategory, onClose, onSaved }) {
  const isNew = !work
  const [f, setF] = useState({
    category_id: work?.category_id || defaultCategory,
    title_pt: work?.title_pt || '',
    title_en: work?.title_en || '',
    description_pt: work?.description_pt || '',
    description_en: work?.description_en || '',
    published: work ? work.published : true,
  })
  // Cada item: { id, path?, ratio, preview, processed? }. Itens com "processed" ainda não foram enviados.
  const [images, setImages] = useState(() =>
    (work?.work_images || []).map((i) => ({ id: i.id, path: i.path, ratio: Number(i.ratio) || null, preview: previewUrl(i.path), full: storageUrl(i.path) })),
  )
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preparing, setPreparing] = useState(0)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [askDiscard, setAskDiscard] = useState(false)
  const workId = useRef(work?.id || uid())

  const set = (k) => (e) => {
    setDirty(true)
    setF((s) => ({ ...s, [k]: e.target.value }))
  }

  const addFiles = async (fileList) => {
    const files = [...fileList].filter(Boolean)
    if (!files.length) return
    setError('')
    setPreparing((n) => n + files.length)
    const problems = []
    for (const file of files) {
      try {
        const processed = await processImage(file)
        setImages((list) => [...list, { id: uid(), ratio: processed.ratio, preview: URL.createObjectURL(processed.thumb || processed.full), processed }])
        setDirty(true)
      } catch (e) {
        problems.push(friendly(e))
      } finally {
        setPreparing((n) => n - 1)
      }
    }
    if (problems.length) setError(problems.join(' '))
  }

  const moveImg = (i, d) => {
    setImages((list) => {
      const l = [...list]
      const j = i + d
      if (j < 0 || j >= l.length) return list
      ;[l[i], l[j]] = [l[j], l[i]]
      return l
    })
    setDirty(true)
  }
  const dropImg = (i) => {
    setImages((list) => list.filter((_, n) => n !== i))
    setDirty(true)
  }

  const requestClose = () => (dirty ? setAskDiscard(true) : onClose())

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (!f.title_pt.trim()) return setError('Dê um título ao projeto.')
    if (preparing) return setError('Aguarde as imagens terminarem de ser preparadas.')
    if (f.published && images.length === 0) return setError('Para publicar, adicione ao menos uma imagem. Ou desmarque "Visível no site" para salvar como rascunho.')
    setBusy(true)
    const uploaded = []
    try {
      // 1) Envia as imagens novas.
      const fresh = images.filter((i) => i.processed)
      for (let n = 0; n < fresh.length; n++) {
        setProgress(`Enviando imagem ${n + 1} de ${fresh.length}…`)
        const item = fresh[n]
        item.path = await uploadProcessed(`works/${workId.current}/${item.id}`, item.processed)
        uploaded.push(item.path)
      }
      setProgress('Salvando…')
      // 2) Projeto.
      const sameCat = work && work.category_id === f.category_id
      const siblings = works.filter((w) => w.category_id === f.category_id)
      const position = sameCat ? work.position : Math.max(0, ...siblings.map((w) => w.position)) + 1
      must(
        await supabase.from('works').upsert({
          id: workId.current,
          category_id: f.category_id,
          title_pt: f.title_pt.trim(),
          title_en: f.title_en.trim() || null,
          description_pt: f.description_pt.trim() || null,
          description_en: f.description_en.trim() || null,
          published: f.published,
          position,
        }),
      )
      // 3) Imagens na ordem atual.
      if (images.length) {
        must(
          await supabase.from('work_images').upsert(
            images.map((i, n) => ({ id: i.id, work_id: workId.current, path: i.path, ratio: i.ratio, position: n + 1 })),
          ),
        )
      }
      // 4) Remove as que saíram.
      const keep = new Set(images.map((i) => i.id))
      const gone = (work?.work_images || []).filter((i) => !keep.has(i.id))
      if (gone.length) {
        must(await supabase.from('work_images').delete().in('id', gone.map((g) => g.id)))
        await removeFiles(gone.map((g) => g.path))
      }
      await onSaved(isNew ? (f.published ? 'Projeto criado e publicado.' : 'Rascunho salvo.') : 'Projeto salvo.')
    } catch (err) {
      // Não deixa arquivos soltos de um envio que não terminou.
      if (isNew || uploaded.length) await removeFiles(uploaded)
      setError(friendly(err))
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <>
      <Modal
        wide
        title={isNew ? 'Novo projeto' : 'Editar projeto'}
        onClose={busy ? () => {} : requestClose}
        footer={
          <>
            <span className="a-progress" aria-live="polite">{progress}</span>
            <button type="button" className="a-btn a-btn--ghost" onClick={requestClose} disabled={busy}>Cancelar</button>
            <button type="submit" form="work-form" className="a-btn a-btn--primary" disabled={busy || preparing > 0}>
              {busy ? 'Salvando…' : f.published ? 'Salvar' : 'Salvar rascunho'}
            </button>
          </>
        }
      >
        <form id="work-form" onSubmit={save} className="a-form">
          <div className="a-grid2">
            <Field label="Coleção">
              {(id) => (
                <select id={id} value={f.category_id} onChange={set('category_id')}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.label_pt}</option>
                  ))}
                </select>
              )}
            </Field>
            <div className="a-field">
              <span className="a-label">Visibilidade</span>
              <label className="a-check">
                <input type="checkbox" checked={f.published} onChange={(e) => { setDirty(true); setF((s) => ({ ...s, published: e.target.checked })) }} />
                Visível no site
              </label>
              <small>Desmarcado, fica como rascunho e só aparece aqui no painel.</small>
            </div>
            <Field label="Título (português)">{(id) => <input id={id} value={f.title_pt} onChange={set('title_pt')} data-autofocus required />}</Field>
            <Field label="Título (inglês)" hint="Se ficar vazio, o site usa o título em português.">{(id) => <input id={id} value={f.title_en} onChange={set('title_en')} />}</Field>
            <Field label="Descrição (português)" hint="Opcional. Aparece na tela cheia do projeto.">{(id) => <textarea id={id} rows={4} value={f.description_pt} onChange={set('description_pt')} />}</Field>
            <Field label="Descrição (inglês)">{(id) => <textarea id={id} rows={4} value={f.description_en} onChange={set('description_en')} />}</Field>
          </div>

          <div className="a-field">
            <span className="a-label">Imagens</span>
            <div
              className={`a-drop${dragging ? ' a-drop--on' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
            >
              <label className="a-btn a-btn--ghost a-file">
                Adicionar imagens
                <input type="file" accept="image/*" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
              </label>
              <span className="a-muted">ou arraste os arquivos para cá. JPG, PNG ou WebP; o painel já otimiza tudo.</span>
            </div>
            {preparing > 0 && <p className="a-info" role="status">Preparando {preparing} {preparing === 1 ? 'imagem' : 'imagens'}…</p>}
            {images.length > 0 && (
              <ol className="a-imgs">
                {images.map((img, i) => (
                  <li className="a-img" key={img.id}>
                    <img src={img.preview} alt={`Imagem ${i + 1}`} onError={(e) => img.full && (e.currentTarget.src = img.full)} />
                    {i === 0 && <span className="a-img__cover">Capa</span>}
                    <div className="a-img__bar">
                      <button type="button" className="a-icon" onClick={() => moveImg(i, -1)} disabled={i === 0} aria-label={`Mover imagem ${i + 1} para antes`}>←</button>
                      <button type="button" className="a-icon" onClick={() => moveImg(i, 1)} disabled={i === images.length - 1} aria-label={`Mover imagem ${i + 1} para depois`}>→</button>
                      <button type="button" className="a-icon a-icon--warn" onClick={() => dropImg(i)} aria-label={`Remover imagem ${i + 1}`}>×</button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
          {error && <p className="a-error" role="alert">{error}</p>}
        </form>
      </Modal>
      {askDiscard && (
        <Confirm
          title="Descartar alterações?"
          text="Você mexeu neste projeto e ainda não salvou. Se sair agora, as mudanças serão perdidas."
          confirmLabel="Descartar"
          onConfirm={onClose}
          onCancel={() => setAskDiscard(false)}
        />
      )}
    </>
  )
}
