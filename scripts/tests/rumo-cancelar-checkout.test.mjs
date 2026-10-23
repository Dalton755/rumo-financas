import test from "node:test";
import assert from "node:assert/strict";
import { validarCancelamentoPendente } from "../../api/_lib/rumoCancelarCheckoutPendente.js";

const id = "9dbb1234567890123456789012b52596";
const email = "testadorebd@gmail.com";
const pagamento = {
  status: "PENDENTE", provedor: "MERCADO_PAGO", tipo: "ASSINATURA",
  pago_em: null, mercado_pago_payment_id: null, mercado_pago_preapproval_id: id,
};
const provedor = { id, status: "pending", payer_email: email };
const dados = (alteracoes = {}) => ({
  pagamento: { ...pagamento, ...alteracoes.pagamento },
  dadosProvedor: { ...provedor, ...alteracoes.dadosProvedor },
  emailTitular: alteracoes.emailTitular ?? email,
  referenciaFinal: alteracoes.referenciaFinal ?? "b52596",
});
test("checkout pendente do titular correto pode ser cancelado", () => {
  const r = validarCancelamentoPendente(dados());
  assert.equal(r.ok, true);
  assert.equal(r.jaCancelada, false);
});
test("checkout ja cancelado permite reconciliacao somente apos autenticar titular", () => {
  const r = validarCancelamentoPendente(dados({ dadosProvedor: { status: "canceled" } }));
  assert.equal(r.ok, true);
  assert.equal(r.jaCancelada, true);
});
test("nao permite cancelar pagamento ja aprovado", () => {
  for (const patch of [{ pago_em: "2026-10-23T12:00:00Z" }, { mercado_pago_payment_id: "p123" }, { status: "APROVADO" }]) {
    assert.equal(validarCancelamentoPendente(dados({ pagamento: patch })).ok, false);
  }
});
test("nao permite cancelar checkout de terceiro ou referencia divergente", () => {
  assert.equal(validarCancelamentoPendente(dados({ emailTitular: "outro@exemplo.com" })).ok, false);
  assert.equal(validarCancelamentoPendente(dados({ dadosProvedor: { id: "outro" } })).ok, false);
  assert.equal(validarCancelamentoPendente(dados({ referenciaFinal: "outro0" })).ok, false);
  assert.equal(validarCancelamentoPendente(dados({ dadosProvedor: { payer_email: "outro@exemplo.com" } })).ok, false);
});
test("nao permite cancelar assinatura autorizada ou desconhecida", () => {
  for (const status of ["authorized", "paused", "unexpected", ""]) {
    assert.equal(validarCancelamentoPendente(dados({ dadosProvedor: { status } })).ok, false);
  }
});
