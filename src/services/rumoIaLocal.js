function numero(valor) {
  const convertido = Number(valor || 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

export function formatarMoedaRumo(valor) {
  return numero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function extrairValorDaPergunta(texto) {
  const bruto = String(texto || "");
  const match = bruto.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|\d+(?:[.,]\d{1,2})?)/i);

  if (!match?.[1]) {
    return null;
  }

  let valor = match[1].trim();

  if (valor.includes(".") && valor.includes(",")) {
    valor = valor.replace(/\./g, "").replace(",", ".");
  } else if (valor.includes(",")) {
    valor = valor.replace(",", ".");
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(valor)) {
    valor = valor.replace(/\./g, "");
  }

  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

function dataLocal(valor) {
  if (!valor) {
    return null;
  }

  const data = new Date(`${valor}T12:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

function somarCompromissos(lista) {
  return (lista || []).reduce(
    (total, item) =>
      total +
      numero(
        item?.valor_real ??
        item?.valor_previsto
      ),
    0
  );
}

function somarParcelasDividas(lista) {
  return (lista || []).reduce(
    (total, item) =>
      total +
      numero(
        item?.valor_restante ??
        (
          numero(
            item?.valor_previsto
          ) -
          numero(
            item?.valor_pago
          )
        )
      ),
    0
  );
}

function somarFaturasCartao(lista) {
  return (lista || []).reduce(
    (total, item) =>
      total +
      numero(
        item?.valor
      ),
    0
  );
}

export function montarContextoRumoIa(
  dados,
  compromissos = [],
  parcelasDividas = [],
  faturasCartao = []
) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const limite7 = new Date(hoje);
  limite7.setDate(limite7.getDate() + 7);

  const limite30 = new Date(hoje);
  limite30.setDate(limite30.getDate() + 30);

  const pendentes = (compromissos || []).filter(
    (item) => {
      const vencimento = dataLocal(item?.vencimento);
      return vencimento && vencimento >= hoje;
    }
  );

  const compromissos7 = pendentes.filter(
    (item) => dataLocal(item?.vencimento) <= limite7
  );

  const compromissos30 = pendentes.filter(
    (item) => dataLocal(item?.vencimento) <= limite30
  );

  const dividasPendentes =
    (parcelasDividas || []).filter(
      (item) => {
        const vencimento =
          dataLocal(
            item?.semana_referencia
          );

        return vencimento;
      }
    );

  const dividas7 =
    dividasPendentes.filter(
      (item) => {
        const vencimento =
          dataLocal(
            item?.semana_referencia
          );

        return vencimento <= limite7;
      }
    );

  const dividas30 =
    dividasPendentes.filter(
      (item) => {
        const vencimento =
          dataLocal(
            item?.semana_referencia
          );

        return vencimento <= limite30;
      }
    );

  const faturasPendentes =
    (faturasCartao || []).filter(
      (item) =>
        dataLocal(
          item?.vencimento
        )
    );

  const faturas7 =
    faturasPendentes.filter(
      (item) =>
        dataLocal(
          item?.vencimento
        ) <= limite7
    );

  const faturas30 =
    faturasPendentes.filter(
      (item) =>
        dataLocal(
          item?.vencimento
        ) <= limite30
    );

  const saldoReal = numero(
    dados?.saldo_real_contas
  );

  const totalCompromissos7 =
    somarCompromissos(compromissos7);

  const totalCompromissos30 =
    somarCompromissos(compromissos30);

  const totalDividas7 =
    somarParcelasDividas(
      dividas7
    );

  const totalDividas30 =
    somarParcelasDividas(
      dividas30
    );

  const totalCartoes7 =
    somarFaturasCartao(
      faturas7
    );

  const totalCartoes30 =
    somarFaturasCartao(
      faturas30
    );

  const totalObrigacoes7 =
    totalCompromissos7 +
    totalDividas7 +
    totalCartoes7;

  const totalObrigacoes30 =
    totalCompromissos30 +
    totalDividas30 +
    totalCartoes30;

  return {
    saldoReal,
    receitasMes: numero(
      dados?.mes_atual?.receitas
    ),
    despesasMes: numero(
      dados?.mes_atual?.despesas
    ),
    saldoMes: numero(
      dados?.mes_atual?.saldo
    ),
    taxaEconomia:
      dados?.mes_atual?.taxa_economia_pct ??
      null,
    maiorCategoria:
      dados?.maior_categoria_despesa ??
      null,
    receitasPrevistas30: numero(
      dados?.proximos_30_dias?.receitas_previstas
    ),
    despesasPrevistas30:
      numero(
        dados?.proximos_30_dias?.despesas_previstas
      ) +
      totalDividas30 +
      totalCartoes30,
    saldoPrevisto30:
      numero(
        dados?.proximos_30_dias?.saldo_previsto
      ) -
      totalDividas30 -
      totalCartoes30,
    compromissos7,
    compromissos30,
    dividas7,
    dividas30,
    faturas7,
    faturas30,
    totalCompromissos7,
    totalCompromissos30,
    totalDividas7,
    totalDividas30,
    totalCartoes7,
    totalCartoes30,
    totalObrigacoes7,
    totalObrigacoes30,
    disponivelProtegido7:
      saldoReal - totalObrigacoes7,
  };
}

export function gerarResumoRumo(contexto) {
  if (!contexto) {
    return null;
  }

  const {
    saldoReal,
    totalObrigacoes7,
    disponivelProtegido7,
    receitasMes,
    despesasMes,
    saldoPrevisto30,
  } = contexto;

  if (totalObrigacoes7 > saldoReal) {
    const falta =
      totalObrigacoes7 - saldoReal;

    return {
      tipo: "critico",
      titulo: "Sua semana exige atenção",
      resposta:
        `Há ${formatarMoedaRumo(totalObrigacoes7)} em obrigações nos próximos 7 dias e ${formatarMoedaRumo(saldoReal)} de saldo real. Faltam ${formatarMoedaRumo(falta)} para cobrir esses vencimentos.`,
    };
  }

  if (saldoPrevisto30 < 0) {
    return {
      tipo: "atencao",
      titulo: "Existe pressão nos próximos 30 dias",
      resposta:
        `Sua projeção de 30 dias está em ${formatarMoedaRumo(saldoPrevisto30)}. Hoje, depois de proteger as obrigações dos próximos 7 dias, restam ${formatarMoedaRumo(Math.max(0, disponivelProtegido7))}.`,
    };
  }

  if (despesasMes > receitasMes) {
    return {
      tipo: "atencao",
      titulo: "As saídas estão acima das entradas",
      resposta:
        `Neste mês, as despesas superam as receitas em ${formatarMoedaRumo(despesasMes - receitasMes)}. Seus próximos 7 dias ainda deixam ${formatarMoedaRumo(Math.max(0, disponivelProtegido7))} fora das obrigações já identificadas.`,
    };
  }

  return {
    tipo: "positivo",
    titulo: "Seu cenário atual está coberto",
    resposta:
      totalObrigacoes7 > 0
        ? `Seu saldo real é ${formatarMoedaRumo(saldoReal)}. Depois de reservar ${formatarMoedaRumo(totalObrigacoes7)} para os próximos 7 dias, ficam ${formatarMoedaRumo(Math.max(0, disponivelProtegido7))} sem obrigação identificada nesse período.`
        : `Seu saldo real é ${formatarMoedaRumo(saldoReal)} e não há obrigações pendentes identificadas para os próximos 7 dias.`,
  };
}

export function avaliarCompra(
  valorInformado,
  contexto
) {
  const valor =
    typeof valorInformado === "number"
      ? valorInformado
      : extrairValorDaPergunta(
          String(valorInformado || "")
        );

  if (
    !contexto ||
    valor === null ||
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    return {
      tipo: "informacao",
      titulo: "Informe o valor da compra",
      resposta:
        "Digite um valor maior que zero para eu comparar com seu saldo e todas as obrigações dos próximos 7 dias, incluindo dívidas e faturas.",
    };
  }

  const saldoDepois =
    contexto.saldoReal - valor;

  const saldoDepoisDosCompromissos =
    saldoDepois -
    contexto.totalObrigacoes7;

  if (valor > contexto.saldoReal) {
    return {
      tipo: "critico",
      titulo: "O valor supera seu saldo atual",
      resposta:
        `A compra de ${formatarMoedaRumo(valor)} ultrapassa seu saldo real em ${formatarMoedaRumo(valor - contexto.saldoReal)}.`,
    };
  }

  if (saldoDepoisDosCompromissos < 0) {
    return {
      tipo: "atencao",
      titulo: "A compra pressiona seus próximos vencimentos",
      resposta:
        `Depois de gastar ${formatarMoedaRumo(valor)}, faltariam ${formatarMoedaRumo(Math.abs(saldoDepoisDosCompromissos))} para manter cobertos as obrigações dos próximos 7 dias.`,
    };
  }

  return {
    tipo: "positivo",
    titulo: "A compra cabe no cenário atual",
    resposta:
      `Após uma compra de ${formatarMoedaRumo(valor)} e a reserva de ${formatarMoedaRumo(contexto.totalObrigacoes7)} para os próximos 7 dias, restariam ${formatarMoedaRumo(saldoDepoisDosCompromissos)}.`,
  };
}

export function responderPerguntaRumo(
  pergunta,
  contexto
) {
  const texto =
    normalizarTexto(pergunta);

  if (!texto) {
    return {
      tipo: "informacao",
      titulo: "Pergunte sobre suas finanças",
      resposta:
        "Você pode perguntar sobre saldo, gastos do mês, receitas, compromissos, próximos 30 dias ou quanto pode gastar agora.",
    };
  }

  if (
    texto.includes("posso gastar") ||
    texto.includes("posso comprar") ||
    texto.includes("compra de") ||
    texto.includes("gastar r$")
  ) {
    const valor =
      extrairValorDaPergunta(pergunta);

    if (valor !== null) {
      return avaliarCompra(
        valor,
        contexto
      );
    }

    return {
      tipo:
        contexto.disponivelProtegido7 >= 0
          ? "positivo"
          : "critico",
      titulo: "Disponível sem tocar nos próximos vencimentos",
      resposta:
        contexto.disponivelProtegido7 >= 0
          ? `Considerando o saldo atual e as obrigações dos próximos 7 dias, ${formatarMoedaRumo(contexto.disponivelProtegido7)} não está comprometido por esses vencimentos.`
          : `As obrigações dos próximos 7 dias já superam seu saldo atual em ${formatarMoedaRumo(Math.abs(contexto.disponivelProtegido7))}.`,
    };
  }

  if (
    texto.includes("quanto posso gastar") ||
    texto.includes("quanto esta disponivel") ||
    texto.includes("quanto tenho livre")
  ) {
    return {
      tipo:
        contexto.disponivelProtegido7 >= 0
          ? "positivo"
          : "critico",
      titulo: "Valor não comprometido nos próximos 7 dias",
      resposta:
        contexto.disponivelProtegido7 >= 0
          ? `Seu saldo real é ${formatarMoedaRumo(contexto.saldoReal)}. Reservando ${formatarMoedaRumo(contexto.totalObrigacoes7)} para os próximos vencimentos, ficam ${formatarMoedaRumo(contexto.disponivelProtegido7)}.`
          : `Hoje existe um déficit de ${formatarMoedaRumo(Math.abs(contexto.disponivelProtegido7))} entre seu saldo e as obrigações dos próximos 7 dias.`,
    };
  }

  if (
    texto.includes("quanto tenho") ||
    texto === "saldo" ||
    texto.includes("meu saldo")
  ) {
    return {
      tipo: "informacao",
      titulo: "Seu saldo atual",
      resposta:
        `Seu saldo real das contas é ${formatarMoedaRumo(contexto.saldoReal)}. As obrigações identificadas para os próximos 7 dias somam ${formatarMoedaRumo(contexto.totalObrigacoes7)}.`,
    };
  }

  if (
    texto.includes("compromisso") ||
    texto.includes("venc") ||
    texto.includes("contas da semana") ||
    texto.includes("quanto devo")
  ) {
    return {
      tipo:
        contexto.totalObrigacoes7 >
        contexto.saldoReal
          ? "critico"
          : "informacao",
      titulo: "Próximos compromissos",
      resposta:
        `Existem ${contexto.compromissos7.length} compromisso(s) pendente(s) nos próximos 7 dias, somando ${formatarMoedaRumo(contexto.totalObrigacoes7)}. Em até 30 dias, os compromissos identificados somam ${formatarMoedaRumo(contexto.totalCompromissos30)}.`,
    };
  }

  if (
    texto.includes("divida") ||
    texto.includes("parcela")
  ) {
    return {
      tipo:
        contexto.totalDividas7 >
        contexto.saldoReal
          ? "critico"
          : "informacao",
      titulo:
        "Parcelas de dívidas planejadas",
      resposta:
        contexto.dividas7.length > 0
          ? `Há ${contexto.dividas7.length} parcela(s) de dívida pendente(s) até os próximos 7 dias, somando ${formatarMoedaRumo(contexto.totalDividas7)}. Em até 30 dias, elas somam ${formatarMoedaRumo(contexto.totalDividas30)}.`
          : "Não há parcelas de dívidas pendentes previstas para os próximos 7 dias.",
    };
  }


  if (
    texto.includes("cartao") ||
    texto.includes("fatura") ||
    texto.includes("credito")
  ) {
    return {
      tipo:
        contexto.totalCartoes7 >
        contexto.saldoReal
          ? "critico"
          : "informacao",
      titulo:
        "Faturas de cartão",
      resposta:
        contexto.faturas7.length > 0
          ? `Há ${contexto.faturas7.length} fatura(s) pendente(s) até os próximos 7 dias, somando ${formatarMoedaRumo(contexto.totalCartoes7)}. Em até 30 dias, as faturas pendentes somam ${formatarMoedaRumo(contexto.totalCartoes30)}.`
          : contexto.faturas30.length > 0
            ? `Não há fatura vencendo nos próximos 7 dias. Em até 30 dias, há ${formatarMoedaRumo(contexto.totalCartoes30)} em faturas pendentes.`
            : "Não há faturas pendentes previstas para os próximos 30 dias.",
    };
  }


  if (
    texto.includes("gasto") ||
    texto.includes("despesa")
  ) {
    const categoria =
      contexto.maiorCategoria?.categoria;

    const complemento =
      categoria
        ? ` A maior categoria é ${categoria}, com ${formatarMoedaRumo(contexto.maiorCategoria?.valor)}.`
        : "";

    return {
      tipo:
        contexto.despesasMes >
        contexto.receitasMes
          ? "atencao"
          : "informacao",
      titulo: "Seus gastos neste mês",
      resposta:
        `As despesas do mês somam ${formatarMoedaRumo(contexto.despesasMes)}.${complemento}`,
    };
  }

  if (
    texto.includes("receita") ||
    texto.includes("ganhei") ||
    texto.includes("entrou")
  ) {
    return {
      tipo: "informacao",
      titulo: "Suas receitas neste mês",
      resposta:
        `As receitas registradas no mês somam ${formatarMoedaRumo(contexto.receitasMes)}. O resultado entre receitas e despesas está em ${formatarMoedaRumo(contexto.saldoMes)}.`,
    };
  }

  if (
    texto.includes("30 dias") ||
    texto.includes("projec") ||
    texto.includes("futuro")
  ) {
    return {
      tipo:
        contexto.saldoPrevisto30 < 0
          ? "atencao"
          : "informacao",
      titulo: "Visão dos próximos 30 dias",
      resposta:
        `A projeção atual aponta ${formatarMoedaRumo(contexto.receitasPrevistas30)} em receitas previstas e ${formatarMoedaRumo(contexto.despesasPrevistas30)} em despesas previstas, com saldo projetado de ${formatarMoedaRumo(contexto.saldoPrevisto30)}.`,
    };
  }

  if (
    texto.includes("econom") ||
    texto.includes("guardar")
  ) {
    const taxa =
      contexto.taxaEconomia;

    return {
      tipo:
        Number(taxa || 0) >= 0
          ? "informacao"
          : "atencao",
      titulo: "Taxa de economia",
      resposta:
        taxa === null ||
        taxa === undefined
          ? "Ainda não há dados suficientes para calcular sua taxa de economia."
          : `Sua taxa de economia no período está em ${Math.abs(Number(taxa)).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}%${Number(taxa) < 0 ? " negativa" : ""}.`,
    };
  }

  return gerarResumoRumo(
    contexto
  );
}
