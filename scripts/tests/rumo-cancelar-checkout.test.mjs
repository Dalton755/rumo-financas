import test from "node:test";
import assert from "node:assert/strict";
import { validarCancelamentoPendente as validar } from "../../api/_lib/rumoCancelarCheckoutPendente.js";

const id = "9dbb1234567890123456789012b52596";
const uid = "3d642a9c-e359-4afc-9331-691d2f1a2eea";
const email = "testadorebd@gmail.com";
const emailTeste = "payer_test_123@testuser.com";
const external = `RUMO-${uid}-MENSAL-1792781234567`;
const pagamento = {
  usuario_id: uid, status: "PENDENTE", provedor: "MERCADO_PAGO", tipo: "ASSINATURA",
  pago_em: null, mercado_pago_payment_id: null, mercado_pago_preapproval_id: id,
  mercado_pago_external_reference: external,
  metadata: { user_id: uid, email, origem: "CHECKOUT_RUMO" },
};
const provedor = { id, status: "pending", external_reference: external, payer_email: email };
const dados = (alteracoes = {}) => ({
  pagamento: { ...pagamento, ...alteracoes.pagamento },
  dadosProvedor: { ...provedor, ...alteracoes.dadosProvedor },
  emailTitular: alteracoes.emailTitular ?? email,
  emailCompradorTeste: alteracoes.emailCompradorTeste ?? "",
  referenciaFinal: alteracoes.referenciaFinal ?? "b52596",
});

test("checkout pendente autenticado pode ser cancelado", () => {
  const r = validar(dados());
  assert.equal(r.ok, true);
  assert.equal(r.jaCancelada, false);
});
test("checkout cancelado pode ser reconciliado apenas com a mesma referencia", () => {
  const r = validar(dados({ dadosProvedor: { status: "canceled" } }));
  assert.equal(r.ok, true);
  assert.equal(r.jaCancelada, true);
});
test("email ficticio do comprador configurado em homologacao e permitido sem liberar terceiros", () => {
  const good = validar(dados({
    dadosProvedor: { payer_email: emailTeste },
    emailCompradorTeste: emailTeste,
  }));
  assert.equal(good.ok, true);
  assert.equal(validar(dados({ dadosProvedor: { payer_email: emailTeste } })).ok, false);
  assert.equal(validar(dados({
    dadosProvedor: { payer_email: "um-terceiro@exemplo.com" },
    emailCompradorTeste: emailTeste,
  })).ok, false);
});
test("GET preapproval sem payer_email usa ID e external_reference autenticadas", () => {
  assert.equal(validar(dados({ dadosProvedor: { payer_email: null } })).ok, true);
});
test("nenhum pagamento feito pode ser cancelado por esta operacao", () => {
  for (const patch of [{ pago_em: "2026-10-23T12:00:00Z" }, { mercado_pago_payment_id: "p123" }, { status: "APROVADO" }]) {
    assert.equal(validar(dados({ pagamento: patch })).ok, false);
  }
});
test("nunca cancela checkout de outro usuario ou com referencia externa diferente", () => {
  assert.equal(validar(dados({ pagamento: { usuario_id: "00000000-0000-4000-8000-000000000099" } })).ok, false);
  assert.equal(validar(dados({ pagamento: { mercado_pago_external_reference: "RUMO-OTHER" } })).ok, false);
  assert.equal(validar(dados({ dadosProvedor: { external_reference: "RUMO-OTHER" } })).ok, false);
  assert.equal(validar(dados({ pagamento: { metadata: { ...pagamento.metadata, user_id: "00000000-0000-4000-8000-000000000099" } } })).ok, false);
  assert.equal(validar(dados({ pagamento: { metadata: { ...pagamento.metadata, email: "outra@exemplo.com" } } })).ok, false);
  assert.equal(validar(dados({ dadosProvedor: { id: "outro" } })).ok, false);
  assert.equal(validar(dados({ referenciaFinal: "outro0" })).ok, false);
});
test("status autorizado, pausado, desconhecido nunca cancelado por esta operacao", () => {
  for (const status of ["authorized", "paused", "unexpected", ""]) {
    assert.equal(validar(dados({ dadosProvedor: { status } })).ok, false);
  }
});
