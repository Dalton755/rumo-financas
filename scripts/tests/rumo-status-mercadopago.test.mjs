import test from "node:test";
import assert from "node:assert/strict";
import { resumirRespostaPreapproval as verificar } from "../../api/_lib/rumoStatusMercadoPago.js";

test("pending é tentativa não paga, mas não é prova de cancelamento", () => {
  const r = verificar(200, { status: "pending" });
  assert.equal(r.verificacao, "EXISTE_NO_PROVEDOR");
  assert.equal(r.status, "pending");
  assert.ok(r.orientacao.includes("checkout"));
});
test("authorized exige tratamento externo; jamais concluir exclusão automática", () => {
  const r = verificar(200, { status: "authorized" });
  assert.equal(r.verificacao, "EXISTE_NO_PROVEDOR");
});
test("apenas status cancelado pela API é marcado cancelado", () => {
  assert.equal(verificar(200, { status: "cancelled" }).verificacao, "CANCELADA_NO_PROVEDOR");
  assert.equal(verificar(200, { status: "canceled" }).verificacao, "CANCELADA_NO_PROVEDOR");
});
test("404, 403 e erros não viram cancelamento implícito", () => {
  assert.equal(verificar(404).verificacao, "NAO_ENCONTRADO_NESTA_CREDENCIAL");
  assert.equal(verificar(403).verificacao, "CREDENCIAL_SEM_ACESSO");
  assert.equal(verificar(500).verificacao, "FALHA_NA_CONSULTA");
  assert.equal(verificar(200, { status: "unexpected" }).verificacao, "STATUS_DESCONHECIDO");
});
