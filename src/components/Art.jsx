import { useLang } from '../i18n.jsx'
import { thumbUrl, url } from '../images.js'

const SHAPES = ['orb', 'moon', 'band', 'dots']
const HUES = [262, 276, 290, 248, 310, 270]

// Mostra a imagem real ou, enquanto não houver, um bloco colorido de exemplo.
// "thumb" usa a miniatura (grade); sem ela, a imagem inteira (tela cheia).
export default function Art({ src, title, index = 0, thumb = false, eager = false }) {
  const { t } = useLang()

  if (src) {
    const full = url(src)
    return (
      <img
        className="art"
        src={thumb ? thumbUrl(src) : full}
        alt={title}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable="false"
        onError={(e) => {
          // Sem miniatura (arquivo colocado à mão): usa a imagem inteira.
          if (e.currentTarget.dataset.fallback !== '1') {
            e.currentTarget.dataset.fallback = '1'
            e.currentTarget.src = full
          }
        }}
      />
    )
  }

  const shape = SHAPES[index % SHAPES.length]
  const hue = HUES[index % HUES.length]
  return (
    <div
      className={`art art--${shape}`}
      style={{ '--h': hue }}
      role="img"
      aria-label={`${title} ${t.exampleImage}`}
    />
  )
}
