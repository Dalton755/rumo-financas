import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import ContaEncerrada from "./ContaEncerrada";

function mensagemServico(error) {
  const texto = [error?.message, error?.details, error?.hint]
    .filter(Boolean).join(" ");
  return texto.includes("RUMO_CONTA_ENCERRADA");
}

export default function ProtectedRoute({ children }) {
  // Segurança do Rumo é independente da sessão global Supabase, compartilhada
  // entre aplicações. Não encerrar auth.users nem sessões dos outros produtos.
  const [estado, setEstado] = useState("carregando");

  useEffect(() => {
    let ativo = true;
    let versao = 0;
    async function verificarSessao() {
      const atual = ++versao;
      if (ativo) setEstado("carregando");
      try {
        const { data: { user }, error: erroAuth } = await supabase.auth.getUser();
        if (!ativo || atual !== versao) return;
        if (erroAuth || !user?.id) {
          setEstado("nao-autenticado");
          return;
        }

        // Verificar a exclusão ANTES do RPC que recria a configuração
        // e a assinatura gratuita da conta.
        const { data: pedido, error: erroConsulta } = await supabase
          .schema("rumo")
          .from("solicitacoes_exclusao")
          .select("status")
          .eq("usuario_id", user.id)
          .in("status", ["PENDENTE", "EM_ANALISE", "CONCLUIDA"])
          .order("solicitada_em", { ascending: false })
          .limit(1);
        if (!ativo || atual !== versao) return;
        if (erroConsulta) {
          setEstado("erro");
          return;
        }
        if (pedido?.[0]?.status === "CONCLUIDA") {
          setEstado("encerrada");
          return;
        }
        if (pedido?.[0] && ["PENDENTE", "EM_ANALISE"].includes(pedido[0].status)) {
          // Enquanto a exclusão está sendo tratada, não permitir inserção
          // de novos dados pelo próprio aplicativo.
          setEstado("em-processamento");
          return;
        }
        const { error: erroRpc } = await supabase.schema("rumo")
          .rpc("garantir_usuario_rumo");
        if (!ativo || atual !== versao) return;
        if (erroRpc) {
          setEstado(mensagemServico(erroRpc) ? "encerrada" : "erro");
          return;
        }
        setEstado("autenticado");
      } catch {
        if (ativo && atual === versao) setEstado("erro");
      }
    }

    void verificarSessao();
    // A emissão do evento de Auth pode manter o lock do SDK; deferir RPC.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        if (ativo) void verificarSessao();
      }, 0);
    });
    return () => {
      ativo = false;
      ++versao;
      subscription.unsubscribe();
    };
  }, []);

  if (estado === "carregando") return null;
  if (estado === "nao-autenticado") return <Navigate to="/" replace />;
  if (estado === "encerrada") return <ContaEncerrada concluida />;
  if (estado === "em-processamento") return <ContaEncerrada />;
  if (estado === "erro") {
    return (
      <main className="rumo-privacidade">
        <div className="rumo-privacidade-container">
          <section className="rumo-privacidade-card">
            <h1>Não foi possível conferir o acesso</h1>
            <p>Por segurança, o Rumo não carregou seus dados. Confira sua conexão e tente novamente.</p>
            <button type="button" onClick={() => window.location.reload()}>Tentar novamente</button>
          </section>
        </div>
      </main>
    );
  }
  return children;
}
