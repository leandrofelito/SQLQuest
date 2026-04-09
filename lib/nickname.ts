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

// Normaliza removendo underscores e convertendo para minúsculas
function normalize(s: string): string {
  return s.toLowerCase().replace(/_/g, '')
}

export function contemPalavrão(nickname: string): boolean {
  const normalizado = normalize(nickname)
  return BLOCKED.some(termo => normalizado.includes(normalize(termo)))
}
