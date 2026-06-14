import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

function GraficoCategorias({
    dados
}) {

    return (

        <div className="card shadow-sm border-0">

            <div className="card-body">

                <h4 className="fw-bold mb-4">
                    Gastos por Categoria
                </h4>

                <ResponsiveContainer
                    width="100%"
                    height={220}
                >

                    <BarChart
                        data={dados}
                        layout="vertical"
                    >

                        <XAxis
                            type="number"
                        />

                        <YAxis
                            type="category"
                            dataKey="categoria"
                            width={100}
                        />

                        <Tooltip
                            formatter={(value) =>
                                new Intl.NumberFormat(
                                    'pt-BR',
                                    {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }
                                ).format(value)
                            }
                        />

                        <Bar
                            dataKey="total"
                            radius={[0, 8, 8, 0]}
                            fill="#0d6efd"
                        />

                    </BarChart>

                </ResponsiveContainer>

            </div>

        </div>

    )

}

export default GraficoCategorias