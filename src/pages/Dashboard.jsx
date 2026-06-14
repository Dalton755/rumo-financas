import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import MainLayout from '../layouts/MainLayout'
import CardResumo from '../components/CardResumo'
import GraficoResumo from '../components/GraficoResumo'
import {
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Compass
} from 'lucide-react'


function formatarMoeda(valor) {

    return Number(
        valor || 0
    ).toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    )

}

function Dashboard() {

    console.log('DASHBOARD CARREGOU')

    const [usuario, setUsuario] = useState(null)
    const [dashboard, setDashboard] = useState(null)
    const [movimentacoes, setMovimentacoes] = useState([])
    console.log('ESTADO DASHBOARD:', dashboard)

    useEffect(() => {

        async function carregarUsuario() {

            const {
                data: { user }
            } = await supabase.auth.getUser()

            setUsuario(user)

            setUsuario(user)

            console.log('USER:', user)

            if (user) {

                console.log('USER ID:', user.id)

                carregarDashboard(user.id)
                carregarMovimentacoes(user.id)

            }

        }

        carregarUsuario()

        async function carregarDashboard(userId) {

            const { data, error } = await supabase
                .from('vw_dashboard')
                .select('*')
                .eq('usuario_id', userId)
                .single()

            console.log('DATA:', data)
            console.log('ERROR:', error)


            if (!error) {
                setDashboard(data)
            }

        }

        async function carregarMovimentacoes(userId) {
            console.log('CARREGANDO MOVIMENTACOES')

            const { data, error } = await supabase
                .from('movimentacoes')
                .select(`
            descricao,
            valor,
            tipo,
            data_movimentacao
        `)
                .eq('usuario_id', userId)
                .order('data_movimentacao', {
                    ascending: false
                })
                .limit(5)

            console.log('MOV DATA:', data)
            console.log('MOV ERROR:', error)

            if (!error) {
                setMovimentacoes(data)
            }

        }

    }, [])

    async function sair() {

        await supabase.auth.signOut()

        window.location.href = '/'

    }

    return (
        <MainLayout>


            <hr />

            <div className="mb-4">

                <h2 className="fw-bold">
                    Olá, Dalton 👋
                </h2>

                <p className="text-muted">
                    Veja para onde seu dinheiro
                    está levando você.
                </p>

            </div>

            <br />

            <hr />

            <div className="row">

                <CardResumo
                    titulo="Saldo Atual"
                    valor={formatarMoeda(dashboard?.saldo_total)}
                    icone={<Wallet size={32} className="text-success" />}
                />

                <CardResumo
                    titulo="Receitas do Mês"
                    valor={formatarMoeda(dashboard?.receitas_mes)}
                    icone={<ArrowUpRight size={32} className="text-primary" />}
                />

                <CardResumo
                    titulo="Despesas do Mês"
                    valor={formatarMoeda(dashboard?.despesas_mes)}
                    icone={<ArrowDownRight size={32} className="text-danger" />}
                />

                <CardResumo
                    titulo="Índice de Rumo"
                    valor={dashboard?.indice_rumo ?? 0}
                    icone={
                        <Compass
                            size={32}
                            style={{ color: '#6f42c1' }}
                        />
                    }
                />

            </div>

            <div className="mt-3">

                <h4 className="fw-bold text-center mb-3">
                    Últimas Movimentações
                </h4>

                <div className="card shadow-sm border-0">

                    <div className="card-body">

                        {
                            movimentacoes.map(
                                (mov, index) => (

                                    <div
                                        key={index}
                                        className="
                d-flex
                justify-content-between
                align-items-center
                border-bottom
                py-3
              "
                                    >
                                        <div>

                                            <div className="d-flex align-items-center gap-2">

                                                {
                                                    mov.tipo === 'receita'
                                                        ? (
                                                            <ArrowUpRight
                                                                size={18}
                                                                className="text-success"
                                                            />
                                                        )
                                                        : (
                                                            <ArrowDownRight
                                                                size={18}
                                                                className="text-danger"
                                                            />
                                                        )
                                                }

                                                <strong>
                                                    {mov.descricao}
                                                </strong>

                                            </div>

                                            <small className="text-muted d-block">

                                                {
                                                    new Date(
                                                        mov.data_movimentacao
                                                    ).toLocaleDateString(
                                                        'pt-BR'
                                                    )
                                                }

                                            </small>

                                            <small className="text-muted">

                                                {
                                                    mov.tipo === 'receita'
                                                        ? 'Receita'
                                                        : 'Despesa'
                                                }

                                            </small>

                                        </div>

                                        <div
                                            className={
                                                mov.tipo === 'receita'
                                                    ? 'text-success fw-bold'
                                                    : 'text-danger fw-bold'
                                            }
                                        >

                                            {
                                                formatarMoeda(
                                                    mov.valor
                                                )
                                            }

                                        </div>

                                    </div>

                                )
                            )
                        }

                    </div>

                </div>

            </div>

            <GraficoResumo
                receitas={
                    dashboard?.receitas_mes || 0
                }
                despesas={
                    dashboard?.despesas_mes || 0
                }
            />

            <hr />



        </MainLayout>
    )


}

export default Dashboard