import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { supabase } from "../services/supabase";
import "./SolicitacoesExclusao.css";

const estados = {
  PENDENTE: "Solicitação recebida",
  EM_ANALISE: "Em análise",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};
function dataBrasileira(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
async function consultarApi(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sessão expirada. Entre novamente no Rumo.");
  const resposta = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  let json = {};
  try { json = await resposta.json(); } catch { /* Falha transitória */ }
  if (!resposta.ok) throw new Error(json.error || "Não foi possível concluir a operação.");
  return json;
}

export default function SolicitacoesExclusao() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState("");
  const [avisos, setAvisos] = useState({});
  const [detalhes, setDetalhes] = useState({});

  const informar = useCallback((id, texto, tipo = "info") => {
    setAvisos(anterior => ({ ...anterior, [id]: { texto, tipo } }));
  }, []);

  const atualizar = useCallback(async () => {
    setCarregando(true);
    try {
      const json = await consultarApi("/api/privacidade/solicitacoes");
      setPedidos(json.solicitacoes || []);
      setAvisos(anterior => ({ ...anterior, geral: null }));
    } catch (erro) {
      informar("geral", erro.message || "Não foi possível listar as solicitações.", "erro");
    } finally {
      setCarregando(false);
    }
  }, [informar]);

  useEffect(() => { atualizar(); }, [atualizar]);

  const conferirDados = async (pedido) => {
    setProcessando(pedido.id);
    informar(pedido.id, "Conferindo dados do Rumo…");
    try {
      const retorno = await consultarApi(
        `/api/privacidade/solicitacoes?acao=preflight&solicitacao_id=${encodeURIComponent(pedido.id)}`,
      );
      setDetalhes(anterior => ({ ...anterior, [pedido.id]: retorno }));
      informar(pedido.id, `Encontrados ${retorno.totalRegistros} registros em ${retorno.totalTabelasVerificadas} origens. Nenhum dado foi excluído.`, "info");
    } catch (erro) {
      informar(pedido.id, erro.message, "erro");
    } finally {
      setProcessando("");
    }
  };

  const resolverPendencia = async (pedido) => {
    setProcessando(pedido.id);
    informar(pedido.id, "Conferindo pagamentos diretamente no Mercado Pago…");
    try {
      const retorno = await consultarApi(
        `/api/privacidade/solicitacoes?acao=mercadopago&solicitacao_id=${encodeURIComponent(pedido.id)}`,
      );
      if (retorno.totalReferencias === 0) {
        informar(pedido.id, "Nenhuma referência de assinatura foi encontrada. A exclusão dos dados ainda precisa ser processada.", "info");
        return;
      }
      if (retorno.resultados.every(r =>
        r.status === "canceled" && r.pagamentoStatusLocal === "CANCELADO"
      )) {
        informar(pedido.id, "A tentativa de assinatura já foi cancelada. A exclusão dos dados do Rumo continua em análise.", "sucesso");
        return;
      }
      const bloqueios = retorno.resultados.filter(r =>
        !["pending", "canceled"].includes(r.status) ||
        r.pagamentoStatusLocal !== "PENDENTE" || r.pagamentoConfirmadoLocal,
      );
      if (retorno.resultados.length !== 1 || bloqueios.length) {
        informar(pedido.id, "Este pedido exige revisão de pagamentos. Nenhuma cobrança ou dado foi alterado.", "erro");
        return;
      }
      const referencia = retorno.resultados[0].referenciaFinal;
      const confirmou = window.confirm(
        `O Mercado Pago identificou uma tentativa de assinatura ainda não paga (final ${referencia}).\n\nCancelar essa tentativa agora?\n\nOs dados da conta NÃO serão excluídos nesta etapa.`,
      );
      if (!confirmou) {
        informar(pedido.id, "Operação interrompida. Nenhuma alteração realizada.");
        return;
      }
      informar(pedido.id, "Cancelando e conferindo o resultado no Mercado Pago…");
      const resultado = await consultarApi("/api/privacidade/solicitacoes?acao=cancelar-checkout", {
        method: "POST",
        body: JSON.stringify({
          solicitacao_id: pedido.id,
          referenciaFinal: referencia,
          confirmacao: `CANCELAR ${referencia}`,
        }),
      });
      informar(pedido.id, resultado.mensagem || "Tentativa cancelada. A exclusão de dados ainda está pendente.", "sucesso");
    } catch (erro) {
      informar(pedido.id, erro.message || "Não foi possível resolver a pendência.", "erro");
    } finally {
      setProcessando("");
    }
  };

  return (
    <MainLayout>
      <section className="rumo-exclusao-admin">
        <div className="rumo-exclusao-admin-header">
          <div>
            <small>PAINEL GERENCIAL · PRIVACIDADE</small>
            <h1>Exclusão de contas</h1>
            <p>Acompanhe os pedidos e resolva as pendências em um único lugar.</p>
          </div>
          <button type="button" onClick={atualizar} disabled={carregando || Boolean(processando)}>
            {carregando ? "Atualizando…" : "Atualizar"}
          </button>
        </div>

        <div className="rumo-exclusao-admin-aviso">
          <strong>Processamento protegido.</strong> O sistema confere o pagamento antes de qualquer cancelamento.
          A exclusão de dados ainda não é automática e será concluída separadamente, após a validação.
          <br /><Link to="/gerencial">Voltar ao painel gerencial</Link>
        </div>
        {avisos.geral && <p className="rumo-exclusao-admin-erro" role="alert">{avisos.geral.texto}</p>}
        {carregando && <p>Consultando solicitações…</p>}
        {!carregando && !pedidos.length && <p className="rumo-exclusao-admin-vazio">Nenhuma solicitação encontrada.</p>}
        {!carregando && (
          <div className="rumo-exclusao-admin-lista">
            {pedidos.map(pedido => {
              const pendente = ["PENDENTE", "EM_ANALISE"].includes(pedido.status);
              const ocupado = Boolean(processando);
              const aviso = avisos[pedido.id];
              const detalhe = detalhes[pedido.id];
              return (
                <article className="rumo-exclusao-admin-card" key={pedido.id}>
                  <div className="rumo-exclusao-admin-card-topo">
                    <div>
                      <small>CONTA</small>
                      <h2>{pedido.email || "Usuário do Rumo"}</h2>
                      <p>Solicitado em {dataBrasileira(pedido.solicitada_em)}</p>
                    </div>
                    <span className="rumo-exclusao-admin-badge">{estados[pedido.status] || pedido.status}</span>
                  </div>
                  {aviso && (
                    <div className={`rumo-exclusao-admin-feedback ${aviso.tipo}`}
                      role={aviso.tipo === "erro" ? "alert" : "status"}>{aviso.texto}</div>
                  )}
                  {pendente && (
                    <div className="rumo-exclusao-admin-acoes">
                      <button type="button" className="primario" disabled={ocupado}
                        onClick={() => resolverPendencia(pedido)}>
                        {processando === pedido.id ? "Verificando…" : "Resolver pendência de pagamento"}
                      </button>
                      <button type="button" disabled={ocupado} onClick={() => conferirDados(pedido)}>
                        Conferir dados
                      </button>
                    </div>
                  )}
                  {detalhe && (
                    <details className="rumo-exclusao-admin-detalhes">
                      <summary>Detalhes da auditoria — {detalhe.totalRegistros} registros</summary>
                      <p>Nenhum registro foi excluído por esta auditoria.</p>
                      {(detalhe.alertas || []).map(alerta => <p key={alerta}>⚠ {alerta}</p>)}
                      <ul>
                        {Object.entries(detalhe.contagens || {})
                          .filter(([,total]) => total > 0)
                          .map(([nome,total]) => <li key={nome}>{nome}: {total}</li>)}
                      </ul>
                    </details>
                  )}
                  <details className="rumo-exclusao-admin-detalhes">
                    <summary>Informações técnicas</summary>
                    <p>ID de conta: <code>{pedido.usuario_id}</code></p>
                    <p>ID da solicitação: <code>{pedido.id}</code></p>
                    {pedido.concluida_em && <p>Concluída em {dataBrasileira(pedido.concluida_em)}</p>}
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </MainLayout>
  );
}
