import {
    useEffect,
    useState
} from "react";
import { Link } from "react-router-dom";

import { useDashboard } from "../context/DashboardContext";
import { supabase } from "../services/supabase";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import CardResumo from "../components/ui/CardResumo";
import CardMovimentacoes from "../components/ui/CardMovimentacoes";
import ItemMovimentacao from "../components/ui/ItemMovimentacao";
import CardFluxoMes from "../components/ui/CardFluxoMes";
import MesFiltro from "../components/ui/MesFiltro";

import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Bell,
    Compass,
    Wallet
} from "lucide-react";

import "./Dashboard.css";

function formatarMoeda(valor) {
    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
}

function obterSaudacao() {
    const hora =
        new Date().getHours();

    if (hora < 12) {
        return "Bom dia";
    }

    if (hora < 18) {
        return "Boa tarde";
    }

    return "Boa noite";
}

function Dashboard() {
    const {
        dashboard,
        setDashboard,
        periodos,
        setPeriodos,
        periodoSelecionado,
        setPeriodoSelecionado
    } = useDashboard();

    const [usuario, setUsuario] =
        useState(null);

    const [
        movimentacoes,
        setMovimentacoes
    ] = useState([]);

    const saudacao =
        obterSaudacao();

    const nomeUsuario =
        usuario?.user_metadata?.nome ||
        usuario?.user_metadata?.full_name ||
        usuario?.email?.split("@")?.[0] ||
        "você";

    const resultadoMes =
        Number(
            dashboard?.receitas_mes ||
            0
        ) -
        Number(
            dashboard?.despesas_mes ||
            0
        );

    async function carregarDashboard(
        userId,
        periodo
    ) {
        const {
            data,
            error
        } =
            await supabase
                .schema("rumo")
                .rpc(
                    "obter_dashboard",
                    {
                        p_usuario_id:
                            userId,
                        p_ano:
                            periodo.ano,
                        p_mes:
                            periodo.mes
                    }
                );

        if (
            !error &&
            data?.length
        ) {
            setDashboard(
                data[0]
            );
        }
    }

    async function carregarMovimentacoes(
        userId,
        periodo
    ) {
        const {
            data,
            error
        } =
            await supabase
                .schema("rumo")
                .rpc(
                    "obter_movimentacoes_dashboard",
                    {
                        p_usuario_id:
                            userId,
                        p_ano:
                            periodo.ano,
                        p_mes:
                            periodo.mes
                    }
                );

        if (!error) {
            setMovimentacoes(
                data || []
            );
        }
    }

    async function carregarPeriodos(
        userId
    ) {
        const {
            data,
            error
        } =
            await supabase
                .schema("rumo")
                .rpc(
                    "listar_periodos_dashboard",
                    {
                        p_usuario_id:
                            userId
                    }
                );

        if (
            !error &&
            data
        ) {
            setPeriodos(data);

            if (data.length > 0) {
                setPeriodoSelecionado(
                    data[0]
                );
            }
        }
    }

    useEffect(() => {
        async function carregarUsuario() {
            const {
                data: { user }
            } =
                await supabase
                    .auth
                    .getUser();

            setUsuario(user);

            if (user) {
                carregarPeriodos(
                    user.id
                );
            }
        }

        carregarUsuario();
    }, []);

    useEffect(() => {
        if (
            !usuario ||
            !periodoSelecionado
        ) {
            return;
        }

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

    return (
        <MainLayout>
            <PageContainer>
                <PageHeader
                    titulo={
                        `${saudacao}, ${nomeUsuario}`
                    }
                    subtitulo="Sua visão financeira do período, sem ruído."
                >
                    <div className="dashboard-header-actions">
                        <MesFiltro
                            periodos={
                                periodos
                            }
                            periodoSelecionado={
                                periodoSelecionado
                            }
                            onSelecionar={
                                setPeriodoSelecionado
                            }
                        />

                        <Link
                            to="/alertas"
                            className="dashboard-notificacao"
                            aria-label="Abrir alertas"
                        >
                            <Bell
                                size={17}
                            />
                        </Link>
                    </div>
                </PageHeader>

                <section className="dashboard-cards">
                    <CardResumo
                        titulo="Saldo disponível"
                        subtitulo="Saldo atual das contas"
                        valor={
                            formatarMoeda(
                                dashboard
                                    ?.saldo_total
                            )
                        }
                        badge="Agora"
                        cor="blue"
                        icone={
                            <Wallet />
                        }
                    />

                    <CardResumo
                        titulo="Receitas"
                        subtitulo="Entradas do período"
                        valor={
                            formatarMoeda(
                                dashboard
                                    ?.receitas_mes
                            )
                        }
                        cor="green"
                        icone={
                            <ArrowUpRight />
                        }
                    />

                    <CardResumo
                        titulo="Despesas"
                        subtitulo="Saídas do período"
                        valor={
                            formatarMoeda(
                                dashboard
                                    ?.despesas_mes
                            )
                        }
                        cor="red"
                        icone={
                            <ArrowDownRight />
                        }
                    />

                    <CardResumo
                        titulo="Índice de Rumo"
                        subtitulo="Leitura da saúde financeira"
                        valor={
                            dashboard
                                ?.indice_rumo ??
                            0
                        }
                        cor="purple"
                        icone={
                            <Compass />
                        }
                    />
                </section>

                <section
                    className={
                        resultadoMes >= 0
                            ? "dashboard-guidance positive"
                            : "dashboard-guidance attention"
                    }
                >
                    <div className="dashboard-guidance-icon">
                        <Compass
                            size={19}
                        />
                    </div>

                    <div className="dashboard-guidance-copy">
                        <span>
                            Leitura rápida
                        </span>

                        <strong>
                            {resultadoMes >= 0
                                ? "Seu fluxo está positivo neste período."
                                : "Suas saídas estão acima das entradas neste período."
                            }
                        </strong>

                        <p>
                            {resultadoMes >= 0
                                ? `Você preservou ${formatarMoeda(resultadoMes)} entre receitas e despesas.`
                                : `O fluxo está negativo em ${formatarMoeda(Math.abs(resultadoMes))}. Vale revisar os maiores gastos.`
                            }
                        </p>
                    </div>

                    <Link
                        to="/inteligencia"
                        className="dashboard-guidance-link"
                    >
                        Entender melhor
                        <ArrowRight
                            size={15}
                        />
                    </Link>
                </section>

                <section className="dashboard-details-grid">
                    <CardMovimentacoes>
                        {movimentacoes
                            .slice(0, 6)
                            .map(
                                (
                                    mov,
                                    index
                                ) => (
                                    <ItemMovimentacao
                                        key={
                                            mov.id ||
                                            index
                                        }
                                        movimentacao={{
                                            tipo:
                                                mov.tipo,
                                            descricao:
                                                mov.descricao,
                                            categoria:
                                                mov.categoria,
                                            conta:
                                                mov.conta,
                                            data:
                                                new Date(
                                                    `${mov.data_movimentacao}T12:00:00`
                                                )
                                                    .toLocaleDateString(
                                                        "pt-BR"
                                                    ),
                                            valor:
                                                mov.valor
                                        }}
                                    />
                                )
                            )}
                    </CardMovimentacoes>

                    <CardFluxoMes
                        receitas={
                            Number(
                                dashboard
                                    ?.receitas_mes ||
                                0
                            )
                        }
                        despesas={
                            Number(
                                dashboard
                                    ?.despesas_mes ||
                                0
                            )
                        }
                    />
                </section>
            </PageContainer>
        </MainLayout>
    );
}

export default Dashboard;
