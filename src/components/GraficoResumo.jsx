import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

function GraficoResumo({
    receitas,
    despesas
}) {

    const dados = [
        {
            categoria: 'Receitas',
            valor: receitas
        },
        {
            categoria: 'Despesas',
            valor: despesas
        }
    ]

    return (

        <div
            className="
        card
        shadow-sm
        border-0
        mt-4
      "
        >

            <div className="card-body">

                <h4 className="fw-bold mb-4">
                    Resumo Financeiro
                </h4>

                <ResponsiveContainer
                    width="100%"
                    height={300}
                >

                    <BarChart data={dados}>

                        <XAxis
                            dataKey="categoria"
                        />

                        <YAxis />

                        <Tooltip />

                        <Bar
                            dataKey="valor"
                            radius={[8, 8, 0, 0]}
                            
                        >
                            <Cell fill="#198754" />

                            <Cell fill="#dc3545" />
                        </Bar>

                    </BarChart>

                </ResponsiveContainer>

            </div>

        </div>

    )

}

export default GraficoResumo