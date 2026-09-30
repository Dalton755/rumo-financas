import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  CreditCard,
  Gauge,
  PiggyBank,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import { usePlano } from "../context/PlanoContext";

import { listarProximosCompromissos } from "../services/compromissos";
import { listarDividas } from "../services/dividas";
import { listarCartoes } from "../services/cartoes";
import { listarMetas } from "../services/metas";

import "./Planejamento.css";

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function Planejamento() {
  const { temRecurso } = usePlano();

  const [compromissos, setCompromissos] = useState([]);
  const [dividas, setDividas] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);

      const resultados = await Promise.allSettled([
        listarProximosCompromissos({ dias: 30, limite: 8 }),
        temRecurso("DIVIDAS") ? listarDividas() : Promise.resolve([]),
        temRecurso("CARTOES") ? listarCartoes() : Promise.resolve([]),
        temRecurso("METAS") ? listarMetas() : Promise.resolve([]),
      ]);

      if (!ativo) return;

      setCompromissos(
        resultados[0].status === "fulfilled"
          ? resultados[0].value || []
          : []
      );
      setDividas(
        resultados[1].status === "fulfilled"
          ? resultados[1].value || []
          : []
      );
      setCartoes(
        resultados[2].status === "fulfilled"
          ? resultados[2].value || []
          : []
      );
      setMetas(
        resultados[3].status === "fulfilled"
          ? resultados[3].value || []
          : []
      );

      setCarregando(false);
    }

    carregar();

    const atualizar = () => carregar();
    window.addEventListener("rumo:dados-atualizados", atualizar);

    return () => {
      ativo = false;
      window.removeEventListener("rumo:dados-atualizados", atualizar);
    };
  }, [temRecurso]);

  const totalCompromissos = useMemo(
    () =>
      compromissos.reduce(
        (total, item) =>
          total +
          Number(item.valor_real ?? item.valor_previsto ?? 0),
        0
      ),
    [compromissos]
  );

  const dividasAbertas = useMemo(
    () => dividas.filter((item) => item.status !== "quitada"),
    [dividas]
  );

  const saldoDividas = useMemo(
    () =>
      dividasAbertas.reduce(
        (total, item) => total + Number(item.saldo_atual || 0),
        0
      ),
    [dividasAbertas]
  );

  const limiteUsado = useMemo(
    () =>
      cartoes.reduce(
        (total, item) => total + Number(item.limite_usado || 0),
        0
      ),
    [cartoes]
  );

  const metasAtivas = useMemo(
    () =>
      metas.filter(
        (item) =>
          !["concluida", "cancelada"].includes(
            String(item.status || "").toLowerCase()
          )
      ),
    [metas]
  );

  const progressoMetas = useMemo(() => {
    const alvo = metasAtivas.reduce(
      (total, item) => total + Number(item.valor_meta || 0),
      0
    );
    const atual = metasAtivas.reduce(
      (total, item) => total + Number(item.valor_atual || 0),
      0
    );

    if (!alvo) return 0;
    return Math.min(100, Math.round((atual / alvo) * 100));
  }, [metasAtivas]);

  const proximoCompromisso = compromissos[0];

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          titulo="Planejamento"
          subtitulo="Um lugar para entender o que vem pela frente. O Rumo organiza as ferramentas por você."
        />

        <section className="planejamento-hero">
          <div className="planejamento-hero-icon">
            <Sparkles size={20} />
          </div>

          <div className="planejamento-hero-copy">
            <span>Seu dinheiro, sem caça ao menu</span>
            <strong>
              {carregando
                ? "Organizando seu próximo passo..."
                : proximoCompromisso
                  ? `Próximo compromisso: ${proximoCompromisso.compromisso?.nome || "pagamento"}`
                  : "Nenhum compromisso urgente nos próximos 30 dias"}
            </strong>
            <p>
              Cadastre uma vez. Recorrências, dívidas, cartões, metas e projeções
              continuam existindo por baixo — aqui você só vê o que precisa decidir.
            </p>
          </div>

          <Link to="/projecoes" className="planejamento-hero-action">
            Ver próximos dias
            <ArrowRight size={15} />
          </Link>
        </section>

        <section className="planejamento-resumo">
          <Link to="/compromissos" className="planejamento-card">
            <span className="planejamento-card-icon">
              <CalendarClock size={19} />
            </span>
            <div>
              <small>Próximos 30 dias</small>
              <strong>{moeda(totalCompromissos)}</strong>
              <span>{compromissos.length} compromisso(s) previsto(s)</span>
            </div>
            <ArrowRight size={15} />
          </Link>

          <Link to="/dividas" className="planejamento-card">
            <span className="planejamento-card-icon">
              <CreditCard size={19} />
            </span>
            <div>
              <small>Dívidas em aberto</small>
              <strong>
                {temRecurso("DIVIDAS") ? moeda(saldoDividas) : "Premium"}
              </strong>
              <span>
                {temRecurso("DIVIDAS")
                  ? `${dividasAbertas.length} dívida(s) acompanhada(s)`
                  : "Acompanhamento e plano de quitação"}
              </span>
            </div>
            <ArrowRight size={15} />
          </Link>

          <Link to="/cartoes" className="planejamento-card">
            <span className="planejamento-card-icon">
              <WalletCards size={19} />
            </span>
            <div>
              <small>Cartões</small>
              <strong>
                {temRecurso("CARTOES") ? moeda(limiteUsado) : "Premium"}
              </strong>
              <span>
                {temRecurso("CARTOES")
                  ? "Comprometido em compras ativas"
                  : "Parcelas e faturas no seu Rumo"}
              </span>
            </div>
            <ArrowRight size={15} />
          </Link>

          <Link to="/metas" className="planejamento-card">
            <span className="planejamento-card-icon">
              <Target size={19} />
            </span>
            <div>
              <small>Metas</small>
              <strong>
                {temRecurso("METAS") ? `${progressoMetas}%` : "Premium"}
              </strong>
              <span>
                {temRecurso("METAS")
                  ? `${metasAtivas.length} meta(s) ativa(s)`
                  : "Objetivos acompanhados automaticamente"}
              </span>
            </div>
            <ArrowRight size={15} />
          </Link>
        </section>

        <section className="planejamento-acoes">
          <div className="planejamento-section-title">
            <div>
              <span>Quando precisar aprofundar</span>
              <h2>Ferramentas avançadas</h2>
            </div>
            <p>
              Elas continuam disponíveis, mas não ficam mais no caminho do uso diário.
            </p>
          </div>

          <div className="planejamento-action-grid">
            <Link to="/projecoes">
              <TrendingUp size={18} />
              <span>
                <strong>Projeção</strong>
                <small>Veja saldo futuro e vencimentos</small>
              </span>
              <ArrowRight size={14} />
            </Link>

            <Link to="/orcamento">
              <Gauge size={18} />
              <span>
                <strong>Orçamento</strong>
                <small>Defina limites por categoria</small>
              </span>
              <ArrowRight size={14} />
            </Link>

            <Link to="/objetivos">
              <PiggyBank size={18} />
              <span>
                <strong>Objetivos</strong>
                <small>Organize planos de médio e longo prazo</small>
              </span>
              <ArrowRight size={14} />
            </Link>

            <Link to="/inteligencia">
              <Sparkles size={18} />
              <span>
                <strong>Rumo IA</strong>
                <small>Pergunte antes de tomar uma decisão</small>
              </span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </PageContainer>
    </MainLayout>
  );
}

export default Planejamento;
