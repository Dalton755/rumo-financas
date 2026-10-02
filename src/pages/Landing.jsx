import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBell,
  FaBrain,
  FaCheck,
  FaCheckCircle,
  FaChartLine,
  FaCreditCard,
  FaHandHoldingUsd,
  FaInfoCircle,
  FaLock,
  FaMagic,
  FaReceipt,
  FaShieldAlt,
  FaSyncAlt,
  FaWallet
} from "react-icons/fa";

import Logo from "../components/Logo";
import "./Landing.css";
import "./LandingCommercial.css";

const destaques = [
  {
    icon: <FaBrain />,
    title: "Inteligência que entende o contexto",
    text: "O Rumo conecta movimentações, compromissos, dívidas e padrões para mostrar o que merece sua atenção agora."
  },
  {
    icon: <FaBell />,
    title: "Alertas antes do problema",
    text: "Vencimentos e riscos futuros entram no seu radar antes de virarem surpresa no fim do mês."
  },
  {
    icon: <FaChartLine />,
    title: "Projeção do que vem pela frente",
    text: "Veja como decisões de hoje impactam os próximos dias, semanas e meses."
  },
  {
    icon: <FaWallet />,
    title: "Tudo conectado",
    text: "Contas, despesas, receitas, cartões, metas, dívidas e orçamento trabalham como uma única visão financeira."
  }
];

const exemplos = [
  {
    icon: <FaMagic />,
    kicker: "Despesa recorrente",
    title: "Você registra uma vez. O Rumo organiza o ciclo.",
    text: "Ao identificar uma despesa recorrente, o sistema transforma o lançamento em planejamento futuro sem exigir que você navegue por várias telas."
  },
  {
    icon: <FaHandHoldingUsd />,
    kicker: "Empréstimos",
    title: "Entrada hoje, compromisso amanhã.",
    text: "Ao registrar uma receita de empréstimo, o Rumo entende que existe uma dívida futura e coloca o pagamento dentro da sua visão financeira."
  },
  {
    icon: <FaCreditCard />,
    kicker: "Cartões e compromissos",
    title: "O dinheiro que ainda vai sair também importa.",
    text: "O Rumo cruza compromissos futuros com seu cenário atual para mostrar o que está livre e o que já está comprometido."
  }
];

const comparacao = [
  ["Dashboard, contas e movimentações", true, true],
  ["Relatórios básicos", true, true],
  ["Inteligência financeira", false, true],
  ["Metas e objetivos avançados", false, true],
  ["Gestão de dívidas", false, true],
  ["Projeções financeiras", false, true],
  ["Orçamento por categoria", false, true],
  ["Alertas inteligentes", false, true]
];

function Landing() {
  return (
    <div className="rumo-landing">
      <header className="landing-header">
        <div className="landing-shell landing-header-inner">
          <a href="#inicio" className="landing-brand" aria-label="Rumo - início">
            <Logo width={112} />
          </a>

          <nav className="landing-nav" aria-label="Navegação principal">
            <a href="#como-funciona">Como funciona</a>
            <a href="#recursos">Recursos</a>
            <a href="#planos">Planos</a>
            <a href="#seguranca">Segurança</a>
          </nav>

          <div className="landing-header-actions">
            <Link className="landing-link" to="/entrar">Entrar</Link>
            <Link className="landing-btn landing-btn-small" to="/entrar">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero" id="inicio">
          <div className="landing-shell landing-hero-grid">
            <div className="landing-hero-copy">
              <span className="landing-eyebrow">FINANÇAS COM DIREÇÃO</span>
              <h1>Você não precisa entender de finanças para ter um rumo.</h1>
              <p className="landing-hero-text">
                O Rumo organiza sua vida financeira, entende padrões e mostra o que fazer agora — com menos telas, menos esforço e decisões mais claras.
              </p>

              <div className="landing-hero-actions">
                <Link className="landing-btn" to="/entrar">
                  Começar grátis <FaArrowRight />
                </Link>
                <a className="landing-btn landing-btn-ghost" href="#planos">
                  Ver planos e preços
                </a>
              </div>

              <div className="landing-trust-row">
                <span><FaCheck /> Plano gratuito disponível</span>
                <span><FaCheck /> Premium a partir de R$ 19,90/mês</span>
                <span><FaShieldAlt /> Compra via Mercado Pago</span>
              </div>
            </div>

            <div className="landing-hero-visual" aria-label="Exemplo da inteligência do Rumo">
              <div className="landing-app-card landing-app-card-main">
                <div className="landing-app-top">
                  <div>
                    <span>Seu cenário hoje</span>
                    <strong>Você está no controle</strong>
                  </div>
                  <span className="landing-status-dot">Rumo IA</span>
                </div>

                <div className="landing-balance-block">
                  <span>Saldo livre estimado</span>
                  <strong>R$ 1.840,00</strong>
                  <small>considerando seus próximos compromissos</small>
                </div>

                <div className="landing-insight-card">
                  <div className="landing-insight-icon"><FaBrain /></div>
                  <div>
                    <span>Decisão recomendada</span>
                    <strong>Reserve R$ 420 até sexta-feira.</strong>
                    <p>Há dois compromissos previstos antes da sua próxima entrada.</p>
                  </div>
                </div>

                <div className="landing-mini-grid">
                  <div>
                    <span>Próximos 7 dias</span>
                    <strong>3 compromissos</strong>
                  </div>
                  <div>
                    <span>Risco financeiro</span>
                    <strong className="landing-positive">Baixo</strong>
                  </div>
                </div>
              </div>

              <div className="landing-floating-card landing-floating-card-left">
                <FaBell />
                <div>
                  <span>Alerta inteligente</span>
                  <strong>Conta vence amanhã</strong>
                </div>
              </div>

              <div className="landing-floating-card landing-floating-card-right">
                <FaChartLine />
                <div>
                  <span>Projeção</span>
                  <strong>Semana positiva</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-commercial-bar">
          <div className="landing-shell landing-commercial-bar-grid">
            <div><FaCheckCircle /><span><strong>Comece grátis</strong><small>Sem precisar contratar Premium</small></span></div>
            <div><FaReceipt /><span><strong>Preço claro</strong><small>Você vê valor e periodicidade antes de pagar</small></span></div>
            <div><FaShieldAlt /><span><strong>Checkout protegido</strong><small>Pagamento processado pelo Mercado Pago</small></span></div>
          </div>
        </section>

        <section className="landing-section landing-problem">
          <div className="landing-shell landing-centered-copy">
            <span className="landing-eyebrow">MENOS COMPLEXIDADE</span>
            <h2>O sistema faz a conta. Você entende a decisão.</h2>
            <p>
              Aplicativos financeiros costumam jogar a complexidade para o usuário. O Rumo faz o contrário: você registra o que aconteceu e o sistema conecta o resto.
            </p>
          </div>
        </section>

        <section className="landing-section" id="como-funciona">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <span className="landing-eyebrow">COMO FUNCIONA</span>
              <h2>Do registro à decisão, em poucos passos.</h2>
            </div>

            <div className="landing-steps">
              <article>
                <span className="landing-step-number">01</span>
                <h3>Registre</h3>
                <p>Informe uma entrada, saída ou compromisso como você fala no dia a dia.</p>
              </article>
              <article>
                <span className="landing-step-number">02</span>
                <h3>O Rumo entende</h3>
                <p>O sistema identifica recorrências, dívidas, vencimentos e impacto no seu cenário.</p>
              </article>
              <article>
                <span className="landing-step-number">03</span>
                <h3>Você decide</h3>
                <p>Receba uma visão direta do que precisa de atenção e qual caminho faz mais sentido.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-section landing-dark" id="inteligencia">
          <div className="landing-shell">
            <div className="landing-section-heading landing-section-heading-light">
              <span className="landing-eyebrow">INTELIGÊNCIA RUMO</span>
              <h2>Não é só acompanhar dinheiro. É antecipar decisões.</h2>
              <p>O Rumo foi pensado para perceber relações que normalmente ficam espalhadas em várias telas.</p>
            </div>

            <div className="landing-smart-grid">
              {exemplos.map((item) => (
                <article className="landing-smart-card" key={item.kicker}>
                  <div className="landing-smart-icon">{item.icon}</div>
                  <span>{item.kicker}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="recursos">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <span className="landing-eyebrow">UM APP, UMA VISÃO</span>
              <h2>As ferramentas trabalham juntas.</h2>
              <p>Você não precisa montar o quebra-cabeça. O Rumo conecta os dados para entregar contexto.</p>
            </div>

            <div className="landing-feature-grid">
              {destaques.map((item) => (
                <article className="landing-feature-card" key={item.title}>
                  <div className="landing-feature-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>

            <div className="landing-resource-strip">
              <span>Dashboard</span>
              <span>Movimentações</span>
              <span>Dívidas</span>
              <span>Cartões</span>
              <span>Metas</span>
              <span>Projeções</span>
              <span>Orçamento</span>
              <span>Alertas</span>
            </div>
          </div>
        </section>

        <section className="landing-section landing-pricing-section" id="planos">
          <div className="landing-shell">
            <div className="landing-section-heading landing-pricing-heading">
              <span className="landing-eyebrow">PREÇO SEM PEGADINHA</span>
              <h2>Comece grátis. Assine o Premium quando fizer sentido.</h2>
              <p>
                O Rumo não força a compra para você começar. Use o plano Gratuito e, se quiser inteligência, projeções e recursos avançados, escolha uma assinatura Premium.
              </p>
            </div>

            <div className="landing-pricing-grid">
              <article className="landing-price-card landing-price-free">
                <span className="landing-plan-label">GRATUITO</span>
                <h3>Para organizar a vida financeira</h3>
                <div className="landing-price"><strong>R$ 0</strong><span>/ mês</span></div>
                <p>Entre, registre e acompanhe sua rotina sem precisar contratar o Premium.</p>
                <ul>
                  <li><FaCheck /> Dashboard financeiro</li>
                  <li><FaCheck /> Contas e movimentações</li>
                  <li><FaCheck /> Relatórios básicos</li>
                </ul>
                <Link className="landing-btn landing-btn-ghost landing-price-button" to="/entrar">
                  Criar conta grátis
                </Link>
              </article>

              <article className="landing-price-card landing-price-premium">
                <div className="landing-most-popular">PREMIUM</div>
                <span className="landing-plan-label">MENSAL</span>
                <h3>Para antecipar e decidir melhor</h3>
                <div className="landing-price"><strong>R$ 19,90</strong><span>/ mês</span></div>
                <p>Assinatura recorrente com renovação mensal até que seja encerrada.</p>
                <ul>
                  <li><FaCheck /> Tudo do Gratuito</li>
                  <li><FaCheck /> Inteligência financeira</li>
                  <li><FaCheck /> Dívidas, metas e objetivos</li>
                  <li><FaCheck /> Projeções e orçamento</li>
                  <li><FaCheck /> Alertas inteligentes</li>
                </ul>
                <Link className="landing-btn landing-price-button" to="/entrar">
                  Entrar para assinar <FaArrowRight />
                </Link>
              </article>

              <article className="landing-price-card landing-price-annual">
                <span className="landing-plan-label">PREMIUM ANUAL</span>
                <h3>O mesmo Premium, pagando menos no ano</h3>
                <div className="landing-price"><strong>R$ 199,00</strong><span>/ ano</span></div>
                <div className="landing-saving-badge">Economia de R$ 39,80 por ano</div>
                <p>Assinatura recorrente com renovação a cada 12 meses.</p>
                <ul>
                  <li><FaCheck /> Todos os recursos Premium</li>
                  <li><FaCheck /> Uma cobrança a cada 12 meses</li>
                  <li><FaCheck /> Melhor custo anual</li>
                </ul>
                <Link className="landing-btn landing-btn-dark landing-price-button" to="/entrar">
                  Escolher anual <FaArrowRight />
                </Link>
              </article>
            </div>

            <div className="landing-price-note">
              <FaInfoCircle />
              <span>
                A contratação do Premium acontece depois do login. Antes de confirmar o pagamento, o checkout do Mercado Pago apresenta o valor da assinatura e a periodicidade escolhida.
              </span>
            </div>

            <div className="landing-plan-comparison">
              <div className="landing-plan-comparison-head">
                <span>Recurso</span><strong>Gratuito</strong><strong>Premium</strong>
              </div>
              {comparacao.map(([recurso, gratuito, premium]) => (
                <div className="landing-plan-comparison-row" key={recurso}>
                  <span>{recurso}</span>
                  <span className={gratuito ? "is-yes" : "is-no"}>{gratuito ? "✓" : "—"}</span>
                  <span className={premium ? "is-yes" : "is-no"}>{premium ? "✓" : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-security-section" id="seguranca">
          <div className="landing-shell landing-security-grid">
            <div className="landing-security-copy">
              <span className="landing-eyebrow">COMPRA SEGURA E TRANSPARENTE</span>
              <h2>Você sabe o que está contratando antes de pagar.</h2>
              <p>
                O Rumo usa o Mercado Pago para processar a assinatura. O pagamento é concluído no ambiente do provedor, sem o Rumo receber os dados completos do seu cartão.
              </p>

              <div className="landing-security-points">
                <div><FaShieldAlt /><span><strong>Pagamento processado pelo Mercado Pago</strong><small>O checkout é aberto no ambiente do provedor de pagamento.</small></span></div>
                <div><FaLock /><span><strong>Dados de pagamento fora do Rumo</strong><small>O app recebe o status da assinatura; os dados completos do cartão não são armazenados pelo Rumo.</small></span></div>
                <div><FaReceipt /><span><strong>Preço e periodicidade visíveis</strong><small>Mensal: R$ 19,90. Anual: R$ 199,00. A renovação segue o período escolhido.</small></span></div>
                <div><FaSyncAlt /><span><strong>Renovação explicada antes da compra</strong><small>Mensal renova todo mês; anual renova a cada 12 meses.</small></span></div>
              </div>
            </div>

            <aside className="landing-payment-card">
              <div className="landing-payment-seal"><FaShieldAlt /> PAGAMENTO PROTEGIDO</div>
              <h3>Checkout Mercado Pago</h3>
              <p>Os meios de pagamento disponíveis para sua conta são apresentados diretamente pelo Mercado Pago no momento da contratação.</p>
              <div className="landing-payment-summary">
                <div><span>Plano mensal</span><strong>R$ 19,90</strong></div>
                <div><span>Plano anual</span><strong>R$ 199,00</strong></div>
                <div><span>Plano gratuito</span><strong>R$ 0</strong></div>
              </div>
              <div className="landing-payment-foot"><FaCreditCard /> Você só paga depois de escolher um plano e confirmar no checkout.</div>
            </aside>
          </div>
        </section>

        <section className="landing-section landing-final-cta">
          <div className="landing-shell landing-final-box">
            <div>
              <span className="landing-eyebrow">TENHA UM RUMO</span>
              <h2>Comece sem pagar. Evolua quando fizer sentido.</h2>
              <p>Crie sua conta gratuita, conheça o Rumo e decida depois se os recursos Premium fazem sentido para você.</p>
            </div>
            <Link className="landing-btn landing-btn-light" to="/entrar">
              Criar minha conta <FaArrowRight />
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <div className="landing-footer-brand">
            <Logo width={96} />
            <span>Um produto Nethanel Tecnologia</span>
          </div>
          <div className="landing-footer-links">
            <Link to="/entrar">Entrar</Link>
            <a href="#recursos">Recursos</a>
            <a href="#planos">Planos</a>
            <a href="#seguranca">Segurança</a>
            <span>© 2026 Nethanel Tecnologia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
