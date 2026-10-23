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
  const [auditoria, setAuditoria] = useState(null);
  const [auditando, setAuditando] = useState("");
  const [erroAuditoria, setErroAuditoria] = useState("");
  const [checagemProvedor, setChecagemProvedor] = useState(null);
  const [checandoProvedor, setChecandoProvedor] = useState("");
  const [cancelandoCheckout, setCancelandoCheckout] = useState(false);
  const [mensagemCancelamento, setMensagemCancelamento] = useState("");

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

  const auditarPedido = useCallback(async (id) => {
    setAuditando(id);
    setErroAuditoria("");
    setAuditoria(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada.");
      const url = `/api/privacidade/solicitacoes?acao=preflight&solicitacao_id=${encodeURIComponent(id)}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Falha na conferência.");
      setAuditoria(json);
    } catch (e) {
      setErroAuditoria(e.message || "Falha ao conferir os dados.");
    } finally {
      setAuditando("");
    }
  }, []);

  const verificarMercadoPago = useCallback(async (id) => {
    setChecandoProvedor(id);
    setErroAuditoria("");
    setChecagemProvedor(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada.");
      const resp = await fetch(
        `/api/privacidade/solicitacoes?acao=mercadopago&solicitacao_id=${encodeURIComponent(id)}`,
        { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" },
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Não foi possível conferir no provedor.");
      setChecagemProvedor(json);
    } catch (e) {
      setErroAuditoria(e.message || "Erro na consulta ao provedor.");
    } finally {
      setChecandoProvedor("");
    }
  }, []);

  const cancelarPendente = useCallback(async (final, pedido) => {
    const texto = window.prompt("Digite CANCELAR " + final + " para confirmar o cancelamento do checkout (sem excluir dados):", "");
    if (texto !== "CANCELAR " + final) return;
    setCancelandoCheckout(true);
    setErroAuditoria("");
    setMensagemCancelamento("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada.");
      const response = await fetch("/api/privacidade/solicitacoes?acao=cancelar-checkout", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + session.access_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ solicitacao_id: pedido, referenciaFinal: final, confirmacao: texto }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Cancelamento não confirmado.");
      setMensagemCancelamento(data.mensagem || "Checkout cancelado no provedor.");
      await verificarMercadoPago(pedido);
    } catch (error) {
      setErroAuditoria(error.message || "Falha no cancelamento.");
    } finally {
      setCancelandoCheckout(false);
    }
  }, [verificarMercadoPago]);

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
          do Rumo, históricos e backups, respeitando retenções legais. A opção
          "Conferir dados" apenas contabiliza registros. "Verificar Mercado Pago"
          consulta o status da referência na API do provedor. O cancelamento
          de uma tentativa pendente é uma ação separada, com confirmação explícita.
          Essas ações não excluem dados da conta.
          <br />
          <Link to="/gerencial">Voltar ao painel gerencial</Link>
        </div>
        {erro && <p role="alert">{erro}</p>}
        {erroAuditoria && <p role="alert">{erroAuditoria}</p>}
        {mensagemCancelamento && <p role="status">{mensagemCancelamento}</p>}
        {auditoria && (
          <div className="rumo-exclusao-admin-aviso" role="status">
            <strong>Auditoria somente leitura — nenhuma exclusão realizada.</strong>
            <p>{auditoria.totalRegistros} registros associados ao pedido,
              distribuídos por {auditoria.totalTabelasVerificadas} origens
              ({auditoria.totalBackups} em backups históricos).</p>
            <p>Esta conferência não comprova exclusão nem substitui a análise
              de contratos, retenção legal e integrações externas.</p>
            <details><summary>Contagem detalhada de registros</summary>
              <ul>
                {Object.entries(auditoria.contagens || {})
                  .filter(([, quantidade]) => quantidade > 0)
                  .map(([nome, quantidade]) => <li key={nome}>{nome}: {quantidade}</li>)}
              </ul>
            </details>
            {(auditoria.alertas || []).map((aviso) => <p key={aviso}>⚠ {aviso}</p>)}
          </div>
        )}
        {checagemProvedor && (
          <div className="rumo-exclusao-admin-aviso" role="status">
            <strong>Consulta ao Mercado Pago — sem cancelamento nem exclusão.</strong>
            <p>Referências verificadas: {checagemProvedor.totalReferencias}.</p>
            {checagemProvedor.resultados.map((r) => (
              <p key={r.referenciaFinal}>
                <strong>…{r.referenciaFinal}:</strong> {r.verificacao}
                {r.status ? ` (status: ${r.status})` : ""}
                <br />{r.orientacao}
                {r.status === "pending" &&
                  r.pagamentoStatusLocal === "PENDENTE" &&
                  !r.pagamentoConfirmadoLocal && (
                    <span>
                      <br />
                      <button type="button" disabled={cancelandoCheckout}
                        onClick={() => cancelarPendente(r.referenciaFinal, checagemProvedor.pedido)}>
                        {cancelandoCheckout ? "Conferindo cancelamento…" : "Cancelar checkout pendente"}
                      </button>
                    </span>
                  )}
              </p>
            ))}
          </div>
        )}
        {carregando ? <p>Consultando solicitações…</p> : (
          <div className="rumo-exclusao-admin-tabela">
            <table>
              <thead><tr><th>Solicitada em</th><th>Status</th><th>ID do usuário</th><th>Concluída em</th><th>Conferência</th></tr></thead>
              <tbody>
                {registros.map((item) => (
                  <tr key={item.id}>
                    <td>{formatoData(item.solicitada_em)}</td>
                    <td><span className="rumo-exclusao-admin-badge">{descricoes[item.status] || item.status}</span></td>
                    <td className="rumo-exclusao-admin-uuid">{item.usuario_id}</td>
                    <td>{formatoData(item.concluida_em)}</td>
                    <td>{["PENDENTE", "EM_ANALISE"].includes(item.status) && (
                      <button type="button" onClick={() => auditarPedido(item.id)}
                        disabled={Boolean(auditando || checandoProvedor)}>
                        {auditando === item.id ? "Conferindo…" : "Conferir dados (sem excluir)"}
                      </button>
                    )}
                    {["PENDENTE", "EM_ANALISE"].includes(item.status) && (
                      <button type="button" onClick={() => verificarMercadoPago(item.id)}
                        disabled={Boolean(auditando || checandoProvedor)}>
                        {checandoProvedor === item.id
                          ? "Consultando provedor…"
                          : "Verificar Mercado Pago"}
                      </button>
                    )}</td>
                  </tr>
                ))}
                {!registros.length && <tr><td colSpan={5}>Nenhuma solicitação encontrada.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
