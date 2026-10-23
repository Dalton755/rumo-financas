// Este diagnóstico não executa baixa, cancelamento ou exclusão.
// Registro local "PENDENTE" e checkout gerado NÃO significam assinatura paga.
export function resumirRespostaPreapproval(httpStatus, data = {}) {
  if (httpStatus === 404) return {
    verificacao: "NAO_ENCONTRADO_NESTA_CREDENCIAL",
    status: null,
    orientacao: "A credencial usada não encontrou a referência. Conferir conta e ambiente Mercado Pago antes de encerrar o pedido.",
  };
  if (httpStatus === 401 || httpStatus === 403) return {
    verificacao: "CREDENCIAL_SEM_ACESSO",
    status: null,
    orientacao: "Token Mercado Pago inválido ou sem acesso. Nenhum cancelamento foi efetuado.",
  };
  if (httpStatus < 200 || httpStatus >= 300 || !data || typeof data !== "object") return {
    verificacao: "FALHA_NA_CONSULTA",
    status: null,
    orientacao: "Falha temporária consultando Mercado Pago. Não concluir exclusão.",
  };
  const status = String(data.status || "").toLowerCase();
  if (!["pending", "authorized", "paused", "cancelled", "canceled"].includes(status)) return {
    verificacao: "STATUS_DESCONHECIDO",
    status: null,
    orientacao: "Status não reconhecido. Conferir manualmente antes da exclusão.",
  };
  const cancelada = status === "cancelled" || status === "canceled";
  return {
    verificacao: cancelada ? "CANCELADA_NO_PROVEDOR" : "EXISTE_NO_PROVEDOR",
    status: status === "cancelled" ? "canceled" : status,
    orientacao: cancelada
      ? "Referência retornou status cancelado. Conferir transações e demais referências antes de excluir."
      : status === "pending"
        ? "Tentativa de assinatura ainda pendente. Não há confirmação de pagamento; porém o checkout poderá ser concluído.",
    ...(!cancelada && status !== "pending" ? { orientacao: "Referência existente no Mercado Pago; revisar cobranças antes da exclusão." } : {}),
  };
}
