/**
 * Adiciona `dicas` (até 3 strings) em exercícios das trilhas com ordem de catálogo 1–7,
 * a partir de `dica` em PT/EN/ES quando `dicas` ainda não existe.
 * Uso: node scripts/migrate-dicas-content.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TRILHAS_DIR = path.join(__dirname, '..', 'content', 'trilhas')

const FILES = [
  '00-fundamentos.json',
  '02-manipulacao-dados.json',
  '01-select-basico.json',
  '02-filtragem.json',
  '03-orderby.json',
  '04-agregacoes.json',
  '05-groupby-having.json',
]

const SUFFIX = {
  pt: [
    ' Compare com o que o enunciado pede.',
    ' Revise sintaxe e nomes de colunas/tabelas do schema.',
  ],
  en: [
    ' Relate this directly to the problem statement.',
    ' Double-check syntax and column/table names from the schema.',
  ],
  es: [
    ' Relaciónalo con lo que pide el enunciado.',
    ' Revisa la sintaxis y los nombres de columnas/tablas del schema.',
  ],
}

/** @param {string} s @param {'pt'|'en'|'es'} lang */
function splitToThree(s, lang) {
  const t = (s || '').trim()
  if (!t) return []
  const sentences = t
    .split(/(?<=[.!?])\s+/)
    .map(x => x.trim())
    .filter(x => x.length > 0)
  const parts = sentences.map(x => (/[.!?]$/.test(x) ? x : `${x}.`))
  if (parts.length >= 3) return parts.slice(0, 3)
  if (parts.length === 2) return [parts[0], parts[1], parts[1]]
  const byComma = t.split(/,\s+/).map(x => x.trim()).filter(x => x.length > 12)
  if (byComma.length >= 3) return [byComma[0], byComma[1], byComma[2]]
  if (byComma.length === 2) return [byComma[0], byComma[1], t]
  const [a, b] = SUFFIX[lang] ?? SUFFIX.pt
  return [t, `${t}${a}`, `${t}${b}`]
}

/** @param {Record<string, unknown>} conteudo @param {'pt'|'en'|'es'} lang */
function ensureDicas(conteudo, lang) {
  if (!conteudo || typeof conteudo !== 'object') return
  const hasDicas = Array.isArray(conteudo.dicas) && conteudo.dicas.filter(Boolean).length > 0
  if (hasDicas) return
  const dica = typeof conteudo.dica === 'string' ? conteudo.dica : ''
  const dicas = splitToThree(dica, lang)
  if (dicas.length === 0) return
  conteudo.dicas = dicas
}

/** @param {Record<string, unknown>} etapa */
function walkEtapa(etapa) {
  if (etapa.tipo !== 'exercicio') return
  ensureDicas(/** @type {Record<string, unknown>} */ (etapa.conteudo), 'pt')
  const tr = etapa.traducoes
  if (!tr || typeof tr !== 'object') return
  for (const loc of ['en', 'es']) {
    const block = tr[loc]
    if (!block || typeof block !== 'object') continue
    const c = block.conteudo
    if (c && typeof c === 'object')
      ensureDicas(/** @type {Record<string, unknown>} */ (c), /** @type {'en'|'es'} */ (loc))
  }
}

for (const file of FILES) {
  const full = path.join(TRILHAS_DIR, file)
  if (!fs.existsSync(full)) {
    console.warn('skip missing', file)
    continue
  }
  const raw = fs.readFileSync(full, 'utf8')
  const data = JSON.parse(raw)
  for (const etapa of data.etapas || []) walkEtapa(etapa)
  fs.writeFileSync(full, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  console.log('updated', file)
}
