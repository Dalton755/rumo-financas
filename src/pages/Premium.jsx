import { useState } from "react";
import { Link } from "react-router-dom";

import {
  BellRing,
  BrainCircuit,
  Check,
  ChevronRight,
  Crown,
  CreditCard,
  LockKeyhole,
  PieChart,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import { usePlano } from "../context/PlanoContext";
import { supabase } from "../services/supabase";

import "./Premium.css";

const recursos = [
  {
    Icone: BrainCircuit,
    titulo: "Inteligência Financeira",
    descricao:
      "Análises automáticas, tendências e insights baseados nos seus próprios dados.",
  },
  {
    Icone: Target,
    titulo: "Metas Financeiras",
    descricao:
      "Transforme planos em metas mensuráveis e acompanhe o progresso.",
  },
  {
    Icone: Trophy,
    titulo: "Objetivos",
    descricao:
      "Planeje sonhos e descubra quanto precisa reservar para alcançá-los.",
  },
  {
    Icone: CreditCard,
    titulo: "Gestão de Dívidas",
    descricao:
      "Organize dívidas e construa uma estratégia clara de quitação.",
  },
  {
    Icone: TrendingUp,
    titulo: "Projeções",
    descricao:
      "Enxergue cenários futuros antes de assumir novos compromissos.",
  },
  {
    Icone: PieChart,
    titulo: "Orçamento",
    descricao:
      "Defina limites por categoria e acompanhe seus gastos durante o mês.",
  },
  {
    Icone: BellRing,
    titulo: "Alertas Inteligentes",
    descricao:
      "Receba avisos quando algo importante nas suas finanças exigir atenção.",
  },
  
];

const comparacao = [
  {
    recurso: "Dashboard financeiro",
    gratuito: true,
    premium: true,
  },
  {
    recurso: "Contas",
    gratuito: true,
    premium: true,
  },
  {
    recurso: "Movimentações",
    gratuito: true,
    premium: true,
  },
  {
    recurso: "Relatórios básicos",
    gratuito: true,
    premium: true,
  },
  {
    recurso: "Inteligência financeira",
    gratuito: false,
    premium: true,
  },
  {
    recurso: "Metas e objetivos avançados",
    gratuito: false,
    premium: true,
  },
  {
    recurso: "Gestão de dívidas",
    gratuito: false,
    premium: true,
  },
  {
    recurso: "Projeções financeiras",
    gratuito: false,
    premium: true,
  },
  {
    recurso: "Orçamento por categoria",
    gratuito: false,
    premium: true,
  },
  {
    recurso: "Alertas inteligentes",
    gratuito: false,
    premium: true,
  },
  
];

function Premium() {
  const { premium } = usePlano();

  const [checkoutCarregando, setCheckoutCarregando] =
    useState(null);

  const [erroCheckout, setErroCheckout] =
    useState("");

  async function contratarPremium(periodo) {
    try {
      setErroCheckout("");
      setCheckoutCarregando(periodo);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Sua sessão expirou. Entre novamente no Rumo."
        );
      }

      const resposta = await fetch(
        "/api/mercadopago/checkout",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            periodo,
          }),
        }
      );

      const resultado =
        await resposta.json();

      if (
        !resposta.ok ||
        !resultado?.success
      ) {
        throw new Error(
          resultado?.error ??
          "Não foi possível iniciar a assinatura."
        );
      }

      if (!resultado?.checkout_url) {
        throw new Error(
          "O Mercado Pago não retornou a URL do checkout."
        );
      }

      window.location.href =
        resultado.checkout_url;

    } catch (error) {
      console.error(
        "[RUMO PREMIUM] Erro ao criar checkout:",
        error
      );

      setErroCheckout(
        error?.message ??
        "Não foi possível iniciar a assinatura."
      );

    } finally {
      setCheckoutCarregando(null);
    }
  }

  return (
    <MainLayout>
      <PageContainer>
        <section className="premium-page-hero">
          <div className="premium-page-hero-conteudo">
            <span className="premium-page-badge">
              <Crown size={16} />
              Rumo Premium
            </span>

            <h1>
              Seu dinheiro mostra o presente.
              <span> O Premium ajuda você a enxergar o próximo passo.</span>
            </h1>

            <p>
              Vá além do simples registro de receitas e despesas.
              Use planejamento, inteligência e acompanhamento para
              entender melhor suas escolhas financeiras.
            </p>

            <div className="premium-page-hero-actions">
              {premium ? (
                <div className="premium-page-ja-premium">
                  <Check size={19} />
                  Você já possui o Rumo Premium
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="premium-page-cta"
                    disabled={Boolean(checkoutCarregando)}
                    onClick={() =>
                      contratarPremium("MENSAL")
                    }
                  >
                    <Sparkles size={19} />

                    {checkoutCarregando === "MENSAL"
                      ? "Abrindo checkout..."
                      : "Assinar Mensal — R$ 19,90"}

                    <ChevronRight size={19} />
                  </button>

                  <button
                    type="button"
                    className="premium-page-cta"
                    disabled={Boolean(checkoutCarregando)}
                    onClick={() =>
                      contratarPremium("ANUAL")
                    }
                  >
                    <Crown size={19} />

                    {checkoutCarregando === "ANUAL"
                      ? "Abrindo checkout..."
                      : (
                        <span className="premium-page-plano-anual-texto">
                          <span>Assinar Anual — R$ 199,00</span>

                          <span className="premium-page-economia">
                            Economize R$ 39,80 por ano
                          </span>
                        </span>
                      )}

                    <ChevronRight size={19} />
                  </button>
                </>
              )}

              <Link
                to="/dashboard"
                className="premium-page-voltar"
              >
                Continuar no Gratuito
              </Link>


            </div>

            {!premium && erroCheckout && (
              <div
                style={{
                  marginTop: "12px",
                  fontWeight: 600,
                }}
              >
                {erroCheckout}
              </div>
            )}

            {!premium && (
              <span className="premium-page-sem-compromisso">
                Seu plano Gratuito continuará disponível normalmente.
              </span>
            )}
          </div>

          <div className="premium-page-hero-preview">
            <div className="premium-page-preview-card">
              <div className="premium-page-preview-top">
                <div>
                  <span>LEITURA DO RUMO</span>
                  <h3>Sua visão financeira</h3>
                </div>

                <span className="premium-page-pro">
                  PRO
                </span>
              </div>

              <div className="premium-page-preview-metricas">
                <article>
                  <span>Taxa de economia</span>
                  <strong>59,6%</strong>

                  <div className="premium-page-progress">
                    <div style={{ width: "60%" }} />
                  </div>
                </article>

                <article>
                  <span>Saldo projetado</span>
                  <strong>R$ 8.750</strong>
                  <small>Próximos 90 dias</small>
                </article>

                <article>
                  <span>Meta principal</span>
                  <strong>68%</strong>

                  <div className="premium-page-progress">
                    <div style={{ width: "68%" }} />
                  </div>
                </article>

                <article>
                  <span>Orçamento</span>
                  <strong>Dentro do limite</strong>
                  <small>3 categorias acompanhadas</small>
                </article>
              </div>

              <div className="premium-page-preview-insight">
                <Sparkles size={19} />

                <div>
                  <span>INSIGHT DO RUMO</span>
                  <p>
                    Seus gastos diminuíram e sua taxa de economia
                    permanece positiva. Você está criando espaço para
                    avançar nas suas metas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="premium-page-section">
          <div className="premium-page-section-title">
            <span>O QUE VOCÊ DESBLOQUEIA</span>

            <h2>
              Um Rumo mais completo para suas decisões financeiras
            </h2>

            <p>
              Cada módulo foi pensado para responder uma pergunta
              importante da sua vida financeira.
            </p>
          </div>

          <div className="premium-page-recursos">
            {recursos.map(
              ({
                Icone,
                titulo,
                descricao,
                observacao,
              }) => (
                <article
                  className="premium-page-recurso"
                  key={titulo}
                >
                  <div className="premium-page-recurso-icon">
                    <Icone size={23} />
                  </div>

                  <h3>{titulo}</h3>

                  <p>{descricao}</p>

                  {observacao && (
                    <span className="premium-page-em-breve">
                      {observacao}
                    </span>
                  )}
                </article>
              )
            )}
          </div>
        </section>

        <section className="premium-page-comparacao-section">
          <div className="premium-page-section-title">
            <span>COMPARE OS PLANOS</span>

            <h2>
              Gratuito para organizar. Premium para avançar.
            </h2>
          </div>

          <div className="premium-page-comparacao">
            <div className="premium-page-comparacao-header">
              <span>Recurso</span>
              <strong>Gratuito</strong>

              <strong className="premium-page-coluna-premium">
                Premium
              </strong>
            </div>

            {comparacao.map((item) => (
              <div
                className="premium-page-comparacao-row"
                key={item.recurso}
              >
                <span>{item.recurso}</span>

                <div>
                  {item.gratuito ? (
                    <Check
                      className="premium-page-check"
                      size={20}
                    />
                  ) : (
                    <X
                      className="premium-page-x"
                      size={18}
                    />
                  )}
                </div>

                <div className="premium-page-coluna-premium">
                  <Check
                    className="premium-page-check"
                    size={20}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-page-final">
          <div className="premium-page-final-icon">
            {premium ? (
              <Crown size={30} />
            ) : (
              <LockKeyhole size={30} />
            )}
          </div>

          {premium ? (
            <>
              <span>SEU PLANO</span>

              <h2>
                Você já está no Rumo Premium.
              </h2>

              <p>
                Continue explorando os recursos Premium disponíveis
                na barra lateral.
              </p>

              <Link
                to="/inteligencia"
                className="premium-page-cta premium-page-link-cta"
              >
                <BrainCircuit size={19} />
                Abrir Inteligência Financeira
                <ChevronRight size={19} />
              </Link>
            </>
          ) : (
            <>
              <span>PRONTO PARA IR ALÉM?</span>

              <h2>
                Organizar é o começo. Planejar o próximo passo muda o jogo.
              </h2>

              <p>
                Conheça todos os recursos do Rumo Premium antes
                de decidir pela assinatura.
              </p>

              <div className="premium-page-hero-actions">
                <button
                  type="button"
                  className="premium-page-cta"
                  disabled={Boolean(checkoutCarregando)}
                  onClick={() =>
                    contratarPremium("MENSAL")
                  }
                >
                  <Sparkles size={19} />

                  {checkoutCarregando === "MENSAL"
                    ? "Abrindo checkout..."
                    : "Mensal — R$ 19,90"}

                  <ChevronRight size={19} />
                </button>

                <button
                  type="button"
                  className="premium-page-cta"
                  disabled={Boolean(checkoutCarregando)}
                  onClick={() =>
                    contratarPremium("ANUAL")
                  }
                >
                  <Crown size={19} />

                  {checkoutCarregando === "ANUAL"
                    ? "Abrindo checkout..."
                    : (
                      <span className="premium-page-plano-anual-texto">
                        <span>Anual — R$ 199,00</span>

                        <span className="premium-page-economia">
                          Economize R$ 39,80 por ano
                        </span>
                      </span>
                    )}

                  <ChevronRight size={19} />
                </button>
              </div>
            </>
          )}
        </section>
      </PageContainer>
    </MainLayout>
  );
}

export default Premium;
