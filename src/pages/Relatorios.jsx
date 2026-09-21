import {
  useEffect,
  useState
} from "react";

import {
  ArrowRight,
  BarChart3,
  Sparkles
} from "lucide-react";

import { Link } from "react-router-dom";

import { usePlano } from "../context/PlanoContext";
import { supabase } from "../services/supabase";

import RelatoriosPremium from "./RelatoriosPremium";

import GraficoCategorias from "../components/GraficoCategorias";
import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

import "./Relatorios.css";

function Relatorios() {
  const {
    premium,
    carregandoPlano
  } = usePlano();

  const [dados, setDados] =
    useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const {
      data: { user }
    } =
      await supabase
        .auth
        .getUser();

    if (!user) {
      setDados([]);
      return;
    }

    const {
      data,
      error
    } =
      await supabase
        .schema("rumo")
        .from(
          "vw_gastos_categoria"
        )
        .select("*")
        .eq(
          "usuario_id",
          user.id
        )
        .order(
          "total",
          {
            ascending: false
          }
        );

    if (error) {
      console.error(
        "Erro ao carregar relatórios:",
        error
      );
      return;
    }

    setDados(
      data || []
    );
  }

  if (carregandoPlano) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="relatorios-loading">
            <BarChart3 size={25} />

            <strong>
              Preparando seus relatórios
            </strong>

            <span>
              Organizando seus dados financeiros...
            </span>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  if (premium) {
    return (
      <RelatoriosPremium />
    );
  }

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          titulo="Relatórios"
          subtitulo="Entenda com clareza para onde seu dinheiro está indo."
        />

        <section className="relatorios-basico-card">
          <div className="relatorios-basico-header">
            <div>
              <span>
                Distribuição de gastos
              </span>

              <h2>
                Gastos por categoria
              </h2>
            </div>
          </div>

          {dados.length > 0 ? (
            <GraficoCategorias
              dados={dados}
            />
          ) : (
            <div className="relatorios-vazio">
              <BarChart3
                size={24}
              />

              <strong>
                Ainda não há dados suficientes
              </strong>

              <span>
                Registre despesas para visualizar a distribuição por categoria.
              </span>
            </div>
          )}
        </section>

        <section className="relatorios-premium-callout">
          <div className="relatorios-premium-icon">
            <Sparkles
              size={17}
            />
          </div>

          <div>
            <strong>
              Análises mais profundas no Premium
            </strong>

            <span>
              Comparativos, filtros avançados, tendências e exportação.
            </span>
          </div>

          <Link to="/premium">
            Conhecer
            <ArrowRight
              size={14}
            />
          </Link>
        </section>
      </PageContainer>
    </MainLayout>
  );
}

export default Relatorios;
