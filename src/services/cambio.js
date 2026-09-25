const BCB_BASE =
  "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";

const AWESOME_API =
  "https://economia.awesomeapi.com.br/json/last/USD-BRL";

function dataBcb(data) {
  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${mes}-${dia}-${data.getFullYear()}`;
}

async function buscarJson(url) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      8000
    );

  try {
    const resposta =
      await fetch(
        url,
        {
          cache: "no-store",
          signal:
            controller.signal
        }
      );

    if (!resposta.ok) {
      throw new Error(
        `HTTP ${resposta.status}`
      );
    }

    return await resposta.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function buscarNoBcb() {
  const fim =
    new Date();

  const inicio =
    new Date(fim);

  inicio.setDate(
    fim.getDate() - 10
  );

  const parametros =
    new URLSearchParams();

  parametros.set(
    "@dataInicial",
    `'${dataBcb(inicio)}'`
  );

  parametros.set(
    "@dataFinalCotacao",
    `'${dataBcb(fim)}'`
  );

  parametros.set(
    "$top",
    "1"
  );

  parametros.set(
    "$orderby",
    "dataHoraCotacao desc"
  );

  parametros.set(
    "$format",
    "json"
  );

  const url =
    `${BCB_BASE}/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?${parametros.toString()}`;

  const dados =
    await buscarJson(url);

  const item =
    dados?.value?.[0];

  if (
    !item ||
    !Number.isFinite(
      Number(item.cotacaoVenda)
    )
  ) {
    throw new Error(
      "Cotação PTAX indisponível."
    );
  }

  return {
    compra:
      Number(
        item.cotacaoCompra
      ),
    venda:
      Number(
        item.cotacaoVenda
      ),
    dataHora:
      item.dataHoraCotacao,
    tipoBoletim:
      item.tipoBoletim ||
      "Último boletim",
    fonte:
      "Banco Central do Brasil",
    referencia:
      "PTAX",
    fallback:
      false
  };
}

async function buscarNoFallback() {
  const dados =
    await buscarJson(
      AWESOME_API
    );

  const item =
    dados?.USDBRL;

  if (
    !item ||
    !Number.isFinite(
      Number(item.ask)
    )
  ) {
    throw new Error(
      "Cotação alternativa indisponível."
    );
  }

  return {
    compra:
      Number(
        item.bid
      ),
    venda:
      Number(
        item.ask
      ),
    dataHora:
      item.timestamp
        ? new Date(
            Number(
              item.timestamp
            ) * 1000
          ).toISOString()
        : new Date()
            .toISOString(),
    tipoBoletim:
      "Mercado",
    fonte:
      "AwesomeAPI",
    referencia:
      "USD/BRL",
    fallback:
      true,
    aviso:
      "Fonte alternativa usada porque a PTAX não respondeu."
  };
}

export async function buscarCotacaoDolar() {
  try {
    return await buscarNoBcb();
  } catch (erroBcb) {
    console.warn(
      "[RUMO CÂMBIO] Falha na PTAX:",
      erroBcb
    );

    try {
      return await buscarNoFallback();
    } catch (erroFallback) {
      console.error(
        "[RUMO CÂMBIO] Falha no fallback:",
        erroFallback
      );

      throw new Error(
        "Não foi possível atualizar a cotação do dólar agora."
      );
    }
  }
}
