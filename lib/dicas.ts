const BANCO: Record<string, string[]> = {
  syntax: [
    'Erro de sintaxe: a ordem das cláusulas importa — SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY.',
    'Verifique se não esqueceu alguma palavra-chave obrigatória: FROM após SELECT, ON após JOIN, END para fechar CASE.',
    'Parênteses desbalanceados causam esse erro. Confirme que cada ( tem um ) correspondente.',
    'Separe colunas no SELECT com vírgula, mas não coloque vírgula depois da última coluna antes do FROM.',
  ],
  colunas: [
    'O banco não reconheceu essa coluna. Verifique o nome exato no schema do exercício — letras maiúsculas e acentos importam.',
    'Confira se o nome da coluna bate com o schema: "Nome" é diferente de "nome" ou "NOME".',
    'Se estiver usando JOIN, você precisa qualificar: tabela.coluna (ex: c.Nome, p.Valor) para evitar ambiguidade.',
    'Essa coluna não existe nessa tabela. Veja o schema do exercício e confira quais colunas estão disponíveis.',
  ],
  filtro: [
    'Revise o operador: = (igual exato), > (maior que), < (menor que), LIKE (padrão de texto), IN (lista de valores).',
    'Texto em SQL usa aspas simples: WHERE cidade = \'São Paulo\'. Números não precisam de aspas: WHERE id = 3.',
    'Revise a lógica: AND exige que AMBAS as condições sejam verdadeiras; OR exige pelo menos UMA.',
    'Tente executar sem o WHERE para ver todos os dados disponíveis e confirmar o valor exato que você quer filtrar.',
  ],
  vazio: [
    'Resultado vazio — o filtro está muito restritivo. Remova o WHERE temporariamente para ver se há dados na tabela.',
    'Verifique se o valor no WHERE bate exatamente com os dados: maiúsculas, espaços e acentos fazem diferença.',
    'Se usou JOIN, talvez nenhuma linha coincida nas duas tabelas. Tente LEFT JOIN para identificar quais registros ficam sem par.',
    'Confirme que está consultando a tabela correta. Veja o schema e os dados de exemplo do exercício.',
  ],
  agrupamento: [
    'Toda coluna no SELECT que não é uma função de agregação (SUM, COUNT, AVG...) deve aparecer no GROUP BY também.',
    'HAVING filtra grupos DEPOIS do GROUP BY. WHERE filtra linhas ANTES. Não os confunda — cada um tem seu lugar.',
    'Você está agrupando pela coluna certa? A coluna do GROUP BY deve ser a mesma que aparece no SELECT sem agregação.',
    'Funções de agregação disponíveis: COUNT (contar), SUM (somar), AVG (média), MIN (mínimo), MAX (máximo).',
  ],
  join: [
    'O ON define o elo entre as tabelas: normalmente a chave primária de uma = chave estrangeira da outra.',
    'INNER JOIN só retorna registros com correspondência nas duas tabelas. LEFT JOIN inclui todos da tabela da esquerda, mesmo sem par.',
    'Use aliases para clareza: FROM Clientes c JOIN Pedidos p ON c.ClienteID = p.ClienteID — fica mais curto e legível.',
    'Verifique se o ON está comparando as colunas corretas — procure o campo ID que aparece em ambas as tabelas.',
  ],
  generico: [
    'Releia o enunciado: qual tabela usar, quais colunas retornar, qual filtro ou agrupamento aplicar?',
    'Comece simples: SELECT * FROM tabela — veja os dados, depois adicione filtros e colunas específicas.',
    'Divida o problema: 1) De qual tabela? 2) Quais colunas? 3) Com qual condição ou ordenação?',
    'Veja o schema do exercício para confirmar os nomes exatos das tabelas e colunas disponíveis.',
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
