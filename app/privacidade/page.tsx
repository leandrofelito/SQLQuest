import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade — SQLQuest',
  description: 'Como o SQLQuest coleta, usa e protege seus dados pessoais.',
  robots: { index: true, follow: true },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <div className="text-sm leading-relaxed text-white/75 space-y-3">{children}</div>
    </section>
  )
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

        <h1 className="text-2xl font-bold text-white mb-1">Política de Privacidade</h1>
        <p className="text-sm text-white/45 mb-10">Última atualização: abril de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-white/75">

          <Section title="1. Controlador dos dados">
            <p>
              O SQLQuest é o controlador dos dados pessoais coletados nesta plataforma, nos termos
              da Lei n.º 13.709/2018 (Lei Geral de Proteção de Dados — LGPD). É responsável por
              definir como e por que seus dados são utilizados.
            </p>
            <p>
              Para entrar em contato com o encarregado de dados (DPO), envie um e-mail para{' '}
              <a href="mailto:contato@sqlquest.com.br" className="text-[#a78bfa] hover:underline">
                contato@sqlquest.com.br
              </a>
              .
            </p>
          </Section>

          <Section title="2. Quais dados pessoais coletamos">
            <p>Coletamos os seguintes dados pessoais para operar a plataforma:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Nome ou apelido (nickname) escolhido no cadastro</li>
              <li>Endereço de e-mail</li>
              <li>Dados de autenticação (identificador de sessão, token de acesso)</li>
              <li>Progresso nas trilhas de aprendizado e pontuações</li>
              <li>Dados técnicos de acesso: endereço IP, tipo de navegador e sistema operacional</li>
            </ul>
            <p>
              Não coletamos dados sensíveis, como informações de saúde, origem racial ou etnia,
              opiniões políticas ou crenças religiosas.
            </p>
          </Section>

          <Section title="3. Finalidade e base legal do tratamento">
            <p>
              Seus dados são tratados com base nas seguintes hipóteses legais previstas na LGPD:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                <strong className="text-white/90">Execução de contrato</strong> — para criar e
                manter sua conta, registrar seu progresso e fornecer o serviço contratado (art. 7.º,
                V da LGPD).
              </li>
              <li>
                <strong className="text-white/90">Legítimo interesse</strong> — para garantir a
                segurança da plataforma, prevenir fraudes e melhorar a experiência do usuário (art.
                7.º, IX da LGPD).
              </li>
              <li>
                <strong className="text-white/90">Consentimento</strong> — para exibição de
                publicidade personalizada por meio do Google AdSense, quando aplicável (art. 7.º, I
                da LGPD).
              </li>
            </ul>
          </Section>

          <Section title="4. Cookies e tecnologias de rastreamento">
            <p>
              Utilizamos cookies e mecanismos de armazenamento local do navegador para as seguintes
              finalidades:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Manter a sessão autenticada durante o uso da plataforma</li>
              <li>Armazenar preferências de navegação</li>
              <li>Garantir funcionalidades de segurança</li>
            </ul>
            <p>
              Você pode recusar ou excluir cookies a qualquer momento nas configurações do seu
              navegador. A exclusão de cookies de sessão resultará na desconexão da sua conta.
            </p>
          </Section>

          <Section title="5. Publicidade — Google AdSense">
            <p>
              Usuários que utilizam o plano gratuito do SQLQuest podem visualizar anúncios
              fornecidos pelo Google AdSense. O Google, na condição de operador independente, pode
              usar cookies e identificadores de dispositivo para personalizar e mensurar anúncios,
              de acordo com sua própria{' '}
              <a
                href="https://policies.google.com/technologies/ads"
                className="text-[#a78bfa] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Política de Privacidade e Publicidade
              </a>
              .
            </p>
            <p>
              Para ajustar ou retirar seu consentimento para anúncios personalizados, acesse as{' '}
              <a
                href="https://adssettings.google.com"
                className="text-[#a78bfa] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                configurações de anúncios do Google
              </a>
              . Assinantes do plano Pro não estão sujeitos à exibição de anúncios.
            </p>
            <p>
              O arquivo{' '}
              <a href="/ads.txt" className="text-[#a78bfa] hover:underline">
                /ads.txt
              </a>{' '}
              declara os vendedores autorizados de inventário publicitário desta plataforma,
              conforme o padrão IAB Tech Lab.
            </p>
          </Section>

          <Section title="6. Compartilhamento de dados">
            <p>
              Não vendemos, alugamos nem comercializamos seus dados pessoais com terceiros. O
              compartilhamento ocorre apenas nas seguintes situações:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                Com fornecedores de infraestrutura (hospedagem, banco de dados), vinculados por
                obrigações contratuais de confidencialidade
              </li>
              <li>Com o Google, nos limites da exibição de anúncios descrita na seção 5</li>
              <li>Quando exigido por ordem judicial ou autoridade competente</li>
            </ul>
          </Section>

          <Section title="7. Prazo de retenção dos dados">
            <p>
              Seus dados pessoais são mantidos pelo período em que sua conta estiver ativa ou pelo
              tempo necessário para cumprir as finalidades descritas nesta política. Após a exclusão
              da conta, os dados são removidos ou anonimizados, salvo quando a retenção for exigida
              por obrigação legal.
            </p>
          </Section>

          <Section title="8. Segurança dos dados">
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais
              contra acesso não autorizado, perda, alteração ou divulgação indevida. Isso inclui o
              uso de conexões criptografadas (HTTPS) e controles de acesso restritos aos sistemas
              da plataforma.
            </p>
            <p>
              Em caso de incidente de segurança que possa afetar seus dados, notificaremos a
              Autoridade Nacional de Proteção de Dados (ANPD) e os titulares afetados nos prazos
              previstos pela LGPD.
            </p>
          </Section>

          <Section title="9. Seus direitos como titular de dados">
            <p>
              Nos termos dos arts. 17 a 22 da LGPD, você tem direito a:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar os dados que temos sobre você</li>
              <li>Solicitar a correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Solicitar a portabilidade dos seus dados a outro fornecedor de serviço</li>
              <li>Revogar o consentimento dado, a qualquer momento</li>
              <li>Opor-se ao tratamento realizado com base em legítimo interesse</li>
            </ul>
            <p>
              Para exercer qualquer desses direitos, entre em contato pelo e-mail{' '}
              <a href="mailto:contato@sqlquest.com.br" className="text-[#a78bfa] hover:underline">
                contato@sqlquest.com.br
              </a>
              . Responderemos no prazo de 15 dias corridos.
            </p>
          </Section>

          <Section title="10. Alterações nesta política">
            <p>
              Esta política pode ser atualizada periodicamente para refletir mudanças no serviço,
              na legislação ou em nossas práticas. A data no topo desta página indica a versão mais
              recente. Em caso de alterações relevantes, notificaremos os usuários pelo e-mail
              cadastrado ou por aviso na plataforma.
            </p>
          </Section>

        </div>
      </div>
    </div>
  )
}
