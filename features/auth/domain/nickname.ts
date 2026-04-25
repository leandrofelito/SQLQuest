// Lista de termos bloqueados em nicknames — PT-BR e EN
// A verificação ignora maiúsculas/minúsculas e underscores entre letras
const BLOCKED: string[] = [
  // Palavrões PT-BR
  'puta', 'puto', 'putinha', 'punheta', 'punheteiro',
  'viado', 'viadinho', 'veado',
  'buceta', 'bct', 'xoxota',
  'pau', 'piru', 'pica', 'piroca',
  'cu', 'cuzao', 'cuzão', 'cusao', 'cuzinho',
  'merda', 'mierda',
  'foda', 'fodase', 'fodasse', 'fodasе',
  'foder', 'fodedor',
  'corno', 'cornao', 'cornão',
  'caralho', 'krl', 'cacete',
  'otario', 'otário', 'otaria',
  'idiota', 'imbecil',
  'arrombado', 'arrombada',
  'babaca',
  'bosta', 'bostal',
  'desgraça', 'desgracado', 'desgraçado',
  'filho da puta', 'filhodaputa', 'fdp',
  'vai se foder', 'vaisefoder', 'vsf',
  'porra', 'porra1',
  'safado', 'safada',
  'sapatao', 'sapatão',
  'traveco',
  'negro', 'nega',   // contexto ofensivo
  'macaco', 'macaca',
  'gordo', 'gorda',
  'retardado', 'retardada',
  'escroto', 'escrota',
  'lixo',
  'cuzin',
  'pirocudo',
  'bucetuda',
  'xereca',
  'xana',
  'rola',
  'tesao', 'tesão',
  'gozar', 'gozo',
  'cuzinheiro',
  'racista',
  'nazista', 'nazi',
  'hitler',
  'pedofilo', 'pedófilo',
  // Palavrões EN (comuns em contexto online)
  'fuck', 'fucker', 'fucking', 'fuk',
  'shit', 'shat',
  'bitch', 'btch',
  'asshole', 'ass',
  'cunt',
  'cock', 'cok',
  'dick', 'dik',
  'pussy',
  'whore',
  'nigger', 'nigga',
  'faggot', 'fag',
  'retard',
  'nazi',
  'rape', 'rapist',
  'porn', 'porno',
  'sex', 'sexy',
  'cum', 'cumshot',
  'bastard',
  'motherfucker', 'mf',
  'penis', 'vagina', 'anus',
]

// Termos curtos/ambíguos que só bloqueiam quando formam um segmento isolado
// (separado por _ ou dígitos). Isso evita falsos positivos em nomes/palavras
// comuns — ex.: "pau" não bloqueia "paulo_sql", mas bloqueia "pau_gamer".
//
// Trade-off: "cu_123" é bloqueado; "xcux" não é (aceitável — não é ofensivo
// isolado). Termos longos e inequívocos ficam com matching de substring normal.
const BLOCKED_SEGMENTO_INTEIRO = new Set<string>([
  'cu',   // "curso", "acusar" → falsos positivos comuns
  'pau',  // "paulo", "paulista"
  'rola', // "carola", "controlar"
  'ass',  // "classic", "assassin"
  'fag',  // "fagundes" (sobrenome comum)
  'mf',   // abreviação — exige segmento próprio
])

// Normaliza removendo underscores e convertendo para minúsculas
function normalize(s: string): string {
  return s.toLowerCase().replace(/_/g, '')
}

// Divide o nickname em segmentos alfabéticos (separa por _ e sequências de dígitos)
// Ex.: "paulo_sql2" → ["paulo", "sql"]
function segmentos(s: string): string[] {
  return s.toLowerCase().split(/[_\d]+/).filter(Boolean)
}

export function contemPalavrão(nickname: string): boolean {
  const normalizado = normalize(nickname)
  const segs = segmentos(nickname)

  return BLOCKED.some(termo => {
    const termoNorm = normalize(termo)
    if (BLOCKED_SEGMENTO_INTEIRO.has(termoNorm)) {
      // Só bloqueia se algum segmento for exatamente esse termo
      return segs.some(seg => seg === termoNorm)
    }
    return normalizado.includes(termoNorm)
  })
}
