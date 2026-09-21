import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

function GraficoCategorias({
    dados
}) {
    return (
        <div
            style={{
                width: "100%",
                height: 270
            }}
        >
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <BarChart
                    data={dados}
                    layout="vertical"
                    margin={{
                        top: 4,
                        right: 12,
                        left: 4,
                        bottom: 0
                    }}
                >
                    <CartesianGrid
                        stroke="#edf1f5"
                        horizontal={false}
                    />

                    <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: "#94a3b8",
                            fontSize: 9
                        }}
                        tickFormatter={(valor) =>
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

                    <YAxis
                        type="category"
                        dataKey="categoria"
                        width={92}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: "#64748b",
                            fontSize: 9
                        }}
                    />

                    <Tooltip
                        cursor={{
                            fill:
                                "rgba(15,159,179,.035)"
                        }}
                        formatter={(value) =>
                            new Intl.NumberFormat(
                                "pt-BR",
                                {
                                    style: "currency",
                                    currency: "BRL"
                                }
                            ).format(value)
                        }
                        contentStyle={{
                            border:
                                "1px solid #e6ebf0",
                            borderRadius: 12,
                            boxShadow:
                                "0 12px 30px rgba(15,23,42,.08)",
                            fontSize: 10
                        }}
                    />

                    <Bar
                        dataKey="total"
                        radius={[
                            0,
                            7,
                            7,
                            0
                        ]}
                        fill="#0f9fb3"
                        maxBarSize={28}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default GraficoCategorias;
