import test from "node:test";
import assert from "node:assert/strict";
import {
  prepararPreflightExclusao,
  TABELAS_USUARIO_RUMO,
  TABELAS_BACKUP_RUMO,
} from "../../api/_lib/rumoExclusaoPreflight.js";

const USER_ID = "00000000-0000-4000-8000-000000000042";
function mockSupabase(contagens = {}, falha = "") {
  const chamadas = [];
  return {
    chamadas,
    schema(nomeSchema) {
      assert.equal(nomeSchema, "rumo");
      return {
        from(tabela) {
          return {
            select(_fields, opcoes) {
              assert.equal(opcoes.head, true);
              assert.equal(opcoes.count, "exact");
              return {
                async eq(coluna, usuarioId) {
                  assert.equal(usuarioId, USER_ID);
                  assert.ok(coluna === "usuario_id" || coluna.endsWith(".usuario_id"));
                  chamadas.push(tabela);
                  if (falha === tabela) return { count: null, error: { message: "Falha de leitura" } };
                  return { count: contagens[tabela] ?? 0, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
}

test("auditoria de exclusão conta exatamente as 40 origens sem modificar dados", async () => {
  const db = mockSupabase({
    contas: 2, movimentacoes: 3, bkp_contas_20260903: 1,
    aportes_objetivos: 2, plano_quitacao: 4,
  });
  const r = await prepararPreflightExclusao(db, USER_ID);
  assert.equal(TABELAS_USUARIO_RUMO.length + TABELAS_BACKUP_RUMO.length + 2, 40);
  assert.equal(r.totalTabelasVerificadas, 40);
  assert.equal(r.totalRegistros, 12);
  assert.equal(r.totalBackups, 1);
  assert.equal(r.modo, "SOMENTE_LEITURA");
  assert.equal(r.exclusaoExecutada, false);
  assert.equal(r.elegivelParaExclusaoAutomatica, false);
  assert.ok(r.alertas.some(texto => texto.includes("cópias históricas")));
  assert.equal(db.chamadas.length, 40);
});

test("auditoria avisa sobre Mercado Pago e Open Finance", async () => {
  const r = await prepararPreflightExclusao(mockSupabase({
    assinaturas: 1, pagamentos_assinaturas: 2, open_finance_conexoes: 1,
  }), USER_ID);
  assert.ok(r.alertas.some(texto => texto.includes("Mercado Pago")));
  assert.ok(r.alertas.some(texto => texto.includes("Pluggy")));
  assert.equal(r.exclusaoExecutada, false);
});

test("auditoria falha fechada se uma tabela não responder", async () => {
  await assert.rejects(
    prepararPreflightExclusao(mockSupabase({}, "dividas"), USER_ID),
    /Não foi possível contar/,
  );
});

test("auditoria rejeita ID inexistente ou inválido", async () => {
  await assert.rejects(prepararPreflightExclusao(mockSupabase(), "foo"), /inválido/);
});
