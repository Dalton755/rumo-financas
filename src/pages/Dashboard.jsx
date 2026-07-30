import { useEffect, useState } from 'react'
import { useDashboard } from "../context/DashboardContext";
import { supabase } from '../services/supabase'
import MainLayout from '../layouts/MainLayout'
import CardResumo from '../components/ui/CardResumo'
import GraficoResumo from '../components/GraficoResumo'
import "./Dashboard.css";
import PageHeader from '../components/ui/PageHeader'
import CardMovimentacoes from "../components/ui/CardMovimentacoes";
import ItemMovimentacao from "../components/ui/ItemMovimentacao";
import CardFluxoMes from "../components/ui/CardFluxoMes";
import MesFiltro from "../components/ui/MesFiltro";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Compass,
    Bell
} from 'lucide-react'
import IndiceRumo from "../components/ui/IndiceRumo";


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

function obterSaudacao() {

    const hora = new Date().getHours();

    if (hora < 12) {

        return "🌅 Bom dia";

    }

    if (hora < 18) {

        return "☀️ Boa tarde";

    }

    return "🌙 Boa noite";

}

function Dashboard() {

    console.log('DASHBOARD CARREGOU')


    const {

        dashboard,
        setDashboard,

        periodos,
        setPeriodos,

        periodoSelecionado,
        setPeriodoSelecionado

    } = useDashboard();
    const [usuario, setUsuario] = useState(null)
    const [movimentacoes, setMovimentacoes] = useState([])
    const saudacao = obterSaudacao();


    async function carregarDashboard(

        userId,

        periodo

    ) {

        const { data, error } = await supabase.rpc(
            "obter_dashboard",
            {
                p_usuario_id: userId,
                p_ano: periodo.ano,
                p_mes: periodo.mes
            }
        );

        console.log("DASHBOARD:", data);
        console.log("ERRO:", error);

        if (!error && data.length > 0) {

            setDashboard(data[0]);

        }

    }

    async function carregarMovimentacoes(

        userId,

        periodo

    ) {
        const { data, error } = await supabase.rpc(
            "obter_movimentacoes_dashboard",
            {
                p_usuario_id: userId,
                p_ano: periodo.ano,
                p_mes: periodo.mes
            }
        );

        console.log("MOVIMENTACOES:", data);
        console.log("ERRO:", error);

        if (!error) {

            setMovimentacoes(data);

        }

    }

    async function carregarPeriodos(userId) {

        const { data, error } = await supabase.rpc(
            "listar_periodos_dashboard",
            {
                p_usuario_id: userId
            }
        );

        if (!error && data) {

            console.log("PERIODOS:", data)
            console.log("ERRO:", error)

            setPeriodos(data);

            if (data.length > 0) {

                setPeriodoSelecionado(data[0]);

            }

        }

    }



    useEffect(() => {

        async function carregarUsuario() {

            const {
                data: { user }
            } = await supabase.auth.getUser()

            setUsuario(user)

            if (user) {

                carregarPeriodos(user.id)

            }

        }

        carregarUsuario()

    }, [])

    useEffect(() => {

        if (!usuario) return;

        if (!periodoSelecionado) return;

        carregarDashboard(
            usuario.id,
            periodoSelecionado
        );

        carregarMovimentacoes(
            usuario.id,
            periodoSelecionado
        );

    }, [

        usuario,

        periodoSelecionado

    ]);

    async function sair() {

        await supabase.auth.signOut()

        window.location.href = '/'

    }

    return (
        <MainLayout>



            <PageHeader

                titulo={`${saudacao}, ${usuario?.user_metadata?.nome || "Dalton"}`}

                subtitulo="Veja para onde seu dinheiro está levando você."

            >

                <div className="dashboard-header-actions">

                    <MesFiltro

                        periodos={periodos}

                        periodoSelecionado={periodoSelecionado}

                        onSelecionar={setPeriodoSelecionado}

                    />

                    <button className="dashboard-notificacao">

                        <Bell size={20} />

                    </button>

                </div>

            </PageHeader>

            <div className="dashboard-cards">

                <CardResumo
                    titulo="Saldo Atual"
                    subtitulo="Saldo disponível"
                    valor={formatarMoeda(dashboard?.saldo_total)}
                    badge="Atualizado agora"
                    cor="blue"
                    icone={<Wallet size={30} />}
                />

                <CardResumo
                    titulo="Receitas"
                    subtitulo="Entradas do mês"
                    valor={formatarMoeda(dashboard?.receitas_mes)}
                    cor="green"
                    icone={<ArrowUpRight size={30} />}
                />

                <CardResumo
                    titulo="Despesas"
                    subtitulo="Saídas do mês"
                    valor={formatarMoeda(dashboard?.despesas_mes)}
                    cor="red"
                    icone={<ArrowDownRight size={30} />}
                />

                <CardResumo
                    titulo="Índice de Rumo"
                    subtitulo="Sua saúde financeira"
                    valor={dashboard?.indice_rumo ?? 0}
                    cor="purple"
                    icone={<Compass size={30} />}
                />

            </div>

            <CardMovimentacoes>

                {
                    movimentacoes.map((mov, index) => (

                        <ItemMovimentacao
                            key={index}
                            movimentacao={{
                                tipo: mov.tipo,
                                descricao: mov.descricao,
                                categoria: mov.categoria,
                                conta: mov.conta,
                                data: new Date(
                                    mov.data_movimentacao
                                ).toLocaleDateString("pt-BR"),
                                valor: mov.valor
                            }}
                        />

                    ))
                }

            </CardMovimentacoes>

            <CardFluxoMes

                receitas={dashboard?.receitas_mes || 0}

                despesas={dashboard?.despesas_mes || 0}

            />






        </MainLayout>
    )


}

export default Dashboard