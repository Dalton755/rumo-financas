import { useEffect, useState } from 'react'
import { useDashboard } from "../context/DashboardContext";
import { supabase } from '../services/supabase'
import MainLayout from '../layouts/MainLayout'
import CardResumo from '../components/ui/CardResumo'
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
    Bell,
    CircleHelp,
    X
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

function obterClassificacaoIndice(valor) {

    if (valor <= 20) {
        return {
            titulo: "Atenção",
            texto:
                "Suas despesas estão consumindo praticamente toda a sua receita."
        };
    }

    if (valor <= 40) {
        return {
            titulo: "Baixo",
            texto:
                "Uma pequena parte da sua receita está permanecendo disponível."
        };
    }

    if (valor <= 60) {
        return {
            titulo: "Equilibrado",
            texto:
                "Você está conseguindo preservar uma parte relevante da sua receita."
        };
    }

    if (valor <= 80) {
        return {
            titulo: "Saudável",
            texto:
                "Uma boa parte da sua receita permaneceu disponível após as despesas."
        };
    }

    return {
        titulo: "Excelente",
        texto:
            "Você está preservando uma parcela muito alta da sua receita."
    };

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
    const indiceRumo =
        Number(
            dashboard?.indice_rumo || 0
        );

    const classificacaoIndice =
        obterClassificacaoIndice(
            indiceRumo
        );
    const [
        explicacaoIndiceAberta,
        setExplicacaoIndiceAberta
    ] = useState(false);


    async function carregarDashboard(

        userId,

        periodo

    ) {

        const { data, error } = await supabase

            .schema("rumo")
            .rpc(
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
        const { data, error } = await supabase

            .schema("rumo")
            .rpc(
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

        const { data, error } = await supabase

            .schema("rumo")
            .rpc(
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

            <div className="dashboard-page">



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

                    <div className="dashboard-card dashboard-card-saldo">

                        <CardResumo
                            titulo="Saldo Atual"
                            subtitulo="Saldo disponível"
                            valor={formatarMoeda(
                                dashboard?.saldo_total
                            )}
                            badge="Atualizado agora"
                            cor="blue"
                            icone={
                                <Wallet size={30} />
                            }
                        />

                    </div>


                    <div className="dashboard-card dashboard-card-receitas">

                        <CardResumo
                            titulo="Receitas"
                            subtitulo="Entradas do mês"
                            valor={formatarMoeda(
                                dashboard?.receitas_mes
                            )}
                            cor="green"
                            icone={
                                <ArrowUpRight size={30} />
                            }
                        />

                    </div>


                    <div className="dashboard-card dashboard-card-despesas">

                        <CardResumo
                            titulo="Despesas"
                            subtitulo="Saídas do mês"
                            valor={formatarMoeda(
                                dashboard?.despesas_mes
                            )}
                            cor="red"
                            icone={
                                <ArrowDownRight size={30} />
                            }
                        />

                    </div>


                    <div className="dashboard-card dashboard-card-indice">

                        <CardResumo
                            titulo="Índice de Rumo"
                            subtitulo="Sua saúde financeira"
                            valor={dashboard?.indice_rumo ?? 0}
                            cor="purple"
                            icone={
                                <Compass size={30} />
                            }
                        />

                        <div className="dashboard-indice-mobile">

                            <div className="dashboard-indice-mobile-topo">

                                <div>
                                    <span>
                                        Índice de Rumo
                                    </span>

                                    <small>
                                        Sua saúde financeira
                                    </small>
                                </div>

                                <strong>
                                    {dashboard?.indice_rumo ?? 0}
                                    <small>/100</small>
                                </strong>

                            </div>

                            <div className="dashboard-indice-barra">

                                <div
                                    style={{
                                        width:
                                            `${Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    Number(
                                                        dashboard?.indice_rumo ||
                                                        0
                                                    )
                                                )
                                            )}%`
                                    }}
                                />

                            </div>

                            <button
                                type="button"
                                className="dashboard-indice-entenda"
                                onClick={() =>
                                    setExplicacaoIndiceAberta(true)
                                }
                            >
                                <CircleHelp size={15} />

                                <span>
                                    Entenda seu Índice de Rumo
                                </span>
                            </button>

                        </div>

                    </div>

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

                {explicacaoIndiceAberta && (

                    <div className="dashboard-indice-overlay">

                        <div className="dashboard-indice-modal">

                            <div className="dashboard-indice-modal-header">

                                <div>
                                    <span>
                                        Exclusivo Rumo
                                    </span>

                                    <h2>
                                        Índice de Rumo
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setExplicacaoIndiceAberta(false)
                                    }
                                    aria-label="Fechar"
                                >
                                    <X size={22} />
                                </button>

                            </div>


                            <div className="dashboard-indice-modal-body">

                                <div className="dashboard-indice-atual">

                                    <div>
                                        <span>
                                            Seu índice neste período
                                        </span>

                                        <strong>
                                            {indiceRumo}
                                            <small>/100</small>
                                        </strong>
                                    </div>

                                    <span className="dashboard-indice-status">
                                        {classificacaoIndice.titulo}
                                    </span>

                                </div>


                                <p className="dashboard-indice-status-texto">
                                    {classificacaoIndice.texto}
                                </p>


                                <section>

                                    <h3>
                                        O que é?
                                    </h3>

                                    <p>
                                        O Índice de Rumo mostra quanto
                                        da sua receita permaneceu disponível
                                        depois das despesas do período.
                                    </p>

                                    <p>
                                        Quanto maior o índice, maior foi a
                                        parcela da sua renda preservada.
                                    </p>

                                </section>


                                <section>

                                    <h3>
                                        Como é calculado?
                                    </h3>

                                    <div className="dashboard-indice-formula">

                                        <span>
                                            Receitas − Despesas
                                        </span>

                                        <div />

                                        <span>
                                            Receitas
                                        </span>

                                        <strong>
                                            × 100
                                        </strong>

                                    </div>

                                </section>


                                <section>

                                    <h3>
                                        Como interpretar?
                                    </h3>

                                    <div className="dashboard-indice-faixas">

                                        <div>
                                            <strong>0–20</strong>
                                            <span>Atenção</span>
                                        </div>

                                        <div>
                                            <strong>21–40</strong>
                                            <span>Baixo</span>
                                        </div>

                                        <div>
                                            <strong>41–60</strong>
                                            <span>Equilibrado</span>
                                        </div>

                                        <div>
                                            <strong>61–80</strong>
                                            <span>Saudável</span>
                                        </div>

                                        <div>
                                            <strong>81–100</strong>
                                            <span>Excelente</span>
                                        </div>

                                    </div>

                                </section>


                                <section>

                                    <h3>
                                        Como usar?
                                    </h3>

                                    <p>
                                        Compare seu Índice de Rumo ao longo
                                        dos meses. Se ele estiver crescendo,
                                        uma parcela maior da sua renda está
                                        permanecendo disponível depois dos
                                        seus gastos.
                                    </p>

                                    <p>
                                        O objetivo não é apenas buscar uma
                                        nota alta, mas entender se o seu
                                        dinheiro está seguindo na direção
                                        que você planejou.
                                    </p>

                                </section>

                            </div>


                            <div className="dashboard-indice-modal-footer">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setExplicacaoIndiceAberta(false)
                                    }
                                >
                                    Entendi
                                </button>

                            </div>

                        </div>

                    </div>

                )}



            </div>


        </MainLayout>
    )


}

export default Dashboard