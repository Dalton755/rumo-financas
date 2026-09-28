import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    kind: {
      type: "string",
      enum: ["acao", "pergunta"],
    },
    intent: {
      type: "string",
      enum: [
        "despesa",
        "receita",
        "compra_cartao",
        "compromisso_unico",
        "meta",
        "pergunta",
      ],
    },
    description: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
    value: {
      anyOf: [
        { type: "number" },
        { type: "null" },
      ],
    },
    date: {
      anyOf: [
        {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
        { type: "null" },
      ],
    },
    due_date: {
      anyOf: [
        {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
        { type: "null" },
      ],
    },
    installments: {
      anyOf: [
        {
          type: "integer",
          minimum: 1,
          maximum: 120,
        },
        { type: "null" },
      ],
    },
    account_hint: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
    category_hint: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
    card_hint: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
    needs_clarification: {
      type: "boolean",
    },
    clarification: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
  },
  required: [
    "kind",
    "intent",
    "description",
    "value",
    "date",
    "due_date",
    "installments",
    "account_hint",
    "category_hint",
    "card_hint",
    "confidence",
    "needs_clarification",
    "clarification",
  ],
};

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}

function extractOutputText(
  payload: Record<string, unknown>,
) {
  if (
    typeof payload.output_text ===
    "string"
  ) {
    return payload.output_text;
  }

  const output =
    Array.isArray(payload.output)
      ? payload.output
      : [];

  for (const item of output) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }

    const content =
      Array.isArray(
        (item as {
          content?: unknown[];
        }).content,
      )
        ? (item as {
            content: unknown[];
          }).content
        : [];

    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        (
          part as {
            type?: string;
          }
        ).type === "output_text" &&
        typeof (
          part as {
            text?: unknown;
          }
        ).text === "string"
      ) {
        return (
          part as {
            text: string;
          }
        ).text;
      }
    }
  }

  return null;
}

Deno.serve(
  async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        },
      );
    }

    if (req.method !== "POST") {
      return jsonResponse(
        {
          error:
            "Método não permitido.",
        },
        405,
      );
    }

    const apiKey =
      Deno.env.get(
        "OPENAI_API_KEY",
      );

    if (!apiKey) {
      return jsonResponse(
        {
          error:
            "RUMO_IA_NOT_CONFIGURED",
          message:
            "A chave da OpenAI ainda não foi configurada no servidor.",
        },
        503,
      );
    }

    let body: {
      texto?: string;
      data_atual?: string;
      fuso_horario?: string;
      contas?: Array<{
        nome?: string;
        banco?: string;
      }>;
      categorias?: Array<{
        nome?: string;
        tipo?: string;
      }>;
      cartoes?: Array<{
        nome?: string;
        banco?: string;
        final_cartao?: string;
      }>;
    };

    try {
      body =
        await req.json();
    } catch {
      return jsonResponse(
        {
          error:
            "JSON_INVALIDO",
        },
        400,
      );
    }

    const texto =
      String(
        body.texto ||
        "",
      ).trim();

    if (
      !texto ||
      texto.length > 800
    ) {
      return jsonResponse(
        {
          error:
            "TEXTO_INVALIDO",
        },
        400,
      );
    }

    const dataAtual =
      String(
        body.data_atual ||
        "",
      );

    const fuso =
      String(
        body.fuso_horario ||
        "America/Sao_Paulo",
      );

    const contextoPermitido = {
      contas:
        (body.contas || [])
          .slice(0, 30),
      categorias:
        (body.categorias || [])
          .slice(0, 60),
      cartoes:
        (body.cartoes || [])
          .slice(0, 30),
    };

    const systemPrompt = [
      "Você é a camada de entendimento de linguagem do app financeiro Rumo.",
      "Sua única função é interpretar a frase do usuário e extrair intenção e entidades.",
      "Não dê aconselhamento financeiro, não calcule saldos e não execute ações.",
      "Responda apenas no schema solicitado.",
      "",
      "Regras fundamentais:",
      "- Português do Brasil, inclusive linguagem informal.",
      "- Use a data atual fornecida para resolver hoje, amanhã, depois de amanhã, sexta, segunda que vem etc.",
      "- 'paguei', 'gastei', 'comprei' no passado/presente indicam algo já realizado.",
      "- 'tenho que pagar', 'preciso pagar', 'vou pagar', 'vence' indicam obrigação futura.",
      "- Compra no cartão deve usar intent compra_cartao.",
      "- Uma obrigação futura sem indicação clara de recorrência deve usar compromisso_unico.",
      "- Se for apenas pergunta financeira, use kind=pergunta e intent=pergunta.",
      "- Nunca invente conta, categoria ou cartão. account_hint/category_hint/card_hint só podem usar um nome fornecido no contexto; caso contrário, null.",
      "- description deve conter somente o objeto/beneficiário/descrição útil, sem valor, data, 'tenho que pagar', 'pro/pra', dia da semana ou expressões como 'que vem'.",
      "- value é sempre o valor monetário total mencionado, em número.",
      "- date é a data em que algo já aconteceu ou a data da compra/receita; due_date é o vencimento de obrigação futura.",
      "- Para compromisso_unico, preencha due_date e deixe date null.",
      "- Para despesa/receita/compra_cartao, preencha date. Se a frase não trouxer data, use a data atual.",
      "- Para compra_cartao, installments é o número de parcelas; se não houver, use 1.",
      "- Se faltar um dado indispensável para reconhecer a intenção com segurança, needs_clarification=true e escreva uma pergunta curta em clarification.",
    ].join("\n");

    const userPayload = {
      texto,
      data_atual:
        dataAtual,
      fuso_horario:
        fuso,
      contexto:
        contextoPermitido,
    };

    const model =
      Deno.env.get(
        "OPENAI_MODEL",
      ) ||
      "gpt-5.6-luna";

    let response: Response;

    try {
      response =
        await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",
            headers: {
              "Authorization":
                `Bearer ${apiKey}`,
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                model,
                input: [
                  {
                    role:
                      "system",
                    content:
                      systemPrompt,
                  },
                  {
                    role:
                      "user",
                    content:
                      JSON.stringify(
                        userPayload,
                      ),
                  },
                ],
                reasoning: {
                  effort:
                    "none",
                },
                text: {
                  format: {
                    type:
                      "json_schema",
                    name:
                      "rumo_interpretacao",
                    strict:
                      true,
                    schema,
                  },
                },
                max_output_tokens:
                  700,
              }),
          },
        );
    } catch (error) {
      console.error(
        "[RUMO IA] Falha de rede OpenAI:",
        error,
      );

      return jsonResponse(
        {
          error:
            "OPENAI_NETWORK_ERROR",
        },
        502,
      );
    }

    const payload =
      await response.json();

    if (!response.ok) {
      const openAiError =
        payload &&
        typeof payload === "object"
          ? (
              payload as {
                error?: {
                  type?: string;
                  code?: string | null;
                  message?: string;
                  param?: string | null;
                };
              }
            ).error
          : undefined;

      const safeError = {
        error:
          "OPENAI_ERROR",
        status:
          response.status,
        openai_type:
          openAiError?.type ||
          null,
        openai_code:
          openAiError?.code ||
          null,
        openai_param:
          openAiError?.param ||
          null,
        openai_message:
          openAiError?.message ||
          "A OpenAI rejeitou a requisição.",
      };

      console.error(
        "[RUMO IA] OpenAI:",
        JSON.stringify(
          safeError,
        ),
      );

      return jsonResponse(
        safeError,
        502,
      );
    }

    const outputText =
      extractOutputText(
        payload,
      );

    if (!outputText) {
      return jsonResponse(
        {
          error:
            "OPENAI_EMPTY_OUTPUT",
        },
        502,
      );
    }

    try {
      const interpretation =
        JSON.parse(
          outputText,
        );

      return jsonResponse({
        interpretation,
        model,
      });
    } catch (error) {
      console.error(
        "[RUMO IA] JSON inválido:",
        error,
      );

      return jsonResponse(
        {
          error:
            "OPENAI_INVALID_JSON",
        },
        502,
      );
    }
  },
);
