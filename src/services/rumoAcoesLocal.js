import { supabase } from "./supabase";
import { salvarMovimentacao } from "./movimentacoes";
import {
  criarCompraCartao,
  listarCartoes,
} from "./cartoes";
import { criarMeta } from "./metas";
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

  const dias = {
    domingo: 0,
    segunda: 1,
    "segunda-feira": 1,
    terca: 2,
    "terca-feira": 2,
    quarta: 3,
    "quarta-feira": 3,
    quinta: 4,
    "quinta-feira": 4,
    sexta: 5,
    "sexta-feira": 5,
    sabado: 6,
  };

  for (
    const [
      nome,
      indice,
    ] of Object.entries(
      dias
    )
  ) {
    if (
      normal.includes(nome)
    ) {
      return proximoDiaSemana(
        indice
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
    /\b(gastei|paguei|comprei|recebi|ganhei|entrou|caiu|guardar|juntar|economizar|criar uma meta|crie uma meta|quero uma meta|meta de)\b/gi,
    /\b(hoje|ontem|amanhã|amanha)\b/gi,
    /\b(no|na|pelo|pela|com o|com a)\s+(cart[aã]o|cr[eé]dito)\b/gi,
    /\bem\s+\d{1,3}\s*x\b/gi,
    /\b(segunda(?:-feira)?|terça(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sábado|sabado|domingo)\b/gi,
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
        /(?:r\$\s*)?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|(?:r\$\s*)?\d+(?:[.,]\d{1,2})?/gi,
        " "
      );
  }

  resultado =
    resultado
      .replace(
        /\b(de|do|da|dos|das|para|por|um|uma)\b/gi,
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

  const compra =
    /\b(gastei|paguei|comprei|compra|pagar)\b/
      .test(normal);

  const cartao =
    /\b(cartao|credito)\b/
      .test(normal) ||
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

      listarCartoes(),
    ]);

  if (contasResp.error) {
    throw contasResp.error;
  }

  if (categoriasResp.error) {
    throw categoriasResp.error;
  }

  return {
    contas:
      contasResp.data ||
      [],

    categorias:
      categoriasResp.data ||
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
        sugerirPorNome(
          texto,
          opcoes.contas
        ),

      categoria_id:
        sugerirCategoria(
          texto,
          opcoes.categorias,
          tipo
        ),

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
