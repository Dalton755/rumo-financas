import {
  BarChart3,
  CreditCard,
  ShieldCheck,
  Users
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

import "./Gerencial.css";

function Gerencial() {
  const modulos = [
    {
      titulo: "Clientes",
      descricao:
        "Visão de usuários, planos e situação de acesso.",
      Icone: Users
    },
    {
      titulo: "Financeiro",
      descricao:
        "Faturamento, pagamentos e indicadores de receita.",
      Icone: CreditCard
    },
    {
      titulo: "Indicadores",
      descricao:
        "Uso do produto, crescimento e métricas gerenciais.",
      Icone: BarChart3
    }
  ];

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          titulo="Painel gerencial"
          subtitulo="Área exclusiva do proprietário do Rumo."
        >
          <span className="gerencial-owner-badge">
            <ShieldCheck size={14} />
            Dono
          </span>
        </PageHeader>

        <section className="gerencial-intro">
          <div className="gerencial-intro-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <span>
              Administração
            </span>

            <h2>
              Estrutura pronta para o painel do Rumo
            </h2>

            <p>
              O acesso de proprietário já está protegido.
              Na próxima etapa podemos conectar clientes,
              planos, faturamento, pagamentos e métricas.
            </p>
          </div>
        </section>

        <section className="gerencial-grid">
          {modulos.map(
            ({
              titulo,
              descricao,
              Icone
            }) => (
              <article
                key={titulo}
                className="gerencial-card"
              >
                <div className="gerencial-card-icon">
                  <Icone size={19} />
                </div>

                <span>
                  Próxima etapa
                </span>

                <h3>
                  {titulo}
                </h3>

                <p>
                  {descricao}
                </p>

                <strong>
                  Em breve
                </strong>
              </article>
            )
          )}
        </section>
      </PageContainer>
    </MainLayout>
  );
}

export default Gerencial;
