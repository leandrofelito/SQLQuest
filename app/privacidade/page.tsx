import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de privacidade — SQLQuest',
  description:
    'Como o SQLQuest trata dados pessoais, cookies e publicidade (Google AdSense).',
  robots: { index: true, follow: true },
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white/90">
      <div className="max-w-2xl mx-auto px-6 py-12 pb-24">
        <p className="text-xs text-white/40 mb-6">
          <Link href="/login" className="text-[#a78bfa] hover:underline">
            ← Voltar ao login
          </Link>
        </p>
        <h1 className="text-2xl font-bold text-white mb-2">Política de privacidade</h1>
        <p className="text-sm text-white/45 mb-10">Última atualização: abril de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-white/80">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Quem somos</h2>
            <p>
              O SQLQuest é uma plataforma de aprendizado de SQL. Esta página descreve como tratamos
              dados e tecnologias no site e em experiências web relacionadas.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. Dados que você nos fornece</h2>
            <p>
              Para criar conta e usar o serviço, podemos tratar nome (ou apelido), e-mail, progresso
              em trilhas, pontuação e dados necessários para autenticação e suporte. O tratamento
              segue a finalidade de prestação do serviço e melhoria da experiência.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. Cookies e armazenamento local</h2>
            <p>
              Utilizamos cookies e armazenamento do navegador para manter sua sessão, preferências e
              recursos de segurança. Você pode limpar cookies nas configurações do navegador; isso
              pode afetar o funcionamento do login.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">4. Publicidade (Google AdSense)</h2>
            <p>
              Usuários que não são assinantes Pro podem ver anúncios exibidos pelo{' '}
              <a
                href="https://policies.google.com/technologies/ads"
                className="text-[#a78bfa] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google AdSense
              </a>
              . O Google pode usar cookies ou identificadores para personalizar ou medir anúncios,
              conforme as políticas do Google. Você pode gerenciar preferências de anúncios
              personalizados nas configurações do Google ou do seu dispositivo.
            </p>
            <p>
              O arquivo{' '}
              <a href="/ads.txt" className="text-[#a78bfa] hover:underline">
                /ads.txt
              </a>{' '}
              declara vendedores autorizados de inventário publicitário, conforme padrão da
              indústria.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">5. Retenção e segurança</h2>
            <p>
              Adotamos medidas razoáveis para proteger suas informações. Os dados são mantidos pelo
              tempo necessário para operar a plataforma e cumprir obrigações legais.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">6. Seus direitos</h2>
            <p>
              Conforme a legislação aplicável (por exemplo, a LGPD no Brasil), você pode solicitar
              acesso, correção ou exclusão de dados pessoais, entre outros direitos, entrando em
              contato pelo canal indicado no site ou no rodapé das comunicações.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">7. Alterações</h2>
            <p>
              Podemos atualizar esta política para refletir mudanças no serviço ou na legislação. A
              data no topo desta página indica a revisão mais recente.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
