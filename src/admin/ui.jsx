import { useCallback, useEffect, useId, useRef, useState } from 'react'

// Aviso curto no canto da tela (ok / erro).
export function useToast() {
  const [toast, setToast] = useState(null)
  const timer = useRef(0)
  const show = useCallback((text, kind = 'ok') => {
    clearTimeout(timer.current)
    setToast({ text, kind, id: Date.now() })
    timer.current = setTimeout(() => setToast(null), kind === 'error' ? 7000 : 3200)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  const node = (
    <div className="a-toast-wrap" role="status" aria-live="polite">
      {toast && (
        <div className={`a-toast a-toast--${toast.kind}`} key={toast.id}>
          {toast.text}
        </div>
      )}
    </div>
  )
  return [show, node]
}

const stack = []
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

// Janela por cima da tela: Esc fecha, Tab fica dentro dela e o foco volta ao botão de origem.
export function Modal({ title, onClose, children, wide = false, footer }) {
  const ref = useRef(null)
  const titleId = useId()
  // Sempre a versão mais recente de onClose (o efeito abaixo roda uma vez só).
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const prev = document.activeElement
    const el = ref.current
    const me = {}
    stack.push(me)
    el?.querySelector('[data-autofocus]')?.focus() || el?.querySelector(FOCUSABLE)?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (stack[stack.length - 1] !== me) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      } else if (e.key === 'Tab' && el) {
        const items = [...el.querySelectorAll(FOCUSABLE)]
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      stack.splice(stack.indexOf(me), 1)
      if (!stack.length) document.body.style.overflow = ''
      prev?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="a-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`a-modal${wide ? ' a-modal--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <header className="a-modal__head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="a-icon" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <div className="a-modal__body">{children}</div>
        {footer && <footer className="a-modal__foot">{footer}</footer>}
      </div>
    </div>
  )
}

export function Confirm({ title, text, confirmLabel = 'Excluir', danger = true, busy = false, onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onCancel}
      footer={
        <>
          <button type="button" className="a-btn a-btn--ghost" onClick={onCancel} disabled={busy} data-autofocus>
            Cancelar
          </button>
          <button type="button" className={`a-btn ${danger ? 'a-btn--danger' : 'a-btn--primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Aguarde…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="a-text">{text}</p>
    </Modal>
  )
}

export function Field({ label, hint, children, className = '' }) {
  const id = useId()
  return (
    <div className={`a-field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {typeof children === 'function' ? children(id) : children}
      {hint && <small>{hint}</small>}
    </div>
  )
}

export const Empty = ({ children }) => <p className="a-empty">{children}</p>
