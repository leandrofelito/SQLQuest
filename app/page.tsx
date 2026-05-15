import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SQLQuest — Aprenda SQL jogando',
  description:
    'Plataforma gratuita e gamificada de ensino de SQL. Do SELECT básico ao avançado com joins, subqueries, window functions e muito mais. 21 trilhas, XP, ranking e certificados.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'SQLQuest — Aprenda SQL jogando',
    description:
      'Plataforma gratuita e gamificada de ensino de SQL. Do SELECT básico ao avançado com joins, subqueries, window functions e muito mais.',
    type: 'website',
  },
}

const TRILHAS = [
  { emoji: '🟢', titulo: 'Fundamentos do SQL', desc: 'SELECT, FROM, WHERE, ORDER BY e os primeiros passos na linguagem de consulta.' },
  { emoji: '🔵', titulo: 'Filtragem e Ordenação', desc: 'LIKE, BETWEEN, IN, IS NULL, ORDER BY com múltiplas colunas e expressões.' },
  { emoji: '🟣', titulo: 'Funções de Agregação', desc: 'COUNT, SUM, AVG, MIN, MAX e agrupamento com GROUP BY e HAVING.' },
  { emoji: '🟠', titulo: 'JOINs e Relacionamentos', desc: 'INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL JOIN — combine tabelas com confiança.' },
  { emoji: '🔴', titulo: 'Subqueries', desc: 'Subconsultas escalares, de linha e de tabela dentro de SELECT, WHERE e FROM.' },
  { emoji: '🟡', titulo: 'Manipulação de Dados', desc: 'INSERT, UPDATE, DELETE e boas práticas para modificar dados com segurança.' },
  { emoji: '⚪', titulo: 'DDL e Estrutura', desc: 'CREATE TABLE, ALTER TABLE, DROP, constraints e tipos de dados.' },
  { emoji: '🔷', titulo: 'CTEs e Consultas Avançadas', desc: 'WITH (Common Table Expressions), consultas recursivas e organização de queries complexas.' },
  { emoji: '🔶', titulo: 'Window Functions', desc: 'ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, SUM OVER e particionamento.' },
  { emoji: '🌐', titulo: 'Índices e Performance', desc: 'Como índices funcionam, EXPLAIN ANALYZE e estratégias para otimizar queries lentas.' },
  { emoji: '🏗️', titulo: 'Modelagem de Dados', desc: 'Normalização (1NF, 2NF, 3NF), design de schemas e relacionamentos entre entidades.' },
  { emoji: '🎓', titulo: 'SQL Profissional', desc: 'Stored procedures, views, transactions, ACID e padrões usados em produção real.' },
  { emoji: '🔐', titulo: 'Controle de Acesso', desc: 'GRANT, REVOKE, roles, permissões e segurança em bancos de dados relacionais.' },
  { emoji: '📊', titulo: 'Relatórios e Dashboards', desc: 'Queries para BI, pivotamento de dados, agregações complexas e geração de relatórios.' },
  { emoji: '🔄', titulo: 'Transações e Concorrência', desc: 'ACID, isolamento de transações, locks, deadlocks e controle de concorrência.' },
  { emoji: '🧩', titulo: 'Funções e Procedures', desc: 'Criação de funções escalares, tabela e stored procedures reutilizáveis.' },
  { emoji: '🗃️', titulo: 'Views e Materialized Views', desc: 'Criação de views simples e materializadas, atualização e casos de uso práticos.' },
  { emoji: '🚀', titulo: 'Otimização Avançada', desc: 'Query planner, estatísticas, particionamento de tabelas e tuning de performance.' },
  { emoji: '🌳', titulo: 'Dados Hierárquicos', desc: 'Consultas recursivas com CTEs, árvores, grafos e estruturas pai-filho.' },
  { emoji: '🗺️', titulo: 'SQL no Mundo Real', desc: 'Padrões de projeto, anti-patterns, migrações e SQL em ambientes de produção.' },
  { emoji: '🏆', titulo: 'Desafios e Projetos', desc: 'Exercícios avançados, estudos de caso reais e projetos práticos integrando todos os conceitos.' },
]

const MOTIVOS = [
  {
    emoji: '🎮',
    titulo: 'Aprendizado gamificado',
    desc: 'Ganhe XP a cada exercício concluído, suba de nível e desbloqueie conquistas. SQL deixa de ser chato e vira um jogo.',
  },
  {
    emoji: '📚',
    titulo: '21+ trilhas estruturadas',
    desc: 'Do SELECT mais simples às Window Functions avançadas e além. Currículo progressivo pensado para quem está começando até desenvolvedores experientes.',
  },
  {
    emoji: '✅',
    titulo: 'Exercícios práticos',
    desc: 'Cada etapa tem questões de múltipla escolha e código real. Você aprende fazendo, não só lendo.',
  },
  {
    emoji: '🏅',
    titulo: 'Certificados verificáveis',
    desc: 'Ao concluir uma trilha, receba um certificado em PDF com link público para validação. Compartilhe no LinkedIn e no currículo.',
  },
  {
    emoji: '🏆',
    titulo: 'Ranking global',
    desc: 'Compare seu progresso com outros alunos, dispute o topo do ranking e mantenha sua sequência de estudos.',
  },
  {
    emoji: '📱',
    titulo: 'App mobile disponível',
    desc: 'Estude no celular com o app SQLQuest para Android. Sincronizado em tempo real com a plataforma web.',
  },
]

export default async function LandingPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/home')

  return (
    <div className="min-h-screen bg-[#080a0f] text-white font-syne">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/favicon.png" alt="" className="w-7 h-7" />
            <span className="text-xl font-bold text-[#a78bfa]">SQL<span className="text-[#facc15]">Quest</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 rounded-xl font-semibold transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center md:text-left">
            <div className="inline-block bg-[#7c3aed]/20 border border-[#7c3aed]/30 text-[#c4b5fd] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              100% gratuito para começar
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Aprenda SQL de verdade,{' '}
              <span className="text-[#a78bfa]">jogando</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto md:mx-0 mb-10 leading-relaxed">
              SQLQuest é uma plataforma gamificada para aprender SQL do zero ao avançado. Ganhe XP, conquiste badges, suba no ranking e receba certificados verificáveis — tudo enquanto pratica com exercícios reais.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/register"
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-8 py-4 rounded-2xl font-bold text-base transition-colors"
              >
                Criar conta gratuita
              </Link>
              <Link
                href="/login"
                className="border border-white/10 hover:border-white/20 text-white/70 hover:text-white px-8 py-4 rounded-2xl font-semibold text-base transition-colors"
              >
                Já tenho conta
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#8b5cf6]/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-[#8b5cf6]/30 bg-[#0f1117] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <div className="flex items-center gap-2">
                  <img src="/brand/logo.png" alt="" className="h-8 w-8" />
                  <span className="text-sm font-bold text-[#a78bfa]">SQL<span className="text-[#facc15]">Quest</span></span>
                </div>
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">PROGRESSO</span>
              </div>
              <div className="space-y-4 p-5">
                {[
                  ['Fundamentos do SQL', '68%', 'w-[68%]'],
                  ['JOINs e Relacionamentos', '34%', 'w-[34%]'],
                  ['Window Functions', '12%', 'w-[12%]'],
                ].map(([titulo, pct, width], i) => (
                  <div key={titulo} className="rounded-2xl border border-white/5 bg-[#080a0f] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-white">{titulo}</p>
                      <span className="text-xs font-bold text-[#a78bfa]">{pct}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1e2028]">
                      <div className={`h-full rounded-full ${i === 0 ? 'bg-[#8b5cf6]' : i === 1 ? 'bg-emerald-400' : 'bg-[#facc15]'} ${width}`} />
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-[#facc15]/20 bg-[#facc15]/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#facc15]">Próximo desafio</p>
                  <p className="mt-1 text-sm text-white/75">Escreva uma query com SELECT, FROM e WHERE.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-[#a78bfa]">21+</p>
            <p className="text-sm text-white/50 mt-1">trilhas de aprendizado</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#a78bfa]">100+</p>
            <p className="text-sm text-white/50 mt-1">exercícios práticos</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#a78bfa]">0</p>
            <p className="text-sm text-white/50 mt-1">reais para começar</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#a78bfa]">∞</p>
            <p className="text-sm text-white/50 mt-1">acesso com plano Pro</p>
          </div>
        </div>
      </section>

      {/* Por que o SQLQuest */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Por que aprender com o SQLQuest?</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">
          SQL é a habilidade mais requisitada para analistas de dados, desenvolvedores back-end e engenheiros. O SQLQuest torna esse aprendizado eficiente e motivador.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {MOTIVOS.map((m) => (
            <div key={m.titulo} className="bg-[#0f1117] border border-white/5 rounded-2xl p-6 space-y-3">
              <div className="text-3xl">{m.emoji}</div>
              <h3 className="font-bold text-white">{m.titulo}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trilhas */}
      <section className="bg-[#0a0c12] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Currículo completo de SQL</h2>
          <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">
            21 trilhas progressivas (e crescendo) cobrindo tudo que você precisa, desde os fundamentos até técnicas usadas por equipes de engenharia de dados em grandes empresas.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {TRILHAS.map((t, i) => (
              <div key={t.titulo} className="flex items-start gap-4 bg-[#0f1117] border border-white/5 rounded-xl p-4">
                <div className="text-2xl shrink-0 mt-0.5">{t.emoji}</div>
                <div>
                  <p className="text-xs text-white/30 mb-0.5">Trilha {i + 1}</p>
                  <h3 className="font-semibold text-white text-sm">{t.titulo}</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Como funciona</h2>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {[
            { step: '1', titulo: 'Crie sua conta', desc: 'Cadastro gratuito em segundos com email ou Google.' },
            { step: '2', titulo: 'Escolha uma trilha', desc: 'Comece pelos fundamentos ou avance direto para tópicos específicos.' },
            { step: '3', titulo: 'Pratique e ganhe XP', desc: 'Resolva exercícios, acerte questões e acumule pontos de experiência.' },
            { step: '4', titulo: 'Conquiste certificados', desc: 'Conclua trilhas e receba certificados PDF verificáveis por link.' },
          ].map((item) => (
            <div key={item.step} className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 flex items-center justify-center text-[#a78bfa] font-bold text-lg mx-auto">
                {item.step}
              </div>
              <h3 className="font-bold text-white">{item.titulo}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Para quem é */}
      <section className="bg-[#0a0c12] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Para quem é o SQLQuest?</h2>
          <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">
            Não importa seu nível atual — há um caminho estruturado esperando por você.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                titulo: 'Iniciantes em tecnologia',
                desc: 'Nunca usou SQL? Comece do zero com os fundamentos. As trilhas iniciais foram criadas para quem nunca viu uma query na vida.',
              },
              {
                titulo: 'Analistas e cientistas de dados',
                desc: 'Já usa SQL no dia a dia mas quer dominar window functions, CTEs e otimização de performance? Vá direto às trilhas avançadas.',
              },
              {
                titulo: 'Desenvolvedores back-end',
                desc: 'Entenda o que acontece por trás dos ORMs. Modelagem, índices e transações são habilidades que fazem diferença em entrevistas técnicas.',
              },
            ].map((item) => (
              <div key={item.titulo} className="bg-[#0f1117] border border-white/5 rounded-2xl p-6 space-y-3">
                <h3 className="font-bold text-white">{item.titulo}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plano Pro */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Acesso gratuito ou Pro vitalício</h2>
        <p className="text-white/50 mb-12 max-w-xl mx-auto">
          Comece gratuitamente e avance até onde quiser. Faça upgrade para o plano Pro e desbloqueie tudo, de uma vez, para sempre.
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="bg-[#0f1117] border border-white/5 rounded-2xl p-8 text-left flex flex-col gap-4">
            <h3 className="font-bold text-xl text-white">Gratuito</h3>
            <p className="text-4xl font-bold text-white">R$0</p>
            <ul className="space-y-2 text-sm text-white/60 flex-1">
              <li>✓ Trilhas iniciais de SQL</li>
              <li>✓ Exercícios práticos</li>
              <li>✓ Sistema de XP e ranking</li>
              <li>✓ Acesso ao app mobile</li>
            </ul>
            <Link href="/register" className="block text-center bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
              Começar grátis
            </Link>
          </div>
          <div className="bg-gradient-to-br from-[#3b0764] to-[#1e1b4b] border border-[#7c3aed]/40 rounded-2xl p-8 text-left flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-1 rounded-full border border-emerald-500/25">
              60% OFF
            </div>
            <h3 className="font-bold text-xl text-white">Pro vitalício</h3>
            <div>
              <p className="text-white/30 line-through text-sm">R$99,90</p>
              <p className="text-4xl font-bold text-[#a78bfa]">R$39,90</p>
              <p className="text-xs text-white/40 mt-1">Pagamento único · Acesso vitalício</p>
            </div>
            <ul className="space-y-2 text-sm text-white/70 flex-1">
              <li>✓ Tudo do plano gratuito</li>
              <li>✓ Todas as trilhas desbloqueadas (21+)</li>
              <li>✓ Certificados PDF verificáveis</li>
              <li>✓ Sem anúncios nunca</li>
              <li>✓ Acesso a conteúdos futuros</li>
            </ul>
            <Link href="/register" className="block text-center bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3 rounded-xl font-bold transition-colors">
              Obter Pro vitalício
            </Link>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#0a0c12] py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Comece hoje, de graça</h2>
          <p className="text-white/50 mb-8 leading-relaxed">
            Crie sua conta em segundos e comece sua primeira trilha agora mesmo. Você aprende lendo pouco, praticando bastante e recebendo feedback a cada etapa.
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-10 py-4 rounded-2xl font-bold text-base transition-colors"
          >
            Criar conta gratuita
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/35">
          <span className="font-bold text-[#a78bfa]">SQL<span className="text-[#facc15]">Quest</span></span>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="hover:text-white/60 transition-colors">Blog SQL</Link>
            <Link href="/sobre" className="hover:text-white/60 transition-colors">Sobre</Link>
            <Link href="/roadmap" className="hover:text-white/60 transition-colors">Roadmap</Link>
            <Link href="/status" className="hover:text-white/60 transition-colors">Status</Link>
            <Link href="/privacidade" className="hover:text-white/60 transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-white/60 transition-colors">Termos</Link>
            <a href="mailto:suporte@sqlquest.com.br" className="hover:text-white/60 transition-colors">Suporte</a>
          </div>
          <span>© {new Date().getFullYear()} SQLQuest. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
