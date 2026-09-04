import { usePlano } from "../context/PlanoContext";
import RelatoriosPremium from "./RelatoriosPremium";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import GraficoCategorias from "../components/GraficoCategorias";
import MainLayout from "../layouts/MainLayout";

function Relatorios() {

  const {
    premium,
    carregandoPlano
  } = usePlano();

  const [dados, setDados] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setDados([]);
      return;
    }

    const { data, error } = await supabase
      .schema("rumo")
      .from("vw_gastos_categoria")
      .select("*")
      .eq("usuario_id", user.id)
      .order("total", { ascending: false });

    if (error) {
      console.error("Erro ao carregar relatórios:", error);
      return;
    }

    setDados(data || []);
  }

  if (carregandoPlano) {

    return (

      <MainLayout>

        <div
          style={{
            padding: "40px",
            color: "#64748B"
          }}
        >
          Carregando relatórios...
        </div>

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

      <div>
        <h1 className="fw-bold">
          Relatórios
        </h1>

        <p className="text-muted mb-4">
          Analise para onde seu dinheiro está indo.
        </p>

        <GraficoCategorias dados={dados} />
      </div>

    </MainLayout>
  );
}

export default Relatorios;