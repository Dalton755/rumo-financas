// Validação conservadora para cancelar SOMENTE checkout pendente, sem pagamento.
// O Mercado Pago pode usar um e-mail de teste no checkout e pode não retornar
// payer_email no GET de preapproval. Por isso a identidade é vinculada também
// à external_reference criada pelo Rumo e conferida com o registro do usuário.
export function validarCancelamentoPendente({
  pagamento, dadosProvedor, emailTitular, referenciaFinal, emailCompradorTeste = "",
}) {
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
  if (!["pending", "canceled", "cancelled"].includes(status)) {
    return { ok: false, motivo: "Status não seguro para o cancelamento de checkout." };
  }

  const usuarioId = String(pagamento.usuario_id || "");
  const refLocal = String(pagamento.mercado_pago_external_reference || "");
  const refRemota = String(dadosProvedor.external_reference || "");
  // Padrão EXATO do checkout do Rumo: RUMO-<auth.uid>-<periodo>-<timestamp>
  const refEsperada = new RegExp(
    "^RUMO-" + usuarioId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "-(MENSAL|ANUAL)-[0-9]{10,16}$",
  );
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(usuarioId) ||
      !refEsperada.test(refLocal) || refLocal !== refRemota) {
    return { ok: false, motivo: "Identificador externo não corresponde ao checkout do titular." };
  }

  const email = String(emailTitular || "").trim().toLowerCase();
  const meta = pagamento.metadata || {};
  if (!email || !meta || typeof meta !== "object" ||
      String(meta.user_id || "").toLowerCase() !== usuarioId.toLowerCase() ||
      String(meta.email || "").trim().toLowerCase() !== email ||
      String(meta.origem || "") !== "CHECKOUT_RUMO") {
    return { ok: false, motivo: "Dados locais do titular não correspondem ao checkout." };
  }

  const emailRemoto = String(dadosProvedor.payer_email || "").trim().toLowerCase();
  const emailTeste = String(emailCompradorTeste || "").trim().toLowerCase();
  if (emailRemoto && emailRemoto !== email && (!emailTeste || emailRemoto !== emailTeste)) {
    return { ok: false, motivo: "E-mail remoto não corresponde ao titular nem ao comprador de teste configurado." };
  }
  return { ok: true, status, jaCancelada: status !== "pending" };
}
