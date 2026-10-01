import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBell,
  FaBrain,
  FaCheck,
  FaChartLine,
  FaCreditCard,
  FaHandHoldingUsd,
  FaMagic,
  FaShieldAlt,
  FaWallet
} from "react-icons/fa";

import Logo from "../components/Logo";
import "./Landing.css";

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
            <a href="#inteligencia">Inteligência</a>
            <a href="#recursos">Recursos</a>
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
                <a className="landing-btn landing-btn-ghost" href="#como-funciona">
                  Ver como funciona
                </a>
              </div>

              <div className="landing-trust-row">
                <span><FaCheck /> Comece sem custo</span>
                <span><FaCheck /> Acesso pelo celular</span>
                <span><FaShieldAlt /> Seus dados protegidos</span>
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

        <section className="landing-section landing-final-cta">
          <div className="landing-shell landing-final-box">
            <div>
              <span className="landing-eyebrow">TENHA UM RUMO</span>
              <h2>Abra o app sabendo o que fazer com seu dinheiro.</h2>
              <p>Comece gratuitamente e transforme informação financeira em direção.</p>
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
            <span>© 2026 Nethanel Tecnologia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
