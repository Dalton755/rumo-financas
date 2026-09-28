import { supabase } from "./supabase";
import { salvarMovimentacao } from "./movimentacoes";
import {
  criarCompraCartao,
  listarCartoes,
} from "./cartoes";
import { criarMeta } from "./metas";
import {
  criarCompromissoUnico,
} from "./compromissos";
import {
  extrairValorDaPergunta,
} from "./rumoIaLocal";


function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


function dataIsoLocal(data = new Date()) {
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


function proximoDiaSemana(indice) {
  const hoje =
    new Date();

  hoje.setHours(
    12,
    0,
    0,
    0
  );

  let diferenca =
    (
      indice -
      hoje.getDay() +
      7
    ) % 7;

  if (diferenca === 0) {
    diferenca = 7;
  }

  const data =
    new Date(hoje);

  data.setDate(
    data.getDate() +
    diferenca
  );

  return dataIsoLocal(data);
}


function extrairData(texto) {
  const normal =
    normalizar(texto);

  if (
    normal.includes("ontem")
  ) {
    const data =
      new Date();

    data.setDate(
      data.getDate() - 1
    );

    return dataIsoLocal(data);
  }

  if (
    /\bdepois\s+de\s+amanha\b/
      .test(normal)
  ) {
    const data =
      new Date();

    data.setDate(
      data.getDate() + 2
    );

    return dataIsoLocal(data);
  }

  if (
    normal.includes("amanha")
  ) {
    const data =
      new Date();

    data.setDate(
      data.getDate() + 1
    );

    return dataIsoLocal(data);
  }

  if (
    normal.includes("hoje")
  ) {
    return dataIsoLocal();
  }

  const dias = [
    {
      indice: 0,
      padrao:
        /\bdomingo(?:\s+que\s+vem)?\b/,
    },
    {
      indice: 1,
      padrao:
        /\bsegunda(?:[-\s]+feira)?(?:\s+que\s+vem)?\b/,
    },
    {
      indice: 2,
      padrao:
        /\bterca(?:[-\s]+feira)?(?:\s+que\s+vem)?\b/,
    },
    {
      indice: 3,
      padrao:
        /\bquarta(?:[-\s]+feira)?(?:\s+que\s+vem)?\b/,
    },
    {
      indice: 4,
      padrao:
        /\bquinta(?:[-\s]+feira)?(?:\s+que\s+vem)?\b/,
    },
    {
      indice: 5,
      padrao:
        /\bsexta(?:[-\s]+feira)?(?:\s+que\s+vem)?\b/,
    },
    {
      indice: 6,
      padrao:
        /\bsabado(?:\s+que\s+vem)?\b/,
    },
  ];

  for (
    const item of dias
  ) {
    if (
      item.padrao.test(
        normal
      )
    ) {
      return proximoDiaSemana(
        item.indice
      );
    }
  }

  const dataBr =
    String(texto || "")
      .match(
        /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/
      );

  if (dataBr) {
    const hoje =
      new Date();

    const anoInformado =
      dataBr[3]
        ? Number(
            dataBr[3]
          )
        : hoje.getFullYear();

    const ano =
      anoInformado < 100
        ? 2000 +
          anoInformado
        : anoInformado;

    return [
      ano,
      String(
        Number(dataBr[2])
      ).padStart(2, "0"),
      String(
        Number(dataBr[1])
      ).padStart(2, "0"),
    ].join("-");
  }

  return dataIsoLocal();
}


function temReferenciaData(texto) {
  const normal =
    normalizar(texto);

  return (
    /\b(hoje|ontem|amanha|domingo|segunda(?:[-\s]+feira)?|terca(?:[-\s]+feira)?|quarta(?:[-\s]+feira)?|quinta(?:[-\s]+feira)?|sexta(?:[-\s]+feira)?|sabado)\b/
      .test(normal) ||
    /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/
      .test(
        String(
          texto ||
          ""
        )
      )
  );
}


function extrairParcelas(texto) {
  const match =
    normalizar(texto)
      .match(
        /\b(\d{1,3})\s*x\b/
      );

  if (!match) {
    return 1;
  }

  return Math.min(
    120,
    Math.max(
      1,
      Number(match[1]) ||
      1
    )
  );
}


function limparDescricao(
  texto,
  valor
) {
  let resultado =
    String(texto || "");

  const padroes = [
    /\b(tenho que pagar|preciso pagar|vou pagar|tenho para pagar|vencimento|vence|gastei|paguei|comprei|recebi|ganhei|entrou|caiu|quero|guardar|juntar|economizar|criar uma meta|crie uma meta|quero uma meta|meta de)\b/gi,
    /\bdepois\s+de\s+amanh[ãa]\b/gi,
    /\b(hoje|ontem|amanhã|amanha)\b/gi,
    /\b(?:segunda|terça|terca|quarta|quinta|sexta)(?:[-\s]+feira)?(?:\s+que\s+vem)?\b/gi,
    /\b(?:sábado|sabado|domingo)(?:\s+que\s+vem)?\b/gi,
    /\bque\s+vem\b/gi,
    /\b(no|na|pelo|pela|com o|com a)\s+(cart[aã]o|cr[eé]dito)\b/gi,
    /\bem\s+\d{1,3}\s*x\b/gi,
    /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g,
  ];

  padroes.forEach(
    (padrao) => {
      resultado =
        resultado.replace(
          padrao,
          " "
        );
    }
  );

  if (
    valor !== null &&
    valor !== undefined
  ) {
    resultado =
      resultado.replace(
        /(?:r\$\s*)?(?:\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+\.\d{1,2}|\d+(?:,\d{1,2})?)/gi,
        " "
      );
  }

  resultado =
    resultado
      .replace(
        /\b(de|do|da|dos|das|no|na|nos|nas|em|para|por|pro|pra|pros|pras|um|uma)\b/gi,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .replace(
        /^[\s.,;-]+|[\s.,;-]+$/g,
        ""
      )
      .trim();

  if (!resultado) {
    return "";
  }

  return (
    resultado
      .charAt(0)
      .toUpperCase() +
    resultado.slice(1)
  );
}


const aliasesCategoria = {
  combustivel: [
    "gasolina",
    "combustivel",
    "posto",
    "etanol",
    "alcool",
  ],
  transporte: [
    "uber",
    "99",
    "onibus",
    "metro",
    "transporte",
    "moto",
  ],
  alimentacao: [
    "mercado",
    "supermercado",
    "comida",
    "almoco",
    "jantar",
    "lanche",
    "restaurante",
    "ifood",
  ],
  moradia: [
    "aluguel",
    "condominio",
    "luz",
    "energia",
    "agua",
    "internet",
  ],
  saude: [
    "farmacia",
    "remedio",
    "medico",
    "saude",
  ],
  salario: [
    "salario",
    "pagamento",
    "holerite",
  ],
  renda: [
    "shopee",
    "freela",
    "freelance",
    "corrida",
    "recebimento",
    "renda",
  ],
};


function sugerirCategoria(
  texto,
  categorias,
  tipo
) {
  const normal =
    normalizar(texto);

  const candidatas =
    (categorias || [])
      .filter(
        (item) =>
          item.tipo === tipo
      );

  const exata =
    candidatas.find(
      (item) =>
        normal.includes(
          normalizar(
            item.nome
          )
        )
    );

  if (exata) {
    return exata.id;
  }

  for (
    const categoria of
    candidatas
  ) {
    const nome =
      normalizar(
        categoria.nome
      );

    const aliases =
      Object.entries(
        aliasesCategoria
      )
        .find(
          ([chave]) =>
            nome.includes(chave) ||
            chave.includes(nome)
        )
        ?.[1] ||
      [];

    if (
      aliases.some(
        (alias) =>
          normal.includes(
            alias
          )
      )
    ) {
      return categoria.id;
    }
  }

  if (
    candidatas.length === 1
  ) {
    return candidatas[0].id;
  }

  return "";
}


function sugerirPorNome(
  texto,
  itens
) {
  const normal =
    normalizar(texto);

  const encontrado =
    (itens || []).find(
      (item) => {
        const termos = [
          item.nome,
          item.banco,
          item.final_cartao,
        ]
          .filter(Boolean)
          .map(
            normalizar
          );

        return termos.some(
          (termo) =>
            termo.length >= 3 &&
            normal.includes(
              termo
            )
        );
      }
    );

  if (encontrado) {
    return encontrado.id;
  }

  if (
    (itens || []).length === 1
  ) {
    return itens[0].id;
  }

  return "";
}


function sugerirConta(
  texto,
  contas,
  historico,
  {
    tipo,
    categoriaId,
  } = {}
) {
  const porNome =
    sugerirPorNome(
      texto,
      contas
    );

  if (porNome) {
    return porNome;
  }

  if (
    (contas || []).length === 1
  ) {
    return contas[0].id;
  }

  const candidatos =
    (historico || [])
      .filter(
        (item) =>
          item.conta_id &&
          (
            !tipo ||
            item.tipo === tipo
          )
      );

  const mesmaCategoria =
    categoriaId
      ? candidatos.filter(
          (item) =>
            item.categoria_id ===
            categoriaId
        )
      : [];

  const base =
    mesmaCategoria.length
      ? mesmaCategoria
      : candidatos;

  if (!base.length) {
    return "";
  }

  const frequencia =
    new Map();

  base.forEach(
    (item) => {
      frequencia.set(
        item.conta_id,
        (
          frequencia.get(
            item.conta_id
          ) ||
          0
        ) +
        1
      );
    }
  );

  const ordem =
    [...frequencia.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1]
      );

  return (
    ordem[0]?.[0] ||
    base[0]?.conta_id ||
    ""
  );
}


function detectarTipo(texto) {
  const normal =
    normalizar(texto);

  const temValor =
    extrairValorDaPergunta(
      texto
    ) !== null;

  if (!temValor) {
    return null;
  }

  const meta =
    /\b(meta|guardar|juntar|economizar)\b/
      .test(normal);

  if (meta) {
    return "meta";
  }

  const mencionaCartao =
    /\b(cartao|fatura|credito)\b/
      .test(normal);

  const obrigacaoFutura =
    /\b(tenho que pagar|preciso pagar|vou pagar|tenho para pagar|vence|vencimento)\b/
      .test(normal);

  if (
    obrigacaoFutura &&
    !mencionaCartao
  ) {
    return "compromisso_unico";
  }

  const compra =
    /\b(gastei|paguei|comprei|compra|pagar)\b/
      .test(normal);

  const cartao =
    mencionaCartao ||
    /\b\d{1,3}\s*x\b/
      .test(normal);

  if (
    compra &&
    cartao
  ) {
    return "compra_cartao";
  }

  const receita =
    /\b(recebi|ganhei|entrou|caiu|receita)\b/
      .test(normal);

  if (receita) {
    return "receita";
  }

  if (compra) {
    return "despesa";
  }

  return null;
}


export async function listarOpcoesRumoAcoes() {
  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth
      .getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const [
    contasResp,
    categoriasResp,
    historicoResp,
    cartoes,
  ] =
    await Promise.all([
      supabase
        .schema("rumo")
        .from("contas")
        .select(
          "id,nome,banco,tipo"
        )
        .eq(
          "usuario_id",
          user.id
        )
        .eq(
          "ativo",
          true
        )
        .order("nome"),

      supabase
        .schema("rumo")
        .from("categorias")
        .select(
          "id,nome,tipo"
        )
        .eq(
          "usuario_id",
          user.id
        )
        .eq(
          "ativo",
          true
        )
        .order("nome"),

      supabase
        .schema("rumo")
        .from("movimentacoes")
        .select(
          "conta_id,categoria_id,tipo,data_movimentacao"
        )
        .eq(
          "usuario_id",
          user.id
        )
        .not(
          "conta_id",
          "is",
          null
        )
        .order(
          "data_movimentacao",
          {
            ascending: false
          }
        )
        .limit(120),

      listarCartoes(),
    ]);

  if (contasResp.error) {
    throw contasResp.error;
  }

  if (categoriasResp.error) {
    throw categoriasResp.error;
  }

  if (historicoResp.error) {
    throw historicoResp.error;
  }

  return {
    contas:
      contasResp.data ||
      [],

    categorias:
      categoriasResp.data ||
      [],

    historico:
      historicoResp.data ||
      [],

    cartoes:
      cartoes ||
      [],
  };
}


export function interpretarAcaoRumo(
  texto,
  opcoes = {}
) {
  const tipo =
    detectarTipo(texto);

  if (!tipo) {
    return null;
  }

  const valor =
    extrairValorDaPergunta(
      texto
    );

  if (
    valor === null ||
    valor <= 0
  ) {
    return null;
  }

  const descricao =
    limparDescricao(
      texto,
      valor
    );

  const data =
    extrairData(texto);

  if (
    tipo === "despesa" ||
    tipo === "receita"
  ) {
    const categoriaId =
      sugerirCategoria(
        texto,
        opcoes.categorias,
        tipo
      );

    const contaId =
      sugerirConta(
        texto,
        opcoes.contas,
        opcoes.historico,
        {
          tipo,
          categoriaId,
        }
      );

    return {
      tipo,
      rotulo:
        tipo === "receita"
          ? "Registrar receita"
          : "Registrar despesa",

      descricao:
        descricao ||
        (
          tipo === "receita"
            ? "Receita"
            : "Despesa"
        ),

      valor,
      data,

      conta_id:
        contaId,

      categoria_id:
        categoriaId,

      observacao:
        "Criado pelo Rumo IA",
    };
  }

  if (
    tipo ===
    "compromisso_unico"
  ) {
    const categoriaId =
      sugerirCategoria(
        texto,
        opcoes.categorias,
        "despesa"
      );

    const contaId =
      sugerirConta(
        texto,
        opcoes.contas,
        opcoes.historico,
        {
          tipo:
            "despesa",
          categoriaId,
        }
      );

    return {
      tipo,
      rotulo:
        "Adicionar obrigação",

      descricao:
        descricao ||
        "Obrigação",

      valor,

      vencimento:
        temReferenciaData(
          texto
        )
          ? extrairData(
              texto
            )
          : "",

      conta_id:
        contaId,

      categoria_id:
        categoriaId,

      observacao:
        "Criado pelo Rumo IA",
    };
  }


  if (
    tipo ===
    "compra_cartao"
  ) {
    return {
      tipo,
      rotulo:
        "Registrar compra no cartão",

      descricao:
        descricao ||
        "Compra no cartão",

      valor,
      data,

      cartao_id:
        sugerirPorNome(
          texto,
          opcoes.cartoes
        ),

      categoria_id:
        sugerirCategoria(
          texto,
          opcoes.categorias,
          "despesa"
        ),

      parcelas:
        extrairParcelas(
          texto
        ),

      observacao:
        "Criado pelo Rumo IA",
    };
  }

  if (tipo === "meta") {
    return {
      tipo,
      rotulo:
        "Criar meta",

      descricao:
        descricao ||
        "Nova meta",

      valor,
      prazo:
        null,

      conta_id:
        sugerirPorNome(
          texto,
          opcoes.contas
        ),
    };
  }

  return null;
}


export async function executarAcaoRumo(
  acao
) {
  if (!acao?.tipo) {
    throw new Error(
      "Ação não informada."
    );
  }

  if (
    !acao.descricao?.trim()
  ) {
    throw new Error(
      "Informe a descrição."
    );
  }

  if (
    !Number.isFinite(
      Number(acao.valor)
    ) ||
    Number(acao.valor) <= 0
  ) {
    throw new Error(
      "Informe um valor válido."
    );
  }

  if (
    acao.tipo === "despesa" ||
    acao.tipo === "receita"
  ) {
    if (!acao.conta_id) {
      throw new Error(
        "Selecione uma conta."
      );
    }

    if (!acao.categoria_id) {
      throw new Error(
        "Selecione uma categoria."
      );
    }

    const {
      data: { user },
      error,
    } =
      await supabase.auth
        .getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error(
        "Usuário não autenticado."
      );
    }

    await salvarMovimentacao({
      usuario_id:
        user.id,

      tipo:
        acao.tipo,

      descricao:
        acao.descricao.trim(),

      valor:
        Number(
          acao.valor
        ),

      conta_id:
        acao.conta_id,

      conta_destino_id:
        null,

      categoria_id:
        acao.categoria_id,

      data_movimentacao:
        acao.data ||
        dataIsoLocal(),

      observacao:
        acao.observacao ||
        "Criado pelo Rumo IA",
    });

    return {
      tipo:
        acao.tipo,

      titulo:
        acao.tipo ===
        "receita"
          ? "Receita registrada"
          : "Despesa registrada",
    };
  }

  if (
    acao.tipo ===
    "compromisso_unico"
  ) {
    if (!acao.vencimento) {
      throw new Error(
        "Informe o vencimento."
      );
    }

    await criarCompromissoUnico({
      nome:
        acao.descricao.trim(),

      categoriaId:
        acao.categoria_id ||
        null,

      contaId:
        acao.conta_id ||
        null,

      vencimento:
        acao.vencimento,

      tipoValor:
        "fixo",

      valor:
        Number(
          acao.valor
        ),
    });

    return {
      tipo:
        acao.tipo,

      titulo:
        "Obrigação adicionada",
    };
  }


  if (
    acao.tipo ===
    "compra_cartao"
  ) {
    if (!acao.cartao_id) {
      throw new Error(
        "Selecione um cartão."
      );
    }

    if (!acao.categoria_id) {
      throw new Error(
        "Selecione uma categoria."
      );
    }

    await criarCompraCartao({
      cartaoId:
        acao.cartao_id,

      categoriaId:
        acao.categoria_id,

      descricao:
        acao.descricao.trim(),

      valorTotal:
        Number(
          acao.valor
        ),

      dataCompra:
        acao.data ||
        dataIsoLocal(),

      parcelasTotal:
        Math.max(
          1,
          Number(
            acao.parcelas
          ) ||
          1
        ),

      observacao:
        acao.observacao ||
        "Criado pelo Rumo IA",
    });

    return {
      tipo:
        acao.tipo,

      titulo:
        "Compra no cartão registrada",
    };
  }

  if (
    acao.tipo === "meta"
  ) {
    await criarMeta({
      descricao:
        acao.descricao.trim(),

      valorMeta:
        Number(
          acao.valor
        ),

      valorAtual:
        0,

      prazo:
        acao.prazo ||
        null,

      contaId:
        acao.conta_id ||
        null,
    });

    return {
      tipo:
        acao.tipo,

      titulo:
        "Meta criada",
    };
  }

  throw new Error(
    "Ação ainda não suportada."
  );
}
