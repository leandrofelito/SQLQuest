import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sobre o SQLQuest — Plataforma de aprendizado de SQL',
  description:
    'Conheça o SQLQuest: uma plataforma gratuita e gamificada para aprender SQL do básico ao avançado, com exercícios interativos, XP, ranking e certificados.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Sobre o SQLQuest — Plataforma de aprendizado de SQL',
    description: 'Conheça a missão, a metodologia e as funcionalidades do SQLQuest.',
    type: 'website',
  },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="text-sm leading-relaxed text-white/65 space-y-3">{children}</div>
    </section>
  )
}

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white/90">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-white/80 hover:text-white transition-colors">
            ← SQLQuest
          </Link>
          <Link
            href="/login"
            className="text-sm px-4 py-1.5 rounded-lg bg-[#a78bfa]/15 text-[#a78bfa] hover:bg-[#a78bfa]/25 transition-colors"
          >
            Entrar
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 pb-24">
        <h1 className="text-3xl font-bold text-white mb-2">Sobre o SQLQuest</h1>
        <p className="text-white/45 text-sm mb-10">A plataforma gratuita de SQL que você queria que existisse</p>

        <div className="space-y-10">
          <Section title="O que é o SQLQuest?">
            <p>
              O SQLQuest é uma plataforma de aprendizado de SQL com abordagem gamificada, disponível gratuitamente em
              português. Criada para quem quer aprender SQL de verdade — não apenas memorizar comandos, mas entender como
              pensar em dados e construir queries que resolvem problemas reais.
            </p>
            <p>
              A plataforma combina exercícios interativos com um sistema de progressão: você ganha XP ao completar
              etapas, sobe de nível, conquista badges e compete no ranking global. O objetivo é tornar o aprendizado de
              SQL tão envolvente quanto um jogo — e tão sólido quanto um curso profissional.
            </p>
          </Section>

          <Section title="Nossa missão">
            <p>
              Acreditamos que SQL é uma das habilidades mais valiosas da era dos dados — e que o acesso a um aprendizado
              de qualidade não deve depender de quanto você pode pagar. Por isso, o SQLQuest é <strong className="text-white">gratuito</strong> em seu núcleo: todas as trilhas fundamentais, os exercícios e o sistema de
              progressão estão disponíveis sem custo.
            </p>
            <p>
              Nossa missão é democratizar o conhecimento em SQL para estudantes, profissionais em transição de carreira
              e desenvolvedores brasileiros que querem avançar na área de dados.
            </p>
          </Section>

          <Section title="Como funciona a plataforma?">
            <p>
              O aprendizado no SQLQuest é organizado em <strong className="text-white">trilhas temáticas</strong>, cada uma cobrindo um aspecto específico do SQL — dos fundamentos (SELECT, WHERE, ORDER BY) até técnicas avançadas como Window Functions, CTEs e otimização de queries.
            </p>
            <p>
              Cada trilha é dividida em etapas sequenciais. Em cada etapa você encontra:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Uma explicação teórica clara e objetiva sobre o conceito</li>
              <li>Exemplos com código SQL comentado</li>
              <li>Exercícios práticos com validação automática em tempo real</li>
              <li>Feedback imediato quando sua query está correta — ou dica quando está errada</li>
            </ul>
            <p>
              Ao concluir uma trilha completa, você recebe um <strong className="text-white">certificado digital</strong> verificável, com link público que pode ser compartilhado no LinkedIn ou currículo.
            </p>
          </Section>

          <Section title="Trilhas disponíveis">
            <p>
              O currículo do SQLQuest cobre 21 trilhas, do básico ao profissional:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fundamentos do SQL — SELECT, FROM, WHERE, ORDER BY</li>
              <li>Filtragem e Ordenação — LIKE, BETWEEN, IN, IS NULL</li>
              <li>Funções de Agregação — COUNT, SUM, AVG, GROUP BY, HAVING</li>
              <li>JOINs e Relacionamentos — INNER, LEFT, RIGHT, FULL JOIN</li>
              <li>Subqueries — subconsultas em SELECT, WHERE e FROM</li>
              <li>Manipulação de Dados — INSERT, UPDATE, DELETE</li>
              <li>DDL e Estrutura — CREATE TABLE, ALTER TABLE, constraints</li>
              <li>CTEs e Consultas Avançadas — WITH, recursividade</li>
              <li>Window Functions — ROW_NUMBER, RANK, LAG, LEAD, SUM OVER</li>
              <li>Índices e Performance — EXPLAIN ANALYZE, otimização</li>
              <li>Modelagem de Dados — normalização, design de schemas</li>
              <li>SQL Profissional — stored procedures, views, transações, ACID</li>
              <li>Controle de Acesso, Relatórios, Transações, Funções, Views e mais</li>
            </ul>
          </Section>

          <Section title="Para quem é o SQLQuest?">
            <p>A plataforma foi projetada para atender perfis diferentes:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Iniciantes absolutos</strong> — sem experiência com programação ou bancos de dados, que querem começar do zero com uma linguagem com altíssima empregabilidade
              </li>
              <li>
                <strong className="text-white">Desenvolvedores</strong> — que já trabalham com código mas precisam aprofundar o conhecimento em SQL para construir APIs mais eficientes ou entender melhor os bancos que suas aplicações usam
              </li>
              <li>
                <strong className="text-white">Analistas de dados e BI</strong> — que usam SQL no dia a dia mas querem dominar técnicas avançadas como window functions e otimização de queries
              </li>
              <li>
                <strong className="text-white">Estudantes</strong> — de ciência da computação, sistemas de informação, administração ou qualquer área que precise de SQL para trabalhos acadêmicos ou estágios
              </li>
            </ul>
          </Section>

          <Section title="Tecnologia">
            <p>
              O SQLQuest é construído com tecnologias modernas: Next.js para o frontend e backend, PostgreSQL como banco de dados principal (via Neon) e um motor de validação de SQL embutido que executa e verifica suas queries diretamente no navegador, sem latência de rede.
            </p>
            <p>
              Isso significa que o feedback das suas queries é instantâneo — você não precisa esperar um servidor processar cada resposta.
            </p>
          </Section>

          <Section title="Plano gratuito e Pro">
            <p>
              O SQLQuest é gratuito para todos os usuários. O plano <strong className="text-white">Pro</strong> oferece
              funcionalidades adicionais como acesso antecipado a novas trilhas, modo de revisão de erros passados,
              histórico completo de progresso e suporte prioritário — para quem quer acelerar ainda mais o aprendizado.
            </p>
          </Section>

          <Section title="Contato">
            <p>
              Tem sugestões, encontrou um bug, ou quer propor uma parceria? Entre em contato pelo e-mail{' '}
              <a href="mailto:contato@sqlquest.com.br" className="text-[#a78bfa] hover:underline">
                contato@sqlquest.com.br
              </a>
              .
            </p>
          </Section>
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/5 p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Pronto para começar?</h2>
          <p className="text-white/55 text-sm mb-6 max-w-sm mx-auto">
            Crie sua conta grátis e comece a aprender SQL agora — sem cartão de crédito, sem prazo de expiração.
          </p>
          <Link
            href="/register"
            className="inline-block px-6 py-2.5 rounded-lg bg-[#a78bfa] text-[#080a0f] font-semibold text-sm hover:bg-[#c4b5fd] transition-colors"
          >
            Criar conta grátis
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-2xl mx-auto flex flex-wrap gap-4 justify-between items-center text-xs text-white/30">
          <span>© {new Date().getFullYear()} SQLQuest</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white/60 transition-colors">Início</Link>
            <Link href="/blog" className="hover:text-white/60 transition-colors">Blog</Link>
            <Link href="/privacidade" className="hover:text-white/60 transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-white/60 transition-colors">Termos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
