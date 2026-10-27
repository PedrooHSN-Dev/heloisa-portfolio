#!/usr/bin/env node
// Prepara as imagens do site.
//
//   Entrada:  pasta "originais/"  (fotos e artes em JPG, PNG, WebP, AVIF ou TIFF, do tamanho que vierem)
//   Saída:    pasta "public/"     (mesma estrutura de pastas, em WebP)
//
// Para cada imagem dentro de uma subpasta, gera:
//   - a imagem final, com no máximo 1600 px no lado maior (usada em tela cheia)
//   - uma miniatura de 900 px de largura em "thumbs/" (usada na grade, bem mais leve)
// Imagens soltas na raiz de "originais/" (como a foto de perfil) não ganham miniatura.
//
// Também grava "src/imageMeta.json" com o formato (altura ÷ largura) de cada imagem,
// para a grade montar o mosaico sem baixar as imagens antes.
//
// Uso:
//   npm run imagens              só processa o que é novo ou mudou
//   npm run imagens -- --force   refaz tudo

import { existsSync } from 'node:fs'
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)
const force = args.includes('--force')
const [srcArg, outArg] = args.filter((a) => !a.startsWith('--'))

const SRC = path.resolve(srcArg || 'originais')
const OUT = path.resolve(outArg || 'public')
const META = path.resolve(process.env.IMAGE_META || 'src/imageMeta.json')

const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff'])
const FULL_MAX = 1600
const THUMB_WIDTH = 900

// Nomes sem acento, espaço ou maiúscula: "Café Aurora Final.JPG" vira "cafe-aurora-final.webp".
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'imagem'

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1)

async function walk(dir) {
  const found = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...(await walk(full)))
    else if (EXT.has(path.extname(entry.name).toLowerCase())) found.push(full)
  }
  return found
}

if (!existsSync(SRC)) {
  console.error(`Não encontrei a pasta: ${SRC}`)
  console.error('Crie a pasta "originais" na raiz do projeto e coloque as imagens dentro dela.')
  process.exit(1)
}

const files = (await walk(SRC)).sort()
if (!files.length) {
  console.log(`Nenhuma imagem encontrada em ${SRC}.`)
  console.log('Coloque os arquivos em subpastas, por exemplo: originais/projetos/meu-post.jpg')
  process.exit(0)
}

const meta = {}
const seen = new Map()
const paths = []
let before = 0
let after = 0
let made = 0
let skipped = 0

for (const file of files) {
  const rel = path.relative(SRC, file)
  const parts = rel.split(path.sep)
  const base = slug(path.parse(parts.pop()).name)
  const dirs = parts.map(slug)
  const outRel = [...dirs, `${base}.webp`].join('/')

  if (seen.has(outRel)) {
    console.warn(`Aviso: "${rel}" daria o mesmo nome de "${seen.get(outRel)}". Foi ignorada; renomeie um dos dois.`)
    continue
  }
  seen.set(outRel, rel)

  const outFull = path.join(OUT, ...outRel.split('/'))
  const outThumb = dirs.length ? path.join(OUT, ...dirs, 'thumbs', `${base}.webp`) : null

  const srcStat = await stat(file)
  before += srcStat.size

  const upToDate =
    !force &&
    existsSync(outFull) &&
    (await stat(outFull)).mtimeMs >= srcStat.mtimeMs &&
    (!outThumb || existsSync(outThumb))

  if (upToDate) {
    skipped++
  } else {
    try {
      const image = sharp(file).rotate() // respeita a orientação da câmera
      await mkdir(path.dirname(outFull), { recursive: true })
      await image
        .clone()
        .resize({ width: FULL_MAX, height: FULL_MAX, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outFull)
      if (outThumb) {
        await mkdir(path.dirname(outThumb), { recursive: true })
        await image
          .clone()
          .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toFile(outThumb)
      }
      made++
    } catch (err) {
      console.warn(`Aviso: não consegui processar "${rel}" (${err.message}).`)
      seen.delete(outRel)
      continue
    }
  }

  const { width, height } = await sharp(outFull).metadata()
  meta[outRel] = { ratio: Math.round((height / width) * 1000) / 1000 }
  after += (await stat(outFull)).size
  paths.push(outRel)
}

await mkdir(path.dirname(META), { recursive: true })
const sorted = Object.fromEntries(Object.entries(meta).sort(([a], [b]) => a.localeCompare(b)))
await writeFile(META, JSON.stringify(sorted, null, 2) + '\n')

console.log('')
console.log(`Pronto: ${paths.length} imagens (${made} novas ou atualizadas, ${skipped} já estavam em dia).`)
console.log(`Tamanho: ${mb(before)} MB nos originais → ${mb(after)} MB no site.`)
console.log('')
console.log('Use estes caminhos no content.js:')
for (const p of paths) console.log(`  '${p}'`)
