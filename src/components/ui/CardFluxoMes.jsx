import Card from "./Card";
import "./CardFluxoMes.css";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

export default function CardFluxoMes({
    receitas = 0,
    despesas = 0
}) {
    const resultado =
        Number(receitas) -
        Number(despesas);

    const dados = [
        {
            nome: "Receitas",
            valor: Number(receitas),
            cor: "#278b5e"
        },
        {
            nome: "Despesas",
            valor: Number(despesas),
            cor: "#c85a5a"
        },
        {
            nome: "Resultado",
            valor: resultado,
            cor:
                resultado >= 0
                    ? "#0f9fb3"
                    : "#d97706"
        }
    ];

    function formatarMoeda(valor) {
        return Number(valor || 0)
            .toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL",
                    maximumFractionDigits: 0
                }
            );
    }

    return (
        <Card className="rumo-fluxo-card">
            <div className="rumo-fluxo-header">
                <div>
                    <span className="rumo-section-eyebrow">
                        Fluxo financeiro
                    </span>

                    <h3>
                        Visão do mês
                    </h3>

                    <p>
                        Compare entradas, saídas e o resultado do período.
                    </p>
                </div>

                <span className="rumo-fluxo-periodo">
                    Mensal
                </span>
            </div>

            <div className="rumo-fluxo-chart">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >
                    <BarChart
                        data={dados}
                        margin={{
                            top: 8,
                            right: 0,
                            left: -20,
                            bottom: 0
                        }}
                    >
                        <CartesianGrid
                            stroke="#edf1f5"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="nome"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fill: "#7a8797",
                                fontSize: 10
                            }}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fill: "#9aa5b2",
                                fontSize: 9
                            }}
                            tickFormatter={(valor) =>
                                Number(valor)
                                    .toLocaleString(
                                        "pt-BR",
                                        {
                                            notation: "compact",
                                            maximumFractionDigits: 1
                                        }
                                    )
                            }
                        />

                        <Tooltip
                            cursor={{
                                fill:
                                    "rgba(15, 159, 179, .035)"
                            }}
                            formatter={(valor) => [
                                Number(valor)
                                    .toLocaleString(
                                        "pt-BR",
                                        {
                                            style: "currency",
                                            currency: "BRL"
                                        }
                                    ),
                                "Valor"
                            ]}
                            contentStyle={{
                                border:
                                    "1px solid #e6ebf0",
                                borderRadius: 12,
                                boxShadow:
                                    "0 12px 30px rgba(15,23,42,.08)",
                                fontSize: 11
                            }}
                        />

                        <ReferenceLine
                            y={0}
                            stroke="#dbe3ea"
                        />

                        <Bar
                            dataKey="valor"
                            radius={[8, 8, 3, 3]}
                            maxBarSize={52}
                        >
                            {dados.map((item) => (
                                <Cell
                                    key={item.nome}
                                    fill={item.cor}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="rumo-fluxo-resumo">
                {dados.map((item) => (
                    <div key={item.nome}>
                        <span>
                            {item.nome}
                        </span>

                        <strong>
                            {formatarMoeda(
                                item.valor
                            )}
                        </strong>
                    </div>
                ))}
            </div>
        </Card>
    );
}
