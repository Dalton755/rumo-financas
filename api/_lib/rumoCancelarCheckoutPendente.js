// Processo administrativo de cancelamento de checkouts MP PENDENTES, sem pagamento.
// Não excluir nem cancelar automaticamente ao consultar status. Operação exige
// autenticação de DONO, confirmação explícita e uma solicitação EM_ANALISE.
export function validarCancelamentoPendente({ pagamento, dadosProvedor, emailTitular, referenciaFinal }) {
  if (!pagamento || pagamento.status !== "PENDENTE" ||
      pagamento.provedor !== "MERCADO_PAGO" || pagamento.tipo !== "ASSINATURA" ||
      pagamento.pago_em != null || pagamento.mercado_pago_payment_id != null) {
    return { ok: false, motivo: "O registro não é uma tentativa não paga e pendente." };
  }
  const id = pagamento.mercado_pago_preapproval_id;
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{10,100}$/.test(id) ||
      id.slice(-6) !== referenciaFinal) {
    return { ok: false, motivo: "Referência inconsistente." };
  }
  if (!dadosProvedor || String(dadosProvedor.id || "") !== id) {
    return { ok: false, motivo: "Referência não corresponde à resposta do Mercado Pago." };
  }
  const status = String(dadosProvedor.status || "").toLowerCase();
  if (status !== "pending" && status !== "canceled" && status !== "cancelled") {
    return { ok: false, motivo: "Status não seguro para o cancelamento de checkout." };
  }
  const emailRemoto = String(dadosProvedor.payer_email || "").trim().toLowerCase();
  if (!emailTitular || emailRemoto !== String(emailTitular).trim().toLowerCase()) {
    return { ok: false, motivo: "E-mail do comprador divergente da conta do pedido." };
  }
  return { ok: true, status, jaCancelada: status !== "pending" };
}
