import {
    useEffect,
    useState
} from "react";

import {
    ArrowDownRight,
    ArrowUpRight,
    Sparkles
} from "lucide-react";

import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";

import {
    obterProjecoesFinanceiras
} from "../services/projecoes";

import "./Projecoes.css";


function formatarMoeda(valor) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function Projecoes() {

    const [
        dados,
        setDados
    ] = useState(null);

    const [
        carregando,
        setCarregando
    ] = useState(true);

    const [
        erro,
        setErro
    ] = useState("");


    useEffect(() => {

        carregarProjecoes();

    }, []);


    async function carregarProjecoes() {

        try {

            setCarregando(true);
            setErro("");

            const resultado =
                await obterProjecoesFinanceiras();

            setDados(resultado);

        } catch (error) {

            console.error(
                "[RUMO PROJECOES]",
                error
            );

            setErro(
                "Não foi possível carregar suas projeções financeiras."
            );

        } finally {

            setCarregando(false);

        }

    }


    const saldoReal =
        Number(
            dados?.saldo_real || 0
        );

    const saldo30 =
        Number(
            dados?.dias_30
                ?.saldo_projetado || 0
        );

    const saldo60 =
        Number(
            dados?.dias_60
                ?.saldo_projetado || 0
        );

    const saldo90 =
        Number(
            dados?.dias_90
                ?.saldo_projetado || 0
        );

    const dadosGrafico =
        (
            dados?.evolucao || []
        ).map(
            (item) => ({
                data:
                    new Date(
                        `${item.data}T12:00:00`
                    ).toLocaleDateString(
                        "pt-BR",
                        {
                            day: "2-digit",
                            month: "2-digit"
                        }
                    ),

                saldo:
                    Number(
                        item.saldo || 0
                    )
            })
        );

    const proximasMovimentacoes =
        dados?.proximas_movimentacoes || [];

    const primeiroSaldoNegativo =
        (
            dados?.evolucao || []
        ).find(
            (item) =>
                Number(
                    item.saldo || 0
                ) < 0
        ) || null;

    const variacao30 =
        saldo30 -
        saldoReal;

    const fluxo30 =
        Number(
            dados?.dias_30
                ?.receitas_previstas || 0
        ) -
        Number(
            dados?.dias_30
                ?.despesas_previstas || 0
        );

    const leituraProjecao =
        primeiroSaldoNegativo
            ? {
                titulo:
                    "Zona de atenção à frente",
                descricao:
                    `A projeção cruza saldo negativo em ${formatarData(
                        primeiroSaldoNegativo.data
                    )}. Revise os compromissos anteriores a essa data.`,
                status:
                    "Risco projetado",
            }
            : variacao30 < 0
                ? {
                    titulo:
                        "Seu saldo perde força",
                    descricao:
                        `A projeção de 30 dias cai ${formatarMoeda(
                            Math.abs(
                                variacao30
                            )
                        )}. As saídas previstas estão pressionando o caixa.`,
                    status:
                        "Atenção",
                }
                : {
                    titulo:
                        "Trajetória financeira positiva",
                    descricao:
                        `Nos próximos 30 dias o fluxo previsto acrescenta ${formatarMoeda(
                            Math.max(
                                0,
                                fluxo30
                            )
                        )} ao cenário atual.`,
                    status:
                        "Direção saudável",
                };


    function formatarData(data) {

        if (!data) {
            return "";
        }

        return new Date(
            `${data}T12:00:00`
        ).toLocaleDateString(
            "pt-BR"
        );

    }


    return (

        <MainLayout>

            <PageContainer>

                <PageHeader
                    titulo="Projeções Financeiras"
                    subtitulo="Antecipe seu futuro financeiro com base no saldo atual e nas movimentações previstas."
                >

                    <div className="projecoes-premium-badge">

                        <Sparkles size={15} />

                        Premium

                    </div>

                </PageHeader>


                {
                    carregando && (

                        <div className="projecoes-estado">

                            Calculando suas projeções...

                        </div>

                    )
                }


                {
                    !carregando &&
                    erro && (

                        <div className="projecoes-estado erro">

                            <strong>
                                Não foi possível carregar
                            </strong>

                            <span>
                                {erro}
                            </span>

                            <button
                                type="button"
                                onClick={
                                    carregarProjecoes
                                }
                            >
                                Tentar novamente
                            </button>

                        </div>

                    )
                }


                {
                    !carregando &&
                    !erro &&
                    dados && (

                        <>

                            <section
                                className={
                                    saldo30 >= saldoReal
                                        ? "projecoes-pro-hero positivo"
                                        : "projecoes-pro-hero atencao"
                                }
                            >
                                <div className="projecoes-pro-principal">
                                    <span>Direção dos próximos 30 dias</span>

                                    <strong>
                                        {
                                            formatarMoeda(
                                                saldo30
                                            )
                                        }
                                    </strong>

                                    <p>
                                        {
                                            saldo30 >= saldoReal
                                                ? `Seu saldo projetado melhora ${formatarMoeda(
                                                    saldo30 - saldoReal
                                                )} em relação a hoje.`
                                                : `Seu saldo projetado cai ${formatarMoeda(
                                                    Math.abs(
                                                        saldo30 - saldoReal
                                                    )
                                                )} em relação a hoje.`
                                        }
                                    </p>
                                </div>

                                <div className="projecoes-pro-comparacao">
                                    <div>
                                        <span>Hoje</span>
                                        <strong>
                                            {
                                                formatarMoeda(
                                                    saldoReal
                                                )
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Em 30 dias</span>
                                        <strong>
                                            {
                                                formatarMoeda(
                                                    saldo30
                                                )
                                            }
                                        </strong>
                                    </div>
                                </div>
                            </section>


                                                        <section className="projecoes-timeline">
                                <div className="projecoes-timeline-item atual">
                                    <span>Hoje</span>
                                    <strong>
                                        {formatarMoeda(
                                            saldoReal
                                        )}
                                    </strong>
                                    <small>saldo real</small>
                                </div>

                                <div className="projecoes-timeline-arrow">
                                    →
                                </div>

                                <div className="projecoes-timeline-item">
                                    <span>30 dias</span>
                                    <strong>
                                        {formatarMoeda(
                                            saldo30
                                        )}
                                    </strong>
                                    <small>
                                        {
                                            saldo30 >= saldoReal
                                                ? "melhora"
                                                : "redução"
                                        }
                                    </small>
                                </div>

                                <div className="projecoes-timeline-arrow">
                                    →
                                </div>

                                <div className="projecoes-timeline-item">
                                    <span>60 dias</span>
                                    <strong>
                                        {formatarMoeda(
                                            saldo60
                                        )}
                                    </strong>
                                    <small>projetado</small>
                                </div>

                                <div className="projecoes-timeline-arrow">
                                    →
                                </div>

                                <div className="projecoes-timeline-item">
                                    <span>90 dias</span>
                                    <strong>
                                        {formatarMoeda(
                                            saldo90
                                        )}
                                    </strong>
                                    <small>projetado</small>
                                </div>
                            </section>

                            <section className="projecoes-rumo-insight">
                                <span className="projecoes-rumo-label">
                                    Rumo • leitura preditiva
                                </span>

                                <div>
                                    <strong>
                                        {leituraProjecao.titulo}
                                    </strong>

                                    <small>
                                        {leituraProjecao.status}
                                    </small>
                                </div>

                                <p>
                                    {leituraProjecao.descricao}
                                </p>

                                <div className="projecoes-rumo-micro">
                                    <span>
                                        Entradas 30d
                                        <b>
                                            {formatarMoeda(
                                                dados.dias_30
                                                    ?.receitas_previstas
                                            )}
                                        </b>
                                    </span>

                                    <span>
                                        Saídas 30d
                                        <b>
                                            {formatarMoeda(
                                                dados.dias_30
                                                    ?.despesas_previstas
                                            )}
                                        </b>
                                    </span>
                                </div>
                            </section>

                            <section className="projecoes-painel">

                                <div className="projecoes-painel-cabecalho">

                                    <div>

                                        <span className="projecoes-painel-etiqueta">
                                            Próximos 90 dias
                                        </span>

                                        <h2>
                                            Evolução do saldo projetado
                                        </h2>

                                        <p>
                                            Veja como as movimentações previstas podem alterar seu saldo ao longo do tempo.
                                        </p>

                                    </div>

                                </div>


                                {
                                    dadosGrafico.length > 1
                                        ? (

                                            <div className="projecoes-grafico">

                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >

                                                    <LineChart
                                                        data={dadosGrafico}
                                                        margin={{
                                                            top: 15,
                                                            right: 20,
                                                            left: 15,
                                                            bottom: 5
                                                        }}
                                                    >

                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            vertical={false}
                                                        />

                                                        <XAxis
                                                            dataKey="data"
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />

                                                        <YAxis
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickFormatter={
                                                                (valor) =>
                                                                    Number(valor)
                                                                        .toLocaleString(
                                                                            "pt-BR",
                                                                            {
                                                                                notation:
                                                                                    "compact",
                                                                                maximumFractionDigits:
                                                                                    1
                                                                            }
                                                                        )
                                                            }
                                                        />

                                                        <Tooltip
                                                            formatter={
                                                                (valor) => [
                                                                    formatarMoeda(
                                                                        valor
                                                                    ),
                                                                    "Saldo projetado"
                                                                ]
                                                            }
                                                            labelFormatter={
                                                                (data) =>
                                                                    `Data: ${data}`
                                                            }
                                                        />

                                                        <Line
                                                            type="stepAfter"
                                                            dataKey="saldo"
                                                            strokeWidth={3}
                                                            dot={{
                                                                r: 5
                                                            }}
                                                            activeDot={{
                                                                r: 7
                                                            }}
                                                        />

                                                    </LineChart>

                                                </ResponsiveContainer>

                                            </div>

                                        )
                                        : (

                                            <div className="projecoes-grafico-vazio">

                                                Cadastre movimentações futuras para visualizar a evolução da projeção.

                                            </div>

                                        )
                                }

                            </section>

                            <section className="projecoes-painel projecoes-agenda">

                                <div className="projecoes-painel-cabecalho">

                                    <div>

                                        <span className="projecoes-painel-etiqueta">
                                            Agenda financeira
                                        </span>

                                        <h2>
                                            Próximas movimentações
                                        </h2>

                                        <p>
                                            Receitas, despesas e parcelas de dívidas já previstas para os próximos 90 dias.
                                        </p>

                                    </div>

                                    <span className="projecoes-agenda-contador">
                                        {
                                            proximasMovimentacoes.length
                                        }{" "}
                                        {
                                            proximasMovimentacoes.length === 1
                                                ? "movimentação"
                                                : "movimentações"
                                        }
                                    </span>

                                </div>


                                {
                                    proximasMovimentacoes.length === 0
                                        ? (

                                            <div className="projecoes-grafico-vazio">

                                                Nenhuma movimentação futura cadastrada.

                                            </div>

                                        )
                                        : (

                                            <div className="projecoes-agenda-lista">

                                                {
                                                    proximasMovimentacoes.map(
                                                        (movimentacao) => {

                                                            const receita =
                                                                movimentacao.tipo ===
                                                                "receita";

                                                            return (

                                                                <article
                                                                    key={
                                                                        movimentacao.id
                                                                    }
                                                                    className="projecoes-agenda-item"
                                                                >

                                                                    <div
                                                                        className={
                                                                            receita
                                                                                ? "projecoes-agenda-icone receita"
                                                                                : "projecoes-agenda-icone despesa"
                                                                        }
                                                                    >

                                                                        {
                                                                            receita
                                                                                ? (
                                                                                    <ArrowUpRight
                                                                                        size={21}
                                                                                    />
                                                                                )
                                                                                : (
                                                                                    <ArrowDownRight
                                                                                        size={21}
                                                                                    />
                                                                                )
                                                                        }

                                                                    </div>


                                                                    <div className="projecoes-agenda-info">

                                                                        <strong>
                                                                            {
                                                                                movimentacao.descricao
                                                                            }
                                                                        </strong>

                                                                        <div>

                                                                            {
                                                                                movimentacao.categoria &&
                                                                                (
                                                                                    <span>
                                                                                        {
                                                                                            movimentacao.categoria
                                                                                        }
                                                                                    </span>
                                                                                )
                                                                            }

                                                                            <span className="projecoes-agenda-prevista">
                                                                                {
                                                                                    movimentacao.origem ===
                                                                                    "plano_quitacao"
                                                                                        ? "DÍVIDA PLANEJADA"
                                                                                        : "PREVISTA"
                                                                                }
                                                                            </span>

                                                                        </div>

                                                                    </div>


                                                                    <div className="projecoes-agenda-conta">

                                                                        <span>
                                                                            Conta
                                                                        </span>

                                                                        <strong>
                                                                            {
                                                                                movimentacao.conta ||
                                                                                (
                                                                                    movimentacao.origem ===
                                                                                    "plano_quitacao"
                                                                                        ? "Plano de dívida"
                                                                                        : "—"
                                                                                )
                                                                            }
                                                                        </strong>

                                                                    </div>


                                                                    <div className="projecoes-agenda-data">

                                                                        <span>
                                                                            Data
                                                                        </span>

                                                                        <strong>
                                                                            {
                                                                                formatarData(
                                                                                    movimentacao.data
                                                                                )
                                                                            }
                                                                        </strong>

                                                                    </div>


                                                                    <div
                                                                        className={
                                                                            receita
                                                                                ? "projecoes-agenda-valor receita"
                                                                                : "projecoes-agenda-valor despesa"
                                                                        }
                                                                    >

                                                                        {
                                                                            receita
                                                                                ? "+"
                                                                                : "-"
                                                                        }

                                                                        {
                                                                            formatarMoeda(
                                                                                Math.abs(
                                                                                    Number(
                                                                                        movimentacao.impacto ||
                                                                                        movimentacao.valor ||
                                                                                        0
                                                                                    )
                                                                                )
                                                                            )
                                                                        }

                                                                    </div>

                                                                </article>

                                                            );

                                                        }
                                                    )
                                                }

                                            </div>

                                        )
                                }

                            </section>

                        </>

                    )
                }

            </PageContainer>

        </MainLayout>

    );

}


export default Projecoes;