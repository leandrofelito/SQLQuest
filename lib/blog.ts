export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readTime: number
  tags: string[]
  content: string
}

const posts: BlogPost[] = [
  {
    slug: 'o-que-e-sql',
    title: 'O que é SQL? Guia completo para iniciantes',
    description:
      'Descubra o que é SQL, para que serve, onde é usado e por que aprender essa linguagem é essencial para qualquer profissional de tecnologia ou dados.',
    date: '2026-02-05',
    readTime: 7,
    tags: ['iniciante', 'fundamentos'],
    content: `
<p>SQL (Structured Query Language) é a linguagem padrão para comunicação com bancos de dados relacionais. Com ela, você cria, consulta, modifica e exclui dados armazenados em sistemas como PostgreSQL, MySQL, SQLite e SQL Server. Criada na década de 1970 pela IBM, o SQL se tornou um padrão ANSI/ISO e permanece, mais de cinquenta anos depois, como uma das habilidades técnicas mais demandadas do mercado.</p>

<h2>Por que o SQL ainda é tão relevante?</h2>

<p>Em um mundo dominado por linguagens modernas e frameworks sofisticados, o SQL mantém sua posição central por uma razão simples: quase todo software guarda dados em algum lugar, e esses dados vivem em bancos de dados relacionais. De aplicativos mobile a sistemas bancários, do e-commerce ao setor público, o SQL é a ponte entre o código da aplicação e os dados que ela precisa.</p>

<p>Segundo o Stack Overflow Developer Survey, SQL aparece consistentemente entre as tecnologias mais utilizadas por desenvolvedores — à frente de muitas linguagens de programação modernas. Engenheiros de dados, analistas de BI, desenvolvedores backend e cientistas de dados usam SQL diariamente.</p>

<h2>O que você pode fazer com SQL?</h2>

<ul>
  <li><strong>Consultar dados:</strong> buscar, filtrar e ordenar informações de tabelas</li>
  <li><strong>Inserir dados:</strong> adicionar novas linhas a uma tabela com <code>INSERT</code></li>
  <li><strong>Atualizar dados:</strong> modificar registros existentes com <code>UPDATE</code></li>
  <li><strong>Excluir dados:</strong> remover registros de forma seletiva com <code>DELETE</code></li>
  <li><strong>Criar estruturas:</strong> definir tabelas, índices e views com comandos DDL</li>
  <li><strong>Controlar acessos:</strong> gerenciar permissões de usuários no banco com <code>GRANT</code> e <code>REVOKE</code></li>
</ul>

<h2>Os quatro grupos de comandos SQL</h2>

<h3>DML — Data Manipulation Language</h3>
<p>São os comandos do dia a dia: <code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code> e <code>DELETE</code>. Com eles você lê e modifica os dados dentro das tabelas.</p>

<h3>DDL — Data Definition Language</h3>
<p>Define a estrutura do banco: <code>CREATE TABLE</code>, <code>ALTER TABLE</code>, <code>DROP TABLE</code>. Esses comandos moldam o "esqueleto" do banco de dados — colunas, tipos, restrições e relacionamentos.</p>

<h3>DCL — Data Control Language</h3>
<p>Controla quem pode fazer o quê: <code>GRANT</code> (conceder permissão) e <code>REVOKE</code> (revogar permissão). Essencial para segurança em ambientes de produção com múltiplos usuários.</p>

<h3>TCL — Transaction Control Language</h3>
<p>Gerencia transações: <code>COMMIT</code> (confirmar alterações) e <code>ROLLBACK</code> (desfazer alterações). Garante integridade dos dados mesmo em operações complexas que envolvem múltiplas tabelas.</p>

<h2>Seu primeiro comando SQL</h2>

<p>A sintaxe básica de uma consulta SQL é surpreendentemente legível — quase como escrever em inglês:</p>

<pre><code>SELECT nome, email
FROM usuarios
WHERE ativo = true
ORDER BY nome ASC;</code></pre>

<p>Traduzindo: "selecione o nome e o email da tabela usuarios, apenas dos usuários ativos, ordenados por nome em ordem crescente." Em poucas linhas, você define exatamente o que quer e o banco de dados cuida de como buscar.</p>

<h2>SQL x NoSQL: quando usar cada um?</h2>

<p>Bancos de dados NoSQL (como MongoDB, Redis ou Cassandra) têm seus casos de uso específicos — dados muito variáveis, escala extrema, ou modelos de acesso muito específicos. Porém, bancos relacionais com SQL continuam sendo a escolha padrão para a maioria dos sistemas por oferecerem:</p>

<ul>
  <li><strong>Integridade dos dados</strong> com constraints e chaves estrangeiras</li>
  <li><strong>Transações ACID</strong> que garantem consistência mesmo em falhas</li>
  <li><strong>Consultas flexíveis</strong> sem precisar pensar na estrutura de acesso antecipadamente</li>
  <li><strong>Maturidade</strong> de 50+ anos com ferramentas, documentação e comunidade robustas</li>
</ul>

<p>Para a maioria das aplicações web, sistemas corporativos e projetos de análise de dados, SQL é a escolha mais segura, mais produtiva e com menor curva de aprendizado a longo prazo.</p>

<h2>Como aprender SQL de forma eficiente</h2>

<p>A melhor forma de aprender SQL é praticando — e não apenas lendo sobre ele. O segredo está em escrever queries reais, cometer erros e entender o que aconteceu. A memorização de sintaxe vem naturalmente com a repetição.</p>

<p>Comece pelos fundamentos: <code>SELECT</code>, <code>WHERE</code>, <code>ORDER BY</code> e <code>GROUP BY</code>. Quando esses conceitos estiverem sólidos, avance para JOINs, subqueries e funções de janela (window functions). Em poucas semanas de prática consistente, você estará escrevendo queries que resolvem problemas reais no trabalho.</p>

<p>Uma plataforma de aprendizado com feedback imediato — que valida suas queries em tempo real e aponta exatamente onde está o erro — acelera esse processo significativamente em relação a estudar com livros ou tutoriais estáticos.</p>
    `,
  },
  {
    slug: 'comando-select',
    title: 'Comando SELECT no SQL: como consultar dados com precisão',
    description:
      'Aprenda tudo sobre o comando SELECT em SQL: sintaxe básica, aliases, ORDER BY, LIMIT, DISTINCT e as boas práticas que diferenciam um iniciante de um profissional.',
    date: '2026-02-12',
    readTime: 8,
    tags: ['iniciante', 'select', 'fundamentos'],
    content: `
<p>O <code>SELECT</code> é o comando mais fundamental do SQL — é com ele que você "lê" dados de um banco de dados. Se você só puder aprender um comando SQL, aprenda o <code>SELECT</code>. Neste guia, cobrimos desde a sintaxe mais simples até recursos avançados que a maioria dos iniciantes desconhece.</p>

<h2>A sintaxe básica do SELECT</h2>

<p>A estrutura mínima de uma consulta SQL é simples:</p>

<pre><code>SELECT coluna1, coluna2
FROM tabela;</code></pre>

<p>Por exemplo, para buscar o nome e a cidade de todos os clientes:</p>

<pre><code>SELECT nome, cidade
FROM clientes;</code></pre>

<p>Essa query retorna todas as linhas da tabela <code>clientes</code>, mostrando apenas as colunas <code>nome</code> e <code>cidade</code>.</p>

<h2>SELECT * — use com moderação</h2>

<p>O asterisco (<code>*</code>) seleciona todas as colunas de uma tabela:</p>

<pre><code>SELECT *
FROM produtos;</code></pre>

<p>Parece conveniente, mas há problemas sérios com isso em produção:</p>

<ul>
  <li>Retorna colunas desnecessárias, aumentando o tráfego de rede e o consumo de memória</li>
  <li>Se a tabela mudar (nova coluna adicionada), o comportamento do seu código muda sem aviso</li>
  <li>O banco de dados não consegue usar índices de cobertura para otimizar a query</li>
  <li>Dificulta a leitura do código — quem lê não sabe quais colunas realmente importam</li>
</ul>

<p><strong>Regra prática:</strong> use <code>SELECT *</code> apenas para exploração rápida no terminal. Em código de aplicação ou relatórios, sempre liste as colunas explicitamente.</p>

<h2>Aliases com AS</h2>

<p>Você pode renomear colunas no resultado usando <code>AS</code>. Isso não altera a tabela — apenas o nome exibido no retorno da query:</p>

<pre><code>SELECT
  nome AS "Nome do Cliente",
  email AS contato,
  saldo AS valor_disponivel
FROM clientes;</code></pre>

<p>Aliases são especialmente úteis quando você usa funções ou cálculos na cláusula SELECT:</p>

<pre><code>SELECT
  nome,
  preco,
  preco * 0.9 AS preco_com_desconto_10pct
FROM produtos;</code></pre>

<h2>ORDER BY — ordenando resultados</h2>

<p>Para ordenar os resultados, use <code>ORDER BY</code>. O padrão é crescente (<code>ASC</code>), mas você pode usar <code>DESC</code> para decrescente:</p>

<pre><code>-- Por nome em ordem alfabética (crescente)
SELECT nome, salario
FROM funcionarios
ORDER BY nome ASC;

-- Por salário, do maior para o menor
SELECT nome, salario
FROM funcionarios
ORDER BY salario DESC;</code></pre>

<p>Você pode ordenar por múltiplas colunas. Quando há empate no primeiro critério, o segundo entra em ação:</p>

<pre><code>SELECT nome, departamento, salario
FROM funcionarios
ORDER BY departamento ASC, salario DESC;</code></pre>

<h2>LIMIT e OFFSET — paginação de resultados</h2>

<p><code>LIMIT</code> restringe quantas linhas são retornadas — fundamental para evitar trazer milhões de registros de uma vez:</p>

<pre><code>-- Top 10 produtos mais caros
SELECT nome, preco
FROM produtos
ORDER BY preco DESC
LIMIT 10;</code></pre>

<p><code>OFFSET</code> pula um número de linhas antes de começar a retornar, tornando a paginação possível:</p>

<pre><code>-- Página 3 de resultados (10 por página = pular 20, mostrar 10)
SELECT nome, preco
FROM produtos
ORDER BY nome
LIMIT 10
OFFSET 20;</code></pre>

<h2>DISTINCT — eliminando duplicatas</h2>

<p>Para retornar apenas valores únicos, use <code>DISTINCT</code>:</p>

<pre><code>-- Quais países aparecem na nossa base de clientes?
SELECT DISTINCT pais
FROM clientes
ORDER BY pais;</code></pre>

<p><code>DISTINCT</code> funciona sobre a combinação de todas as colunas selecionadas. Se você selecionar <code>DISTINCT pais, cidade</code>, o banco eliminará apenas linhas onde pais E cidade são iguais.</p>

<h2>Expressões e cálculos diretos no SELECT</h2>

<p>A cláusula <code>SELECT</code> pode avaliar expressões matemáticas, funções e condições diretamente:</p>

<pre><code>SELECT
  produto,
  preco,
  quantidade,
  preco * quantidade AS total_bruto,
  ROUND(preco * quantidade * 0.87, 2) AS total_sem_imposto,
  CASE WHEN quantidade > 100 THEN 'estoque alto' ELSE 'estoque baixo' END AS status_estoque
FROM itens_pedido;</code></pre>

<h2>A ordem real de execução do SQL</h2>

<p>Um ponto que confunde muitos iniciantes: o SQL não é executado na ordem em que você o escreve. A ordem real de processamento é:</p>

<ol>
  <li><code>FROM</code> — qual(is) tabela(s) usar</li>
  <li><code>JOIN</code> — combinar tabelas</li>
  <li><code>WHERE</code> — filtrar linhas individualmente</li>
  <li><code>GROUP BY</code> — agrupar linhas</li>
  <li><code>HAVING</code> — filtrar grupos</li>
  <li><code>SELECT</code> — selecionar e calcular colunas</li>
  <li><code>DISTINCT</code> — eliminar duplicatas</li>
  <li><code>ORDER BY</code> — ordenar resultado final</li>
  <li><code>LIMIT / OFFSET</code> — limitar linhas retornadas</li>
</ol>

<p>Isso explica por que você não pode usar um alias definido no <code>SELECT</code> dentro do <code>WHERE</code>: o <code>WHERE</code> é executado antes, quando os aliases ainda não existem. Porém, você pode usar aliases do <code>SELECT</code> no <code>ORDER BY</code>, pois este é executado depois.</p>

<h2>Boas práticas para escrever SELECT</h2>

<ul>
  <li>Sempre termine queries com ponto e vírgula (<code>;</code>)</li>
  <li>Use letras maiúsculas para palavras-chave SQL (<code>SELECT</code>, <code>FROM</code>, <code>WHERE</code>)</li>
  <li>Indente colunas e cláusulas para facilitar a leitura</li>
  <li>Evite <code>SELECT *</code> em código de produção — liste as colunas que você precisa</li>
  <li>Prefira aliases descritivos a abreviações crípticas</li>
  <li>Adicione <code>LIMIT</code> ao explorar tabelas desconhecidas para evitar surpresas</li>
</ul>
    `,
  },
  {
    slug: 'filtros-where',
    title: 'Cláusula WHERE no SQL: como filtrar dados com precisão',
    description:
      'Domine a cláusula WHERE no SQL: operadores de comparação, AND, OR, NOT, BETWEEN, IN, LIKE e IS NULL — com exemplos práticos do mundo real.',
    date: '2026-02-20',
    readTime: 8,
    tags: ['iniciante', 'where', 'filtros'],
    content: `
<p>A cláusula <code>WHERE</code> é o mecanismo de filtragem do SQL. Sem ela, uma query retorna todas as linhas de uma tabela — útil às vezes, mas raramente o que você quer. Com o <code>WHERE</code>, você define exatamente quais registros devem aparecer no resultado, baseado em uma ou mais condições.</p>

<h2>Sintaxe básica</h2>

<pre><code>SELECT colunas
FROM tabela
WHERE condição;</code></pre>

<p>Exemplo direto: buscar apenas os funcionários do departamento de Tecnologia:</p>

<pre><code>SELECT nome, cargo, salario
FROM funcionarios
WHERE departamento = 'Tecnologia';</code></pre>

<h2>Operadores de comparação</h2>

<p>O <code>WHERE</code> aceita os operadores de comparação padrão:</p>

<ul>
  <li><code>=</code> — igual a</li>
  <li><code>!= </code> ou <code>&lt;&gt;</code> — diferente de</li>
  <li><code>&gt;</code> — maior que</li>
  <li><code>&lt;</code> — menor que</li>
  <li><code>&gt;=</code> — maior ou igual a</li>
  <li><code>&lt;=</code> — menor ou igual a</li>
</ul>

<pre><code>-- Produtos com preço acima de R$100
SELECT nome, preco
FROM produtos
WHERE preco > 100;

-- Pedidos de 2025 em diante
SELECT id, data, valor
FROM pedidos
WHERE data >= '2025-01-01';</code></pre>

<h2>AND, OR e NOT — combinando condições</h2>

<p>Use <code>AND</code> para exigir que múltiplas condições sejam verdadeiras ao mesmo tempo:</p>

<pre><code>-- Clientes ativos de São Paulo com saldo positivo
SELECT nome, cidade, saldo
FROM clientes
WHERE estado = 'SP'
  AND ativo = true
  AND saldo > 0;</code></pre>

<p>Use <code>OR</code> quando basta que uma das condições seja verdadeira:</p>

<pre><code>-- Produtos de eletrônicos ou informática
SELECT nome, categoria, preco
FROM produtos
WHERE categoria = 'Eletrônicos'
   OR categoria = 'Informática';</code></pre>

<p>Use <code>NOT</code> para negar uma condição:</p>

<pre><code>-- Funcionários que não são do departamento Financeiro
SELECT nome, departamento
FROM funcionarios
WHERE NOT departamento = 'Financeiro';</code></pre>

<p><strong>Atenção com precedência:</strong> <code>AND</code> tem maior precedência que <code>OR</code>. Use parênteses para garantir a lógica correta:</p>

<pre><code>-- ERRADO: AND é avaliado antes do OR
WHERE categoria = 'Roupas' OR categoria = 'Calçados' AND preco > 200

-- CORRETO: parenteses explicitam a intenção
WHERE (categoria = 'Roupas' OR categoria = 'Calçados') AND preco > 200</code></pre>

<h2>BETWEEN — intervalo de valores</h2>

<p><code>BETWEEN</code> verifica se um valor está dentro de um intervalo (inclusivo em ambas as extremidades):</p>

<pre><code>-- Produtos com preço entre R$50 e R$200 (incluindo 50 e 200)
SELECT nome, preco
FROM produtos
WHERE preco BETWEEN 50 AND 200;

-- Pedidos feitos em janeiro de 2026
SELECT id, data, valor
FROM pedidos
WHERE data BETWEEN '2026-01-01' AND '2026-01-31';</code></pre>

<h2>IN — lista de valores possíveis</h2>

<p><code>IN</code> verifica se um valor está dentro de uma lista. É uma forma compacta de múltiplos <code>OR</code>:</p>

<pre><code>-- Em vez de OR repetido:
WHERE cidade = 'São Paulo' OR cidade = 'Rio de Janeiro' OR cidade = 'Curitiba'

-- Use IN:
WHERE cidade IN ('São Paulo', 'Rio de Janeiro', 'Curitiba')</code></pre>

<p><code>NOT IN</code> exclui os valores da lista:</p>

<pre><code>SELECT nome, status
FROM pedidos
WHERE status NOT IN ('cancelado', 'devolvido');</code></pre>

<h2>LIKE — busca por padrão de texto</h2>

<p><code>LIKE</code> permite buscas com curingas em campos de texto:</p>

<ul>
  <li><code>%</code> — representa zero ou mais caracteres</li>
  <li><code>_</code> — representa exatamente um caractere</li>
</ul>

<pre><code>-- Nomes que começam com "Ana"
SELECT nome FROM clientes WHERE nome LIKE 'Ana%';

-- Nomes que contêm "silva" (em qualquer posição)
SELECT nome FROM clientes WHERE nome LIKE '%silva%';

-- E-mails do domínio @gmail.com
SELECT nome, email FROM clientes WHERE email LIKE '%@gmail.com';

-- Códigos de produto com exatamente 6 caracteres
SELECT codigo FROM produtos WHERE codigo LIKE '______';</code></pre>

<p><strong>Nota de performance:</strong> <code>LIKE '%texto'</code> (começa com %) não consegue usar índices e causa varredura completa da tabela. Use apenas quando necessário, e prefira <code>LIKE 'texto%'</code> quando possível.</p>

<h2>IS NULL e IS NOT NULL</h2>

<p><code>NULL</code> representa a ausência de valor — diferente de zero ou string vazia. Para verificar nulos, você <em>não pode</em> usar <code>= NULL</code>; use <code>IS NULL</code>:</p>

<pre><code>-- Clientes sem telefone cadastrado
SELECT nome, email
FROM clientes
WHERE telefone IS NULL;

-- Pedidos que já têm data de entrega
SELECT id, data_pedido, data_entrega
FROM pedidos
WHERE data_entrega IS NOT NULL;</code></pre>

<h2>Combinando tudo em uma query real</h2>

<p>Na prática, você vai combinar vários operadores:</p>

<pre><code>-- Pedidos pendentes ou em processamento, acima de R$500,
-- feitos nos últimos 30 dias, por clientes de SP ou RJ
SELECT
  p.id,
  c.nome AS cliente,
  p.valor,
  p.status,
  p.criado_em
FROM pedidos p
JOIN clientes c ON p.cliente_id = c.id
WHERE p.status IN ('pendente', 'processando')
  AND p.valor > 500
  AND p.criado_em >= CURRENT_DATE - INTERVAL '30 days'
  AND c.estado IN ('SP', 'RJ')
ORDER BY p.valor DESC;</code></pre>

<p>Dominar o <code>WHERE</code> é dominar a capacidade de extrair exatamente os dados que você precisa de um banco. É, sem dúvida, a habilidade mais valiosa do SQL no dia a dia.</p>
    `,
  },
  {
    slug: 'joins-sql',
    title: 'JOINs no SQL: como combinar tabelas com exemplos práticos',
    description:
      'Entenda INNER JOIN, LEFT JOIN, RIGHT JOIN e FULL JOIN de uma vez por todas. Com diagramas, exemplos reais e as armadilhas mais comuns de quem está aprendendo.',
    date: '2026-03-01',
    readTime: 10,
    tags: ['joins', 'intermediário', 'relacionamentos'],
    content: `
<p>JOINs são o coração do SQL relacional. Eles permitem combinar dados de duas ou mais tabelas em uma única consulta, explorando os relacionamentos definidos pelas chaves primárias e estrangeiras. Entender JOINs é o que separa quem consegue apenas buscar dados de quem consegue responder perguntas complexas de negócio.</p>

<h2>Por que os dados ficam em tabelas separadas?</h2>

<p>Bancos de dados relacionais separam informações em tabelas distintas para evitar repetição. Em vez de guardar o nome do cliente em cada pedido, você guarda o <code>cliente_id</code> e tem uma tabela <code>clientes</code> separada. Isso evita inconsistências (e se o nome do cliente mudar?) e reduz o espaço em disco.</p>

<p>O JOIN é a operação que reconecta esses dados na hora da consulta.</p>

<h2>Tabelas de exemplo</h2>

<p>Vamos usar estas duas tabelas ao longo dos exemplos:</p>

<pre><code>-- Tabela: clientes
id | nome           | cidade
---|----------------|--------
 1 | Ana Silva      | São Paulo
 2 | Bruno Costa    | Rio de Janeiro
 3 | Carla Mendes   | Curitiba
 4 | Diego Ferreira | Fortaleza

-- Tabela: pedidos
id | cliente_id | valor  | status
---|------------|--------|----------
 1 |          1 | 350.00 | entregue
 2 |          1 | 120.50 | entregue
 3 |          2 | 890.00 | pendente
 4 |          5 | 230.00 | cancelado  ← cliente_id 5 não existe!</code></pre>

<h2>INNER JOIN — a interseção</h2>

<p>O <code>INNER JOIN</code> retorna apenas as linhas que têm correspondência em <em>ambas</em> as tabelas. É o tipo de JOIN mais comum.</p>

<pre><code>SELECT
  c.nome AS cliente,
  p.id AS pedido,
  p.valor,
  p.status
FROM pedidos p
INNER JOIN clientes c ON p.cliente_id = c.id;</code></pre>

<p>Resultado: apenas os pedidos 1, 2 e 3 aparecem. O pedido 4 (cliente_id = 5) e os clientes Carla e Diego (sem pedidos) ficam de fora. Diego e Carla são excluídos porque não têm correspondência em <code>pedidos</code>; o pedido 4 é excluído porque não tem correspondência em <code>clientes</code>.</p>

<h2>LEFT JOIN — todos da esquerda</h2>

<p>O <code>LEFT JOIN</code> retorna todas as linhas da tabela da esquerda (a do <code>FROM</code>), mais as correspondências da direita. Onde não há correspondência, as colunas da direita ficam com <code>NULL</code>.</p>

<pre><code>-- Todos os clientes, com ou sem pedidos
SELECT
  c.nome AS cliente,
  p.id AS pedido,
  p.valor
FROM clientes c
LEFT JOIN pedidos p ON c.id = p.cliente_id;</code></pre>

<p>Resultado: Ana aparece duas vezes (2 pedidos), Bruno uma vez (1 pedido), Carla e Diego aparecem com <code>NULL</code> nas colunas de pedido. O pedido do cliente inexistente continua fora.</p>

<p>Uso clássico: "quais clientes nunca fizeram um pedido?"</p>

<pre><code>SELECT c.nome
FROM clientes c
LEFT JOIN pedidos p ON c.id = p.cliente_id
WHERE p.id IS NULL;</code></pre>

<h2>RIGHT JOIN — todos da direita</h2>

<p>O espelho do <code>LEFT JOIN</code>: retorna todas as linhas da tabela da direita, mais as correspondências da esquerda.</p>

<pre><code>SELECT
  c.nome AS cliente,
  p.id AS pedido,
  p.valor
FROM clientes c
RIGHT JOIN pedidos p ON c.id = p.cliente_id;</code></pre>

<p>Resultado: os pedidos 1, 2, 3 aparecem com dados do cliente. O pedido 4 (cliente inexistente) aparece com <code>NULL</code> nas colunas de cliente. Carla e Diego ficam de fora.</p>

<p>Na prática, <code>RIGHT JOIN</code> é raramente usado — você pode sempre reescrever invertendo as tabelas e usando <code>LEFT JOIN</code>, o que é mais legível.</p>

<h2>FULL JOIN — todos de ambos os lados</h2>

<p>O <code>FULL OUTER JOIN</code> (ou <code>FULL JOIN</code>) retorna todas as linhas de ambas as tabelas, com <code>NULL</code> onde não há correspondência.</p>

<pre><code>SELECT
  c.nome AS cliente,
  p.id AS pedido,
  p.valor
FROM clientes c
FULL JOIN pedidos p ON c.id = p.cliente_id;</code></pre>

<p>Resultado: todos os clientes aparecem (com ou sem pedidos) e todos os pedidos aparecem (com ou sem cliente válido). É o JOIN mais abrangente e menos usado no dia a dia.</p>

<h2>Aliases de tabela: o padrão profissional</h2>

<p>Usar aliases curtos para as tabelas (como <code>c</code> para clientes, <code>p</code> para pedidos) é uma convenção importante:</p>

<pre><code>-- Sem alias: verboso e repetitivo
SELECT clientes.nome, pedidos.valor
FROM clientes
INNER JOIN pedidos ON clientes.id = pedidos.cliente_id;

-- Com alias: limpo e profissional
SELECT c.nome, p.valor
FROM clientes c
INNER JOIN pedidos p ON c.id = p.cliente_id;</code></pre>

<h2>JOINs múltiplos</h2>

<p>Você pode encadear vários JOINs na mesma query:</p>

<pre><code>SELECT
  c.nome AS cliente,
  p.id AS pedido,
  pr.nome AS produto,
  ip.quantidade,
  ip.quantidade * pr.preco AS subtotal
FROM pedidos p
INNER JOIN clientes c ON p.cliente_id = c.id
INNER JOIN itens_pedido ip ON ip.pedido_id = p.id
INNER JOIN produtos pr ON ip.produto_id = pr.id
WHERE p.status = 'entregue'
ORDER BY p.id, pr.nome;</code></pre>

<h2>Armadilhas comuns com JOINs</h2>

<ul>
  <li><strong>Produto cartesiano acidental:</strong> esquecer a condição <code>ON</code> gera todas as combinações possíveis entre as tabelas — pode retornar bilhões de linhas</li>
  <li><strong>Duplicação de linhas:</strong> JOINs com relacionamentos 1-para-muitos multiplicam as linhas; use agregação quando necessário</li>
  <li><strong>Ambiguidade de coluna:</strong> quando duas tabelas têm colunas com o mesmo nome (como <code>id</code>), sempre prefixe com o alias da tabela</li>
  <li><strong>Confundir LEFT JOIN com INNER JOIN:</strong> se você precisa de registros mesmo sem correspondência, o INNER vai silenciosamente omiti-los</li>
</ul>

<p>JOINs se tornam intuitivos com a prática. A chave é sempre pensar: "o que eu quero que aconteça com as linhas que não têm correspondência?" Se você quer perdê-las: INNER JOIN. Se você quer mantê-las de um lado: LEFT ou RIGHT JOIN.</p>
    `,
  },
  {
    slug: 'group-by-agregacao',
    title: 'GROUP BY e funções de agregação no SQL',
    description:
      'Aprenda a usar COUNT, SUM, AVG, MIN e MAX com GROUP BY para resumir e analisar dados. Entenda também a diferença entre WHERE e HAVING.',
    date: '2026-03-15',
    readTime: 8,
    tags: ['agregação', 'group-by', 'intermediário'],
    content: `
<p>As funções de agregação e o <code>GROUP BY</code> transformam o SQL de uma ferramenta de busca em uma ferramenta de análise. Em vez de buscar linhas individuais, você resume e agrupa dados para extrair métricas, totais, médias e contagens. Essa combinação é a base de relatórios, dashboards e análises de negócio.</p>

<h2>Funções de agregação essenciais</h2>

<p>Antes do <code>GROUP BY</code>, é importante entender as funções que calculam sobre um conjunto de linhas:</p>

<ul>
  <li><code>COUNT(*)</code> — conta o número total de linhas</li>
  <li><code>COUNT(coluna)</code> — conta linhas onde a coluna não é NULL</li>
  <li><code>SUM(coluna)</code> — soma os valores de uma coluna numérica</li>
  <li><code>AVG(coluna)</code> — calcula a média dos valores</li>
  <li><code>MIN(coluna)</code> — retorna o menor valor</li>
  <li><code>MAX(coluna)</code> — retorna o maior valor</li>
</ul>

<pre><code>-- Resumo geral da tabela de pedidos
SELECT
  COUNT(*) AS total_pedidos,
  COUNT(data_entrega) AS pedidos_entregues,
  SUM(valor) AS faturamento_total,
  AVG(valor) AS ticket_medio,
  MIN(valor) AS menor_pedido,
  MAX(valor) AS maior_pedido
FROM pedidos;</code></pre>

<h2>GROUP BY — agrupando por categoria</h2>

<p>Sem <code>GROUP BY</code>, as funções de agregação calculam sobre todas as linhas da tabela. Com <code>GROUP BY</code>, você divide as linhas em grupos e calcula separadamente para cada grupo:</p>

<pre><code>-- Total de pedidos e faturamento por status
SELECT
  status,
  COUNT(*) AS quantidade,
  SUM(valor) AS total
FROM pedidos
GROUP BY status;</code></pre>

<p>Resultado:</p>

<pre><code>status     | quantidade | total
-----------|------------|--------
entregue   |        142 | 58320.00
pendente   |         38 |  9450.00
cancelado  |         15 |  3200.00</code></pre>

<h2>GROUP BY com múltiplas colunas</h2>

<p>Você pode agrupar por mais de uma coluna ao mesmo tempo. O grupo será formado pela combinação única de todas as colunas listadas:</p>

<pre><code>-- Vendas por ano e mês
SELECT
  EXTRACT(YEAR FROM criado_em) AS ano,
  EXTRACT(MONTH FROM criado_em) AS mes,
  COUNT(*) AS pedidos,
  SUM(valor) AS faturamento
FROM pedidos
GROUP BY
  EXTRACT(YEAR FROM criado_em),
  EXTRACT(MONTH FROM criado_em)
ORDER BY ano, mes;</code></pre>

<h2>A regra de ouro do GROUP BY</h2>

<p>Existe uma regra obrigatória: <strong>toda coluna no <code>SELECT</code> deve estar no <code>GROUP BY</code> ou dentro de uma função de agregação.</strong></p>

<pre><code>-- ERRADO: nome_cliente não está no GROUP BY nem em agregação
SELECT nome_cliente, status, COUNT(*)
FROM pedidos
GROUP BY status;

-- CORRETO:
SELECT status, COUNT(*) AS quantidade
FROM pedidos
GROUP BY status;</code></pre>

<p>Isso faz sentido: se você agrupou todos os pedidos "entregues" em uma linha, qual nome de cliente deveria aparecer? Não faz sentido — daí a obrigatoriedade.</p>

<h2>HAVING — filtrando grupos</h2>

<p>O <code>WHERE</code> filtra linhas individuais antes do agrupamento. O <code>HAVING</code> filtra grupos depois do agrupamento. Essa é a distinção mais importante:</p>

<pre><code>-- WHERE: filtra ANTES de agrupar
-- Clientes de SP, agrupados por categoria de produto
SELECT categoria, SUM(valor) AS total
FROM pedidos
WHERE estado_cliente = 'SP'
GROUP BY categoria;

-- HAVING: filtra DEPOIS de agrupar
-- Apenas categorias com faturamento acima de R$10.000
SELECT categoria, SUM(valor) AS total
FROM pedidos
GROUP BY categoria
HAVING SUM(valor) > 10000;</code></pre>

<p>Você pode usar WHERE e HAVING na mesma query:</p>

<pre><code>-- Clientes de SP com mais de 5 pedidos entregues
SELECT
  cliente_id,
  COUNT(*) AS total_pedidos,
  SUM(valor) AS faturamento
FROM pedidos
WHERE status = 'entregue'              -- filtra linhas antes do grupo
  AND estado_cliente = 'SP'
GROUP BY cliente_id
HAVING COUNT(*) > 5                    -- filtra grupos depois
ORDER BY faturamento DESC;</code></pre>

<h2>COUNT(*) vs COUNT(coluna)</h2>

<p>A diferença é sutil mas importante:</p>

<pre><code>-- COUNT(*) conta TODAS as linhas do grupo, incluindo NULLs
SELECT departamento, COUNT(*) AS total_funcionarios
FROM funcionarios
GROUP BY departamento;

-- COUNT(coluna) conta apenas linhas onde a coluna NÃO é NULL
SELECT departamento, COUNT(gestor_id) AS funcionarios_com_gestor
FROM funcionarios
GROUP BY departamento;</code></pre>

<h2>Casos de uso práticos</h2>

<pre><code>-- Top 5 clientes por faturamento
SELECT
  c.nome,
  COUNT(p.id) AS pedidos,
  SUM(p.valor) AS total_gasto
FROM clientes c
INNER JOIN pedidos p ON c.id = p.cliente_id
WHERE p.status = 'entregue'
GROUP BY c.id, c.nome
ORDER BY total_gasto DESC
LIMIT 5;

-- Produtos sem venda nos últimos 90 dias
SELECT pr.nome, pr.categoria
FROM produtos pr
LEFT JOIN itens_pedido ip ON pr.id = ip.produto_id
  AND ip.criado_em >= CURRENT_DATE - INTERVAL '90 days'
WHERE ip.id IS NULL;

-- Média de ticket por dia da semana
SELECT
  TO_CHAR(criado_em, 'Day') AS dia_semana,
  ROUND(AVG(valor), 2) AS ticket_medio,
  COUNT(*) AS pedidos
FROM pedidos
GROUP BY TO_CHAR(criado_em, 'Day')
ORDER BY MIN(EXTRACT(DOW FROM criado_em));</code></pre>

<p>O <code>GROUP BY</code> combinado com funções de agregação é a ferramenta que transforma uma lista de transações brutas em insights de negócio. Dominar essa combinação é o que permite responder perguntas do tipo "qual produto vende mais?", "qual cliente gasta mais?" e "qual mês tem o maior faturamento?"</p>
    `,
  },
  {
    slug: 'subqueries-sql',
    title: 'Subqueries no SQL: consultas dentro de consultas',
    description:
      'Aprenda o que são subqueries (subconsultas), como usá-las no SELECT, WHERE e FROM, a diferença entre IN e EXISTS, e quando preferir CTEs.',
    date: '2026-04-01',
    readTime: 9,
    tags: ['subqueries', 'avançado', 'cte'],
    content: `
<p>Uma subquery (ou subconsulta) é uma query SQL aninhada dentro de outra query. Elas permitem resolver problemas que seriam impossíveis ou muito verbosos com queries simples — como filtrar com base em um conjunto calculado, comparar com agregações ou criar conjuntos de dados temporários. Dominar subqueries é um passo essencial para escrever SQL de nível intermediário a avançado.</p>

<h2>Onde uma subquery pode aparecer?</h2>

<p>Subqueries podem ser usadas em três locais principais:</p>

<ul>
  <li><strong>No WHERE:</strong> para filtrar com base em um conjunto de valores ou em uma condição calculada</li>
  <li><strong>No FROM:</strong> como se fosse uma tabela temporária (derived table)</li>
  <li><strong>No SELECT:</strong> para calcular um valor por linha (subquery escalar)</li>
</ul>

<h2>Subquery no WHERE com IN</h2>

<p>O uso mais comum: verificar se um valor está no resultado de outra query.</p>

<pre><code>-- Clientes que fizeram pelo menos um pedido em 2025
SELECT nome, email
FROM clientes
WHERE id IN (
  SELECT DISTINCT cliente_id
  FROM pedidos
  WHERE EXTRACT(YEAR FROM criado_em) = 2025
);</code></pre>

<p>A subquery interna é executada primeiro, retornando uma lista de <code>cliente_id</code>. Depois, a query externa filtra clientes cujo <code>id</code> está nessa lista.</p>

<h2>Subquery escalar no SELECT</h2>

<p>Uma subquery que retorna exatamente <strong>um valor</strong> (uma linha, uma coluna) pode ser usada diretamente na cláusula <code>SELECT</code>:</p>

<pre><code>-- Para cada departamento, mostrar quantos funcionários ele tem
-- comparado ao total geral da empresa
SELECT
  d.nome AS departamento,
  COUNT(f.id) AS funcionarios,
  (SELECT COUNT(*) FROM funcionarios) AS total_empresa,
  ROUND(COUNT(f.id) * 100.0 / (SELECT COUNT(*) FROM funcionarios), 1) AS percentual
FROM departamentos d
LEFT JOIN funcionarios f ON d.id = f.departamento_id
GROUP BY d.id, d.nome
ORDER BY funcionarios DESC;</code></pre>

<h2>Subquery no FROM (derived table)</h2>

<p>Você pode usar uma subquery como se fosse uma tabela. Isso é útil quando você precisa agregar dados antes de fazer outro JOIN ou filtro:</p>

<pre><code>-- Top clientes por faturamento, com rank
SELECT
  cliente,
  faturamento,
  RANK() OVER (ORDER BY faturamento DESC) AS posicao
FROM (
  SELECT
    c.nome AS cliente,
    SUM(p.valor) AS faturamento
  FROM clientes c
  INNER JOIN pedidos p ON c.id = p.cliente_id
  WHERE p.status = 'entregue'
  GROUP BY c.id, c.nome
) AS resumo_clientes
ORDER BY posicao
LIMIT 10;</code></pre>

<p>A subquery no <code>FROM</code> <strong>sempre precisa de um alias</strong> (aqui, <code>resumo_clientes</code>).</p>

<h2>IN vs EXISTS — qual usar?</h2>

<p><code>EXISTS</code> verifica se a subquery retorna pelo menos uma linha. Diferente do <code>IN</code>, ele para assim que encontra a primeira correspondência:</p>

<pre><code>-- Com IN:
SELECT nome FROM clientes
WHERE id IN (
  SELECT cliente_id FROM pedidos WHERE status = 'pendente'
);

-- Com EXISTS (equivalente, mas diferente por dentro):
SELECT nome FROM clientes c
WHERE EXISTS (
  SELECT 1 FROM pedidos p
  WHERE p.cliente_id = c.id
    AND p.status = 'pendente'
);</code></pre>

<p>Regras práticas:</p>
<ul>
  <li>Use <code>IN</code> quando a subquery retorna uma lista pequena de valores</li>
  <li>Use <code>EXISTS</code> para verificar existência em tabelas grandes — costuma ser mais eficiente</li>
  <li><code>NOT EXISTS</code> é geralmente mais eficiente e previsível do que <code>NOT IN</code> (que tem comportamento inesperado com NULLs)</li>
</ul>

<h2>Subqueries correlacionadas</h2>

<p>Uma subquery correlacionada referencia colunas da query externa. Ela é reavaliada para cada linha da query externa — o que a torna poderosa, mas potencialmente lenta em grandes tabelas:</p>

<pre><code>-- Para cada funcionário, mostrar se o salário é acima da média do departamento
SELECT
  nome,
  departamento,
  salario,
  CASE
    WHEN salario > (
      SELECT AVG(salario)
      FROM funcionarios f2
      WHERE f2.departamento = f1.departamento
    ) THEN 'acima da média'
    ELSE 'na média ou abaixo'
  END AS classificacao
FROM funcionarios f1;</code></pre>

<h2>Quando usar CTEs em vez de subqueries</h2>

<p>CTEs (<code>WITH</code>) são uma alternativa mais legível às subqueries no <code>FROM</code>. Para queries complexas com múltiplos níveis de subquery, CTEs tornam o código muito mais fácil de entender e depurar:</p>

<pre><code>-- Com subquery aninhada (difícil de ler):
SELECT cliente, faturamento
FROM (
  SELECT c.nome AS cliente, SUM(p.valor) AS faturamento
  FROM clientes c
  JOIN pedidos p ON c.id = p.cliente_id
  GROUP BY c.id, c.nome
) t
WHERE faturamento > 1000;

-- Com CTE (muito mais legível):
WITH faturamento_por_cliente AS (
  SELECT c.nome AS cliente, SUM(p.valor) AS faturamento
  FROM clientes c
  JOIN pedidos p ON c.id = p.cliente_id
  GROUP BY c.id, c.nome
)
SELECT cliente, faturamento
FROM faturamento_por_cliente
WHERE faturamento > 1000;</code></pre>

<p>Use subqueries para lógica simples e pontual. Use CTEs quando a subquery é complexa, reutilizada em múltiplos pontos da query, ou quando você quer dar um nome descritivo ao conjunto de dados intermediário.</p>

<h2>Boas práticas com subqueries</h2>

<ul>
  <li>Sempre dê aliases descritivos para subqueries no FROM</li>
  <li>Prefira <code>NOT EXISTS</code> a <code>NOT IN</code> quando a lista pode conter NULLs</li>
  <li>Verifique o plano de execução (<code>EXPLAIN ANALYZE</code>) para subqueries correlacionadas em tabelas grandes</li>
  <li>Quando a subquery fica muito grande ou é reusada, converta para CTE</li>
  <li>Subqueries escalares no SELECT são executadas uma vez por linha — cuidado com tabelas grandes</li>
</ul>
    `,
  },
]

export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug)
}
