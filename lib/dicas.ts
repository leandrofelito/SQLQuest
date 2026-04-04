const BANCO: Record<string, string[]> = {
  syntax: [
    'Verifique se a ordem está correta: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY.',
    'Confira se não faltou alguma palavra-chave obrigatória.',
    'SQL não diferencia maiúsculas de minúsculas, mas a estrutura importa.',
    'Verifique se os parênteses estão balanceados.',
  ],
  colunas: [
    'Você está selecionando as colunas corretas?',
    'Verifique o nome exato das colunas — eles devem bater com a tabela.',
    'Pense: quais informações o exercício pediu para mostrar?',
    'Lembre-se que pode usar alias com AS para renomear colunas.',
  ],
  filtro: [
    'O seu WHERE está filtrando corretamente?',
    'Verifique o operador de comparação que você está usando.',
    'Para texto, use aspas simples. Para números, sem aspas.',
    'Pense em quantas linhas o resultado deveria ter.',
  ],
  vazio: [
    'Sua query retornou vazio. O filtro está muito restritivo?',
    'Tente executar sem o WHERE primeiro para ver os dados disponíveis.',
    'Verifique se o nome da tabela está correto.',
    'Confirme os valores exatos dos dados antes de filtrar.',
  ],
  agrupamento: [
    'Quando usar GROUP BY, todas as colunas do SELECT devem estar nele ou em uma função de agregação.',
    'Funções de agregação: COUNT, SUM, AVG, MIN, MAX.',
    'Pense em quais colunas você quer agrupar antes de calcular.',
    'HAVING filtra grupos — é diferente do WHERE.',
  ],
  join: [
    'Verifique qual coluna as duas tabelas têm em comum.',
    'A sintaxe é: FROM tabela1 JOIN tabela2 ON tabela1.coluna = tabela2.coluna',
    'Use aliases para abreviar os nomes das tabelas (ex: FROM pedidos p).',
    'INNER JOIN retorna só linhas que existem nas duas tabelas.',
  ],
  generico: [
    'Leia a instrução do exercício novamente com atenção.',
    'Comece pelo básico: qual tabela você precisa consultar?',
    'Você pode usar o resumo da lição anterior como referência.',
    'Pense passo a passo: o que você quer selecionar, de onde e com qual condição?',
  ],
}

export function getDica(tipo: keyof typeof BANCO = 'generico'): string {
  const lista = BANCO[tipo] ?? BANCO.generico
  return lista[Math.floor(Math.random() * lista.length)]
}

export function classificarErro(mensagem: string): keyof typeof BANCO {
  const m = mensagem.toLowerCase()
  if (m.includes('syntax') || m.includes('parse')) return 'syntax'
  if (m.includes('no such column') || m.includes('column')) return 'colunas'
  if (m.includes('no such table')) return 'generico'
  return 'generico'
}
