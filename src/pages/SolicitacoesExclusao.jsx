import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { supabase } from "../services/supabase";
import "./SolicitacoesExclusao.css";

const descricoes = {
  PENDENTE: "Aguardando análise",
  EM_ANALISE: "Em análise",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};
function formatoData(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function SolicitacoesExclusao() {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada.");
      const resp = await fetch("/api/privacidade/solicitacoes", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Falha ao carregar solicitações.");
      setRegistros(json.solicitacoes || []);
    } catch (e) {
      setErro(e.message || "Erro inesperado.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <MainLayout>
      <section className="rumo-exclusao-admin">
        <div className="rumo-exclusao-admin-header">
          <div><small>PAINEL GERENCIAL · PRIVACIDADE</small><h1>Solicitações de exclusão</h1>
            <p>Acompanhe os pedidos de remoção de dados financeiros do Rumo.</p></div>
          <button type="button" onClick={carregar} disabled={carregando}>
            {carregando ? "Atualizando…" : "Atualizar"}
          </button>
        </div>
        <div className="rumo-exclusao-admin-aviso">
          A conclusão exige verificação de assinaturas, conexões bancárias, dados
          do Rumo, históricos e backups, respeitando retenções legais. Esta tela
          é apenas de acompanhamento: não exclui contas automaticamente.
          <br />
          <Link to="/gerencial">Voltar ao painel gerencial</Link>
        </div>
        {erro && <p role="alert">{erro}</p>}
        {carregando ? <p>Consultando solicitações…</p> : (
          <div className="rumo-exclusao-admin-tabela">
            <table>
              <thead><tr><th>Solicitada em</th><th>Status</th><th>ID do usuário</th><th>Concluída em</th></tr></thead>
              <tbody>
                {registros.map((item) => (
                  <tr key={item.id}>
                    <td>{formatoData(item.solicitada_em)}</td>
                    <td><span className="rumo-exclusao-admin-badge">{descricoes[item.status] || item.status}</span></td>
                    <td className="rumo-exclusao-admin-uuid">{item.usuario_id}</td>
                    <td>{formatoData(item.concluida_em)}</td>
                  </tr>
                ))}
                {!registros.length && <tr><td colSpan={4}>Nenhuma solicitação encontrada.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
