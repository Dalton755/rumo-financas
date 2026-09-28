import { supabase } from "./supabase";


function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


function dataIsoLocal() {
  const data =
    new Date();

  return [
    data.getFullYear(),
    String(
      data.getMonth() + 1
    ).padStart(2, "0"),
    String(
      data.getDate()
    ).padStart(2, "0"),
  ].join("-");
}


function localizarPorHint(
  hint,
  itens,
  campos
) {
  if (!hint) {
    return "";
  }

  const alvo =
    normalizar(
      hint
    );

  const exato =
    (itens || []).find(
      (item) =>
        campos.some(
          (campo) =>
            normalizar(
              item?.[campo]
            ) === alvo
        )
    );

  if (exato) {
    return exato.id;
  }

  const parcial =
    (itens || []).find(
      (item) =>
        campos.some(
          (campo) => {
            const valor =
              normalizar(
                item?.[campo]
              );

            return (
              valor.length >= 3 &&
              (
                valor.includes(
                  alvo
                ) ||
                alvo.includes(
                  valor
                )
              )
            );
          }
        )
    );

  return (
    parcial?.id ||
    ""
  );
}


function rotuloPorIntent(
  intent
) {
  if (intent === "receita") {
    return "Registrar receita";
  }

  if (intent === "despesa") {
    return "Registrar despesa";
  }

  if (
    intent ===
    "compra_cartao"
  ) {
    return "Registrar compra no cartão";
  }

  if (
    intent ===
    "compromisso_unico"
  ) {
    return "Adicionar obrigação";
  }

  if (intent === "meta") {
    return "Criar meta";
  }

  return "";
}


function montarAcao(
  interpretacao,
  opcoes
) {
  const tipo =
    interpretacao.intent;

  if (
    ![
      "despesa",
      "receita",
      "compra_cartao",
      "compromisso_unico",
      "meta",
    ].includes(tipo)
  ) {
    return null;
  }

  const categoriaTipo =
    tipo === "receita"
      ? "receita"
      : "despesa";

  const categorias =
    (opcoes.categorias || [])
      .filter(
        (item) =>
          item.tipo ===
          categoriaTipo
      );

  const categoriaId =
    localizarPorHint(
      interpretacao.category_hint,
      categorias,
      ["nome"]
    );

  const contaId =
    localizarPorHint(
      interpretacao.account_hint,
      opcoes.contas || [],
      [
        "nome",
        "banco",
      ]
    );

  const cartaoId =
    localizarPorHint(
      interpretacao.card_hint,
      opcoes.cartoes || [],
      [
        "nome",
        "banco",
        "final_cartao",
      ]
    );

  const base = {
    tipo,
    rotulo:
      rotuloPorIntent(
        tipo
      ),
    descricao:
      interpretacao.description ||
      (
        tipo === "meta"
          ? "Nova meta"
          : tipo ===
            "compromisso_unico"
            ? "Obrigação"
            : tipo ===
              "receita"
              ? "Receita"
              : "Despesa"
      ),
    valor:
      Number(
        interpretacao.value ||
        0
      ),
    observacao:
      "Interpretado pelo Rumo IA",
    origem_interpretacao:
      "openai",
    confianca:
      Number(
        interpretacao.confidence ||
        0
      ),
  };

  if (
    tipo === "despesa" ||
    tipo === "receita"
  ) {
    return {
      ...base,
      data:
        interpretacao.date ||
        dataIsoLocal(),
      conta_id:
        contaId,
      categoria_id:
        categoriaId,
    };
  }

  if (
    tipo ===
    "compra_cartao"
  ) {
    return {
      ...base,
      data:
        interpretacao.date ||
        dataIsoLocal(),
      cartao_id:
        cartaoId,
      categoria_id:
        categoriaId,
      parcelas:
        Math.max(
          1,
          Number(
            interpretacao.installments ||
            1
          )
        ),
    };
  }

  if (
    tipo ===
    "compromisso_unico"
  ) {
    return {
      ...base,
      vencimento:
        interpretacao.due_date ||
        "",
      conta_id:
        contaId,
      categoria_id:
        categoriaId,
    };
  }

  if (tipo === "meta") {
    return {
      ...base,
      prazo:
        interpretacao.due_date ||
        null,
      conta_id:
        contaId,
    };
  }

  return null;
}


export async function interpretarComRumoIa(
  texto,
  opcoes = {}
) {
  const fusoHorario =
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone ||
    "America/Sao_Paulo";

  const {
    data,
    error,
  } =
    await supabase
      .functions
      .invoke(
        "rumo-ia-interpretar",
        {
          body: {
            texto:
              String(
                texto ||
                ""
              ).trim(),
            data_atual:
              dataIsoLocal(),
            fuso_horario:
              fusoHorario,
            contas:
              (opcoes.contas || [])
                .map(
                  (item) => ({
                    nome:
                      item.nome,
                    banco:
                      item.banco,
                  })
                ),
            categorias:
              (opcoes.categorias || [])
                .map(
                  (item) => ({
                    nome:
                      item.nome,
                    tipo:
                      item.tipo,
                  })
                ),
            cartoes:
              (opcoes.cartoes || [])
                .map(
                  (item) => ({
                    nome:
                      item.nome,
                    banco:
                      item.banco,
                    final_cartao:
                      item.final_cartao,
                  })
                ),
          },
        }
      );

  if (error) {
    throw error;
  }

  const interpretacao =
    data?.interpretation;

  if (!interpretacao) {
    throw new Error(
      data?.message ||
      "A IA não retornou uma interpretação válida."
    );
  }

  if (
    interpretacao.needs_clarification
  ) {
    return {
      origem:
        "openai",
      tipo:
        "clarificacao",
      pergunta:
        interpretacao.clarification ||
        "Pode me dar um pouco mais de contexto?",
      confianca:
        Number(
          interpretacao.confidence ||
          0
        ),
    };
  }

  if (
    interpretacao.kind ===
    "pergunta" ||
    interpretacao.intent ===
    "pergunta"
  ) {
    return {
      origem:
        "openai",
      tipo:
        "pergunta",
      confianca:
        Number(
          interpretacao.confidence ||
          0
        ),
    };
  }

  const acao =
    montarAcao(
      interpretacao,
      opcoes
    );

  if (!acao) {
    return {
      origem:
        "openai",
      tipo:
        "pergunta",
      confianca:
        Number(
          interpretacao.confidence ||
          0
        ),
    };
  }

  return {
    origem:
      "openai",
    tipo:
      "acao",
    acao,
    confianca:
      Number(
        interpretacao.confidence ||
        0
      ),
  };
}
