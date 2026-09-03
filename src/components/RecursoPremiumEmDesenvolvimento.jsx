import {
  Construction,
  Sparkles,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "./ui/PageContainer";

import "./RecursoPremiumBloqueado.css";

export default function RecursoPremiumEmDesenvolvimento({
  titulo = "Recurso Premium",
}) {
  return (
    <MainLayout>
      <PageContainer>
        <div className="premium-bloqueado">
          <div className="premium-bloqueado-card">
            <div className="premium-bloqueado-icon">
              <Construction size={38} />
            </div>

            <span className="premium-bloqueado-label">
              <Sparkles size={15} />
              Rumo Premium
            </span>

            <h1>
              {titulo}
            </h1>

            <h2>
              Este recurso está sendo preparado.
            </h2>

            <p>
              Sua conta já possui acesso ao Rumo Premium.
              Estamos construindo este módulo para integrar
              planejamento, inteligência e acompanhamento
              financeiro em uma única experiência.
            </p>

            <span className="premium-bloqueado-observacao">
              Disponível em breve.
            </span>
          </div>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
