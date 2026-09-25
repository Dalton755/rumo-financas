import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  ArrowLeftRight,
  BadgePercent,
  Banknote,
  Calculator,
  CalendarClock,
  HandCoins,
  Landmark,
  Percent,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  Scale,
  TrendingUp,
  WalletCards
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import MoneyCalculatorInput from "../components/ui/MoneyCalculatorInput";

import {
  buscarCotacaoDolar
} from "../services/cambio";

import "./Calculadoras.css";

function moeda(valor) {
  return Number(valor || 0)
    .toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n)
    ? n
    : 0;
}

function numeroCambio(valor) {
  let texto =
    String(
      valor ?? ""
    )
      .trim()
      .replace(
        /[^0-9,.-]/g,
        ""
      );

  if (
    texto.includes(",") &&
    texto.includes(".")
  ) {
    texto =
      texto
        .replace(
          /\./g,
          ""
        )
        .replace(
          ",",
          "."
        );
  } else {
    texto =
      texto.replace(
        ",",
        "."
      );
  }

  const n =
    Number(texto);

  return Number.isFinite(n)
    ? n
    : 0;
}

function dolar(valor) {
  return Number(valor || 0)
    .toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "USD"
      }
    );
}

function cotacaoNumero(valor) {
  return Number(valor || 0)
    .toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      }
    );
}

function dataHoraCotacao(valor) {
  if (!valor) {
    return "—";
  }

  const normalizado =
    String(valor)
      .replace(
        " ",
        "T"
      );

  const data =
    new Date(
      normalizado
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return String(valor);
  }

  return data
    .toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
}

function diferencaAnosCompletos(
  inicio,
  fim
) {
  if (!inicio || !fim) {
    return 0;
  }

  const a = new Date(
    `${inicio}T12:00:00`
  );

  const b = new Date(
    `${fim}T12:00:00`
  );

  let anos =
    b.getFullYear() -
    a.getFullYear();

  const aniversario =
    new Date(
      b.getFullYear(),
      a.getMonth(),
      a.getDate()
    );

  if (b < aniversario) {
    anos -= 1;
  }

  return Math.max(
    0,
    anos
  );
}

function contarAvos13(
  admissao,
  desligamento
) {
  if (
    !admissao ||
    !desligamento
  ) {
    return 0;
  }

  const inicio =
    new Date(
      `${admissao}T12:00:00`
    );

  const fim =
    new Date(
      `${desligamento}T12:00:00`
    );

  const ano =
    fim.getFullYear();

  let avos = 0;

  for (
    let mes = 0;
    mes < 12;
    mes += 1
  ) {
    const inicioMes =
      new Date(
        ano,
        mes,
        1
      );

    const fimMes =
      new Date(
        ano,
        mes + 1,
        0
      );

    if (
      fimMes < inicio ||
      inicioMes > fim
    ) {
      continue;
    }

    const primeiroDia =
      inicio > inicioMes
        ? inicio
        : inicioMes;

    const ultimoDia =
      fim < fimMes
        ? fim
        : fimMes;

    const dias =
      Math.floor(
        (
          ultimoDia -
          primeiroDia
        ) /
        86400000
      ) + 1;

    if (dias >= 15) {
      avos += 1;
    }
  }

  return avos;
}

function contarAvosFerias(
  admissao,
  desligamento
) {
  if (
    !admissao ||
    !desligamento
  ) {
    return 0;
  }

  const inicio =
    new Date(
      `${admissao}T12:00:00`
    );

  const fim =
    new Date(
      `${desligamento}T12:00:00`
    );

  if (fim < inicio) {
    return 0;
  }

  let inicioPeriodo =
    new Date(
      fim.getFullYear(),
      inicio.getMonth(),
      inicio.getDate()
    );

  if (inicioPeriodo > fim) {
    inicioPeriodo =
      new Date(
        fim.getFullYear() - 1,
        inicio.getMonth(),
        inicio.getDate()
      );
  }

  let avos = 0;

  for (
    let i = 0;
    i < 12;
    i += 1
  ) {
    const mesInicio =
      new Date(
        inicioPeriodo.getFullYear(),
        inicioPeriodo.getMonth() + i,
        inicioPeriodo.getDate()
      );

    const mesFim =
      new Date(
        inicioPeriodo.getFullYear(),
        inicioPeriodo.getMonth() + i + 1,
        inicioPeriodo.getDate() - 1
      );

    if (mesInicio > fim) {
      break;
    }

    const ultimoDia =
      fim < mesFim
        ? fim
        : mesFim;

    const dias =
      Math.floor(
        (
          ultimoDia -
          mesInicio
        ) /
        86400000
      ) + 1;

    if (dias >= 15) {
      avos += 1;
    }
  }

  return Math.min(
    12,
    avos
  );
}

function Campo({
  label,
  children,
  dica
}) {
  return (
    <label className="calc-field">
      <span>
        {label}
      </span>

      {children}

      {dica && (
        <small>
          {dica}
        </small>
      )}
    </label>
  );
}

function Resultado({
  titulo,
  valor,
  destaque = false,
  detalhe
}) {
  return (
    <div
      className={
        destaque
          ? "calc-result highlight"
          : "calc-result"
      }
    >
      <span>
        {titulo}
      </span>

      <strong>
        {valor}
      </strong>

      {detalhe && (
        <small>
          {detalhe}
        </small>
      )}
    </div>
  );
}

const calculadoras = [
  {
    id: "cambio",
    titulo: "Câmbio USD/BRL",
    descricao:
      "Cotação do dólar e conversão rápida.",
    Icone: Banknote,
    grupo: "dia-a-dia"
  },
  {
    id: "rescisao",
    titulo: "Rescisão CLT",
    descricao:
      "Estimativa de verbas rescisórias.",
    Icone: ReceiptText,
    grupo: "trabalho"
  },
  {
    id: "compostos",
    titulo: "Juros compostos",
    descricao:
      "Veja o efeito dos juros no tempo.",
    Icone: TrendingUp,
    grupo: "juros"
  },
  {
    id: "simples",
    titulo: "Juros simples",
    descricao:
      "Cálculo direto de juros lineares.",
    Icone: Percent,
    grupo: "juros"
  },
  {
    id: "financiamento",
    titulo: "Financiamento",
    descricao:
      "Parcela estimada no sistema PRICE.",
    Icone: Landmark,
    grupo: "credito"
  },
  {
    id: "investimento",
    titulo: "Investimento",
    descricao:
      "Projeção com aportes mensais.",
    Icone: PiggyBank,
    grupo: "investimentos"
  },
  {
    id: "desconto",
    titulo: "Desconto e acréscimo",
    descricao:
      "Preço final após percentual.",
    Icone: BadgePercent,
    grupo: "dia-a-dia"
  },
  {
    id: "porcentagem",
    titulo: "Porcentagem",
    descricao:
      "Descubra X% de qualquer valor.",
    Icone: Calculator,
    grupo: "dia-a-dia"
  },
  {
    id: "reserva",
    titulo: "Reserva de emergência",
    descricao:
      "Meta baseada no seu custo mensal.",
    Icone: HandCoins,
    grupo: "planejamento"
  },
  {
    id: "avista",
    titulo: "À vista x parcelado",
    descricao:
      "Compare o custo real das opções.",
    Icone: WalletCards,
    grupo: "credito"
  }
];

export default function Calculadoras() {
  const [selecionada, setSelecionada] =
    useState(
      () => {
        const id =
          new URLSearchParams(
            window.location.search
          )
            .get(
              "calc"
            );

        return calculadoras.some(
          (item) =>
            item.id === id
        )
          ? id
          : "rescisao";
      }
    );

  const [busca, setBusca] =
    useState("");

  const [salario, setSalario] =
    useState("");

  const [admissao, setAdmissao] =
    useState("");

  const [desligamento, setDesligamento] =
    useState("");

  const [tipoRescisao, setTipoRescisao] =
    useState("sem_justa");

  const [fgts, setFgts] =
    useState("");

  const [
    feriasVencidas,
    setFeriasVencidas
  ] = useState("0");

  const [capital, setCapital] =
    useState("");

  const [taxa, setTaxa] =
    useState("");

  const [periodos, setPeriodos] =
    useState("12");

  const [financiado, setFinanciado] =
    useState("");

  const [parcelas, setParcelas] =
    useState("24");

  const [investInicial, setInvestInicial] =
    useState("");

  const [aporte, setAporte] =
    useState("");

  const [valorBase, setValorBase] =
    useState("");

  const [percentual, setPercentual] =
    useState("");

  const [modoPercentual, setModoPercentual] =
    useState("desconto");

  const [gastoMensal, setGastoMensal] =
    useState("");

  const [mesesReserva, setMesesReserva] =
    useState("6");

  const [precoVista, setPrecoVista] =
    useState("");

  const [totalParcelado, setTotalParcelado] =
    useState("");

  const [numeroParcelas, setNumeroParcelas] =
    useState("12");

  const [valorCambio, setValorCambio] =
    useState("1");

  const [sentidoCambio, setSentidoCambio] =
    useState("USD_BRL");

  const [cotacao, setCotacao] =
    useState(null);

  const [
    carregandoCotacao,
    setCarregandoCotacao
  ] = useState(false);

  const [
    erroCotacao,
    setErroCotacao
  ] = useState("");

  const atualizarCotacao =
    useCallback(
      async () => {
        setCarregandoCotacao(
          true
        );

        setErroCotacao(
          ""
        );

        try {
          const dados =
            await buscarCotacaoDolar();

          setCotacao(
            dados
          );
        } catch (error) {
          console.error(
            "[RUMO CÂMBIO] Erro ao atualizar cotação:",
            error
          );

          setErroCotacao(
            error?.message ||
            "Não foi possível atualizar a cotação."
          );
        } finally {
          setCarregandoCotacao(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      atualizarCotacao();
    },
    [
      atualizarCotacao
    ]
  );

  const resultadoCambio =
    useMemo(
      () => {
        const valor =
          Math.max(
            0,
            numeroCambio(
              valorCambio
            )
          );

        const taxa =
          Number(
            cotacao?.venda ||
            0
          );

        const convertido =
          !taxa
            ? 0
            : sentidoCambio ===
              "USD_BRL"
              ? valor * taxa
              : valor / taxa;

        return {
          valor,
          taxa,
          convertido
        };
      },
      [
        valorCambio,
        sentidoCambio,
        cotacao
      ]
    );

  const filtradas =
    calculadoras.filter(
      (item) =>
        !busca ||
        item.titulo
          .toLowerCase()
          .includes(
            busca.toLowerCase()
          ) ||
        item.descricao
          .toLowerCase()
          .includes(
            busca.toLowerCase()
          )
    );

  const resultadoRescisao =
    useMemo(() => {
      const s =
        numero(salario);

      if (
        !s ||
        !admissao ||
        !desligamento
      ) {
        return null;
      }

      const fim =
        new Date(
          `${desligamento}T12:00:00`
        );

      const diasMes =
        Math.min(
          30,
          fim.getDate()
        );

      const saldo =
        (s / 30) *
        diasMes;

      const avos13 =
        contarAvos13(
          admissao,
          desligamento
        );

      const avosFerias =
        contarAvosFerias(
          admissao,
          desligamento
        );

      const decimo =
        (s / 12) *
        avos13;

      const feriasPropBase =
        (s / 12) *
        avosFerias;

      const feriasProp =
        feriasPropBase *
        (4 / 3);

      const feriasVenc =
        s *
        Math.max(
          0,
          numero(
            feriasVencidas
          )
        ) *
        (4 / 3);

      const anos =
        diferencaAnosCompletos(
          admissao,
          desligamento
        );

      const diasAviso =
        Math.min(
          90,
          30 +
          (
            3 *
            anos
          )
        );

      let aviso = 0;
      let multaFgts = 0;
      let inclui13 = true;
      let incluiFeriasProp = true;

      if (
        tipoRescisao ===
        "sem_justa"
      ) {
        aviso =
          (s / 30) *
          diasAviso;

        multaFgts =
          numero(fgts) *
          0.4;
      }

      if (
        tipoRescisao ===
        "acordo"
      ) {
        aviso =
          (
            (s / 30) *
            diasAviso
          ) / 2;

        multaFgts =
          numero(fgts) *
          0.2;
      }

      if (
        tipoRescisao ===
        "justa"
      ) {
        inclui13 = false;
        incluiFeriasProp = false;
      }

      const total =
        saldo +
        (
          inclui13
            ? decimo
            : 0
        ) +
        (
          incluiFeriasProp
            ? feriasProp
            : 0
        ) +
        feriasVenc +
        aviso +
        multaFgts;

      return {
        saldo,
        decimo:
          inclui13
            ? decimo
            : 0,
        feriasProp:
          incluiFeriasProp
            ? feriasProp
            : 0,
        feriasVenc,
        aviso,
        multaFgts,
        total,
        avos13,
        avosFerias,
        diasAviso
      };
    }, [
      salario,
      admissao,
      desligamento,
      tipoRescisao,
      fgts,
      feriasVencidas
    ]);

  const resultadoComposto =
    useMemo(() => {
      const p =
        numero(capital);

      const i =
        numero(taxa) /
        100;

      const n =
        Math.max(
          0,
          numero(periodos)
        );

      const total =
        p *
        Math.pow(
          1 + i,
          n
        );

      return {
        total,
        juros:
          total - p
      };
    }, [
      capital,
      taxa,
      periodos
    ]);

  const resultadoSimples =
    useMemo(() => {
      const p =
        numero(capital);

      const i =
        numero(taxa) /
        100;

      const n =
        Math.max(
          0,
          numero(periodos)
        );

      const juros =
        p * i * n;

      return {
        total:
          p + juros,
        juros
      };
    }, [
      capital,
      taxa,
      periodos
    ]);

  const resultadoFinanciamento =
    useMemo(() => {
      const pv =
        numero(financiado);

      const i =
        numero(taxa) /
        100;

      const n =
        Math.max(
          1,
          numero(parcelas)
        );

      const prestacao =
        i === 0
          ? pv / n
          : pv *
            (
              i *
              Math.pow(
                1 + i,
                n
              )
            ) /
            (
              Math.pow(
                1 + i,
                n
              ) - 1
            );

      const total =
        prestacao * n;

      return {
        prestacao,
        total,
        juros:
          total - pv
      };
    }, [
      financiado,
      taxa,
      parcelas
    ]);

  const resultadoInvestimento =
    useMemo(() => {
      const inicial =
        numero(investInicial);

      const mensal =
        numero(aporte);

      const i =
        numero(taxa) /
        100;

      const n =
        Math.max(
          0,
          numero(periodos)
        );

      const inicialFinal =
        inicial *
        Math.pow(
          1 + i,
          n
        );

      const aportesFinal =
        i === 0
          ? mensal * n
          : mensal *
            (
              (
                Math.pow(
                  1 + i,
                  n
                ) - 1
              ) /
              i
            );

      const total =
        inicialFinal +
        aportesFinal;

      const investido =
        inicial +
        mensal * n;

      return {
        total,
        investido,
        rendimento:
          total - investido
      };
    }, [
      investInicial,
      aporte,
      taxa,
      periodos
    ]);

  const resultadoDesconto =
    useMemo(() => {
      const base =
        numero(valorBase);

      const p =
        numero(percentual) /
        100;

      const diferenca =
        base * p;

      return {
        diferenca,
        final:
          modoPercentual ===
          "desconto"
            ? base - diferenca
            : base + diferenca
      };
    }, [
      valorBase,
      percentual,
      modoPercentual
    ]);

  const resultadoPorcentagem =
    useMemo(
      () =>
        numero(valorBase) *
        (
          numero(percentual) /
          100
        ),
      [
        valorBase,
        percentual
      ]
    );

  const resultadoReserva =
    useMemo(
      () =>
        numero(gastoMensal) *
        Math.max(
          1,
          numero(mesesReserva)
        ),
      [
        gastoMensal,
        mesesReserva
      ]
    );

  const resultadoVista =
    useMemo(() => {
      const vista =
        numero(precoVista);

      const parcelado =
        numero(totalParcelado);

      const extra =
        parcelado - vista;

      const percentualExtra =
        vista > 0
          ? (
              extra /
              vista
            ) * 100
          : 0;

      const parcela =
        parcelado /
        Math.max(
          1,
          numero(numeroParcelas)
        );

      return {
        extra,
        percentualExtra,
        parcela,
        maisBarato:
          extra > 0
            ? "À vista"
            : extra < 0
              ? "Parcelado"
              : "Mesmo valor"
      };
    }, [
      precoVista,
      totalParcelado,
      numeroParcelas
    ]);

  function renderCalculadora() {
    if (
      selecionada ===
      "cambio"
    ) {
      const deUsd =
        sentidoCambio ===
        "USD_BRL";

      return (
        <>
          <div className="cambio-quote-panel">
            <div className="cambio-quote-head">
              <div>
                <span>
                  Dólar hoje
                </span>

                <strong>
                  {cotacao
                    ? `US$ 1 = R$ ${cotacaoNumero(cotacao.venda)}`
                    : carregandoCotacao
                      ? "Atualizando cotação..."
                      : "Cotação indisponível"
                  }
                </strong>

                <small>
                  {cotacao
                    ? `${cotacao.fonte} · ${cotacao.referencia} · ${dataHoraCotacao(cotacao.dataHora)}`
                    : "Fonte principal: Banco Central do Brasil."
                  }
                </small>
              </div>

              <button
                type="button"
                className="cambio-refresh"
                onClick={
                  atualizarCotacao
                }
                disabled={
                  carregandoCotacao
                }
              >
                <RefreshCw
                  size={15}
                  className={
                    carregandoCotacao
                      ? "spinning"
                      : ""
                  }
                />

                <span>
                  Atualizar
                </span>
              </button>
            </div>

            {cotacao && (
              <div className="cambio-rates">
                <div>
                  <span>
                    Compra
                  </span>

                  <strong>
                    R$ {cotacaoNumero(
                      cotacao.compra
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Venda
                  </span>

                  <strong>
                    R$ {cotacaoNumero(
                      cotacao.venda
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Referência
                  </span>

                  <strong>
                    {cotacao.tipoBoletim}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {erroCotacao && (
            <p className="calc-helper cambio-error">
              {erroCotacao}
            </p>
          )}

          <div className="cambio-direction-row">
            <button
              type="button"
              className="cambio-direction"
              onClick={() =>
                setSentidoCambio(
                  deUsd
                    ? "BRL_USD"
                    : "USD_BRL"
                )
              }
            >
              <span>
                {deUsd
                  ? "USD"
                  : "BRL"
                }
              </span>

              <ArrowLeftRight
                size={16}
              />

              <span>
                {deUsd
                  ? "BRL"
                  : "USD"
                }
              </span>
            </button>

            <small>
              Toque para inverter as moedas.
            </small>
          </div>

          <div className="calc-form-grid">
            <Campo
              label={
                deUsd
                  ? "Valor em dólar"
                  : "Valor em reais"
              }
            >
              <input
                type="text"
                inputMode="decimal"
                value={
                  valorCambio
                }
                onChange={(e) =>
                  setValorCambio(
                    e.target.value
                  )
                }
                placeholder={
                  deUsd
                    ? "100,00"
                    : "500,00"
                }
              />
            </Campo>

            <Campo
              label="Cotação usada"
              dica="A conversão usa a cotação de venda como referência."
            >
              <input
                type="text"
                value={
                  resultadoCambio.taxa
                    ? `R$ ${cotacaoNumero(resultadoCambio.taxa)}`
                    : "Aguardando cotação"
                }
                readOnly
              />
            </Campo>
          </div>

          <div className="calc-results-grid">
            <Resultado
              titulo={
                deUsd
                  ? "Valor estimado em reais"
                  : "Valor estimado em dólar"
              }
              valor={
                deUsd
                  ? moeda(
                      resultadoCambio.convertido
                    )
                  : dolar(
                      resultadoCambio.convertido
                    )
              }
              destaque
              detalhe={
                cotacao?.fallback
                  ? cotacao.aviso
                  : "Conversão de referência; bancos, cartões, IOF e spreads podem alterar o valor final."
              }
            />

            <Resultado
              titulo="Valor informado"
              valor={
                deUsd
                  ? dolar(
                      resultadoCambio.valor
                    )
                  : moeda(
                      resultadoCambio.valor
                    )
              }
            />

            <Resultado
              titulo="Fonte"
              valor={
                cotacao?.fallback
                  ? "Alternativa"
                  : "BCB · PTAX"
              }
              detalhe={
                cotacao
                  ? dataHoraCotacao(
                      cotacao.dataHora
                    )
                  : "Aguardando atualização"
              }
            />
          </div>
        </>
      );
    }

    if (
      selecionada ===
      "rescisao"
    ) {
      return (
        <>
          <div className="calc-form-grid">
            <Campo label="Salário bruto">
              <MoneyCalculatorInput
                value={salario}
                onChange={setSalario}
              />
            </Campo>

            <Campo label="Tipo de desligamento">
              <select
                value={tipoRescisao}
                onChange={(e) =>
                  setTipoRescisao(
                    e.target.value
                  )
                }
              >
                <option value="sem_justa">
                  Demissão sem justa causa
                </option>

                <option value="pedido">
                  Pedido de demissão
                </option>

                <option value="acordo">
                  Acordo entre as partes
                </option>

                <option value="justa">
                  Demissão por justa causa
                </option>
              </select>
            </Campo>

            <Campo label="Data de admissão">
              <input
                type="date"
                value={admissao}
                onChange={(e) =>
                  setAdmissao(
                    e.target.value
                  )
                }
              />
            </Campo>

            <Campo label="Data de desligamento">
              <input
                type="date"
                value={desligamento}
                min={
                  admissao ||
                  undefined
                }
                onChange={(e) =>
                  setDesligamento(
                    e.target.value
                  )
                }
              />
            </Campo>

            <Campo
              label="Saldo aproximado do FGTS"
              dica="Usado para estimar a multa rescisória."
            >
              <MoneyCalculatorInput
                value={fgts}
                onChange={setFgts}
              />
            </Campo>

            <Campo label="Períodos de férias vencidas">
              <select
                value={feriasVencidas}
                onChange={(e) =>
                  setFeriasVencidas(
                    e.target.value
                  )
                }
              >
                <option value="0">
                  Nenhum
                </option>
                <option value="1">
                  1 período
                </option>
                <option value="2">
                  2 períodos
                </option>
              </select>
            </Campo>
          </div>

          {resultadoRescisao && (
            <div className="calc-results-grid">
              <Resultado
                titulo="Estimativa bruta"
                valor={moeda(
                  resultadoRescisao.total
                )}
                destaque
              />

              <Resultado
                titulo="Saldo de salário"
                valor={moeda(
                  resultadoRescisao.saldo
                )}
              />

              <Resultado
                titulo="13º proporcional"
                valor={moeda(
                  resultadoRescisao.decimo
                )}
                detalhe={
                  `${resultadoRescisao.avos13}/12 avos`
                }
              />

              <Resultado
                titulo="Férias proporcionais + 1/3"
                valor={moeda(
                  resultadoRescisao.feriasProp
                )}
                detalhe={
                  `${resultadoRescisao.avosFerias}/12 avos`
                }
              />

              <Resultado
                titulo="Férias vencidas + 1/3"
                valor={moeda(
                  resultadoRescisao.feriasVenc
                )}
              />

              <Resultado
                titulo="Aviso prévio estimado"
                valor={moeda(
                  resultadoRescisao.aviso
                )}
                detalhe={
                  resultadoRescisao.aviso
                    ? `${resultadoRescisao.diasAviso} dias considerados`
                    : "Não considerado neste tipo"
                }
              />

              <Resultado
                titulo="Multa estimada do FGTS"
                valor={moeda(
                  resultadoRescisao.multaFgts
                )}
              />
            </div>
          )}

          <div className="calc-legal-note">
            <Scale size={17} />

            <p>
              Estimativa educativa de valores brutos.
              Convenção coletiva, aviso trabalhado,
              médias, descontos, férias em dobro,
              impostos e outras verbas podem alterar
              o valor oficial do TRCT.
            </p>
          </div>
        </>
      );
    }

    if (
      selecionada ===
      "compostos" ||
      selecionada ===
      "simples"
    ) {
      const r =
        selecionada ===
        "compostos"
          ? resultadoComposto
          : resultadoSimples;

      return (
        <>
          <div className="calc-form-grid">
            <Campo label="Valor inicial">
              <MoneyCalculatorInput
                value={capital}
                onChange={setCapital}
              />
            </Campo>

            <Campo label="Taxa ao mês (%)">
              <input
                type="number"
                inputMode="decimal"
                value={taxa}
                onChange={(e) =>
                  setTaxa(
                    e.target.value
                  )
                }
                placeholder="1,00"
              />
            </Campo>

            <Campo label="Quantidade de meses">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={periodos}
                onChange={(e) =>
                  setPeriodos(
                    e.target.value
                  )
                }
              />
            </Campo>
          </div>

          <div className="calc-results-grid">
            <Resultado
              titulo="Montante final"
              valor={moeda(r.total)}
              destaque
            />

            <Resultado
              titulo="Juros acumulados"
              valor={moeda(r.juros)}
            />
          </div>
        </>
      );
    }

    if (
      selecionada ===
      "financiamento"
    ) {
      return (
        <>
          <div className="calc-form-grid">
            <Campo label="Valor financiado">
              <MoneyCalculatorInput
                value={financiado}
                onChange={setFinanciado}
              />
            </Campo>

            <Campo label="Taxa ao mês (%)">
              <input
                type="number"
                inputMode="decimal"
                value={taxa}
                onChange={(e) =>
                  setTaxa(
                    e.target.value
                  )
                }
                placeholder="1,50"
              />
            </Campo>

            <Campo label="Número de parcelas">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={parcelas}
                onChange={(e) =>
                  setParcelas(
                    e.target.value
                  )
                }
              />
            </Campo>
          </div>

          <div className="calc-results-grid">
            <Resultado
              titulo="Parcela estimada"
              valor={moeda(
                resultadoFinanciamento.prestacao
              )}
              destaque
            />

            <Resultado
              titulo="Total pago"
              valor={moeda(
                resultadoFinanciamento.total
              )}
            />

            <Resultado
              titulo="Custo em juros"
              valor={moeda(
                resultadoFinanciamento.juros
              )}
            />
          </div>

          <p className="calc-helper">
            Simulação pelo sistema PRICE.
            CET, seguros e tarifas não estão incluídos.
          </p>
        </>
      );
    }

    if (
      selecionada ===
      "investimento"
    ) {
      return (
        <>
          <div className="calc-form-grid">
            <Campo label="Valor inicial">
              <MoneyCalculatorInput
                value={investInicial}
                onChange={setInvestInicial}
              />
            </Campo>

            <Campo label="Aporte mensal">
              <MoneyCalculatorInput
                value={aporte}
                onChange={setAporte}
              />
            </Campo>

            <Campo label="Rentabilidade ao mês (%)">
              <input
                type="number"
                inputMode="decimal"
                value={taxa}
                onChange={(e) =>
                  setTaxa(
                    e.target.value
                  )
                }
                placeholder="0,80"
              />
            </Campo>

            <Campo label="Prazo em meses">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={periodos}
                onChange={(e) =>
                  setPeriodos(
                    e.target.value
                  )
                }
              />
            </Campo>
          </div>

          <div className="calc-results-grid">
            <Resultado
              titulo="Patrimônio projetado"
              valor={moeda(
                resultadoInvestimento.total
              )}
              destaque
            />

            <Resultado
              titulo="Total investido"
              valor={moeda(
                resultadoInvestimento.investido
              )}
            />

            <Resultado
              titulo="Rendimento estimado"
              valor={moeda(
                resultadoInvestimento.rendimento
              )}
            />
          </div>
        </>
      );
    }

    if (
      selecionada ===
      "desconto"
    ) {
      return (
        <>
          <div className="calc-form-grid">
            <Campo label="Valor">
              <MoneyCalculatorInput
                value={valorBase}
                onChange={setValorBase}
              />
            </Campo>

            <Campo label="Operação">
              <select
                value={modoPercentual}
                onChange={(e) =>
                  setModoPercentual(
                    e.target.value
                  )
                }
              >
                <option value="desconto">
                  Aplicar desconto
                </option>

                <option value="acrescimo">
                  Aplicar acréscimo
                </option>
              </select>
            </Campo>

            <Campo label="Percentual (%)">
              <input
                type="number"
                inputMode="decimal"
                value={percentual}
                onChange={(e) =>
                  setPercentual(
                    e.target.value
                  )
                }
              />
            </Campo>
          </div>

          <div className="calc-results-grid">
            <Resultado
              titulo="Valor final"
              valor={moeda(
                resultadoDesconto.final
              )}
              destaque
            />

            <Resultado
              titulo={
                modoPercentual ===
                "desconto"
                  ? "Economia"
                  : "Acréscimo"
              }
              valor={moeda(
                resultadoDesconto.diferenca
              )}
            />
          </div>
        </>
      );
    }

    if (
      selecionada ===
      "porcentagem"
    ) {
      return (
        <>
          <div className="calc-form-grid">
            <Campo label="Valor base">
              <MoneyCalculatorInput
                value={valorBase}
                onChange={setValorBase}
              />
            </Campo>

            <Campo label="Percentual (%)">
              <input
                type="number"
                inputMode="decimal"
                value={percentual}
                onChange={(e) =>
                  setPercentual(
                    e.target.value
                  )
                }
              />
            </Campo>
          </div>

          <div className="calc-results-grid">
            <Resultado
              titulo={
                `${numero(percentual)}% de ${moeda(numero(valorBase))}`
              }
              valor={moeda(
                resultadoPorcentagem
              )}
              destaque
            />
          </div>
        </>
      );
    }

    if (
      selecionada ===
      "reserva"
    ) {
      return (
        <>
          <div className="calc-form-grid">
            <Campo label="Custo mensal essencial">
              <MoneyCalculatorInput
                value={gastoMensal}
                onChange={setGastoMensal}
              />
            </Campo>

            <Campo label="Meses de proteção">
              <select
                value={mesesReserva}
                onChange={(e) =>
                  setMesesReserva(
                    e.target.value
                  )
                }
              >
                <option value="3">
                  3 meses
                </option>
                <option value="6">
                  6 meses
                </option>
                <option value="9">
                  9 meses
                </option>
                <option value="12">
                  12 meses
                </option>
              </select>
            </Campo>
          </div>

          <div className="calc-results-grid">
            <Resultado
              titulo="Meta da reserva"
              valor={moeda(
                resultadoReserva
              )}
              destaque
            />

            <Resultado
              titulo="Proteção escolhida"
              valor={
                `${mesesReserva} meses`
              }
            />
          </div>
        </>
      );
    }

    return (
      <>
        <div className="calc-form-grid">
          <Campo label="Preço à vista">
            <MoneyCalculatorInput
              value={precoVista}
              onChange={setPrecoVista}
            />
          </Campo>

          <Campo label="Total parcelado">
            <MoneyCalculatorInput
              value={totalParcelado}
              onChange={setTotalParcelado}
            />
          </Campo>

          <Campo label="Número de parcelas">
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={numeroParcelas}
              onChange={(e) =>
                setNumeroParcelas(
                  e.target.value
                )
              }
            />
          </Campo>
        </div>

        <div className="calc-results-grid">
          <Resultado
            titulo="Opção mais barata"
            valor={
              resultadoVista.maisBarato
            }
            destaque
          />

          <Resultado
            titulo="Parcela"
            valor={moeda(
              resultadoVista.parcela
            )}
          />

          <Resultado
            titulo="Diferença total"
            valor={moeda(
              Math.abs(
                resultadoVista.extra
              )
            )}
            detalhe={
              `${Math.abs(resultadoVista.percentualExtra).toFixed(1)}% de diferença`
            }
          />
        </div>
      </>
    );
  }

  const atual =
    calculadoras.find(
      (item) =>
        item.id ===
        selecionada
    );

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          titulo="Cálculos"
          subtitulo="Ferramentas rápidas para decidir melhor sem sair do Rumo."
        />

        <section className="calculadoras-shell">
          <aside className="calculadoras-browser">
            <div className="calculadoras-search">
              <Calculator size={16} />

              <input
                type="search"
                placeholder="Buscar cálculo"
                value={busca}
                onChange={(e) =>
                  setBusca(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="calculadoras-list">
              {filtradas.map(
                ({
                  id,
                  titulo,
                  descricao,
                  Icone
                }) => (
                  <button
                    type="button"
                    key={id}
                    className={
                      selecionada === id
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSelecionada(id)
                    }
                  >
                    <span className="calculadoras-list-icon">
                      <Icone size={18} />
                    </span>

                    <span>
                      <strong>
                        {titulo}
                      </strong>

                      <small>
                        {descricao}
                      </small>
                    </span>
                  </button>
                )
              )}
            </div>
          </aside>

          <section className="calculadora-workspace">
            <div className="calculadora-workspace-header">
              <span className="calculadora-workspace-icon">
                {atual?.Icone && (
                  <atual.Icone
                    size={20}
                  />
                )}
              </span>

              <div>
                <span>
                  Calculadora
                </span>

                <h2>
                  {atual?.titulo}
                </h2>

                <p>
                  {atual?.descricao}
                </p>
              </div>
            </div>

            {renderCalculadora()}
          </section>
        </section>
      </PageContainer>
    </MainLayout>
  );
}
