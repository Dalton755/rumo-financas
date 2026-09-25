import {
    useEffect,
    useMemo,
    useState
} from "react";

import { Link } from "react-router-dom";

import { useDashboard } from "../context/DashboardContext";
import { supabase } from "../services/supabase";
import { listarProximosCompromissos } from "../services/compromissos";
import { buscarCotacaoDolar } from "../services/cambio";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import CardMovimentacoes from "../components/ui/CardMovimentacoes";
import ItemMovimentacao from "../components/ui/ItemMovimentacao";
import CardFluxoMes from "../components/ui/CardFluxoMes";
import MesFiltro from "../components/ui/MesFiltro";

import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Banknote,
    Bell,
    Calculator,
    CalendarDays,
    ChevronRight,
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

function formatarCotacao(valor) {
    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 4,
                maximumFractionDigits: 4
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

    const [
        proximosCompromissos,
        setProximosCompromissos
    ] = useState([]);

    const [
        cotacaoDolar,
        setCotacaoDolar
    ] = useState(null);

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

    const totalProximos =
        useMemo(
            () =>
                proximosCompromissos
                    .reduce(
                        (total, item) =>
                            total +
                            Number(
                                item.valor_real ??
                                item.valor_previsto ??
                                0
                            ),
                        0
                    ),
            [proximosCompromissos]
        );

    const saldoDisponivel =
        Number(
            dashboard?.saldo_total ||
            0
        );

    const saldoAposProximos =
        saldoDisponivel -
        totalProximos;

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

    async function carregarProximos() {
        try {
            const data =
                await listarProximosCompromissos({
                    dias: 7,
                    limite: 5
                });

            setProximosCompromissos(
                data || []
            );
        } catch (error) {
            console.error(
                "[RUMO DASHBOARD] Erro ao carregar compromissos:",
                error
            );

            setProximosCompromissos([]);
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

                carregarProximos();
            }
        }

        carregarUsuario();
    }, []);

    useEffect(() => {
        let ativo = true;

        buscarCotacaoDolar()
            .then(
                (dados) => {
                    if (ativo) {
                        setCotacaoDolar(
                            dados
                        );
                    }
                }
            )
            .catch(
                (error) => {
                    console.warn(
                        "[RUMO DASHBOARD] Cotação indisponível:",
                        error
                    );
                }
            );

        return () => {
            ativo = false;
        };
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
                    subtitulo="Seu dinheiro, seus próximos compromissos e o que realmente sobra."
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

                <section className="dashboard-value-hero">
                    <div className="dashboard-balance">
                        <span className="dashboard-eyebrow">
                            Disponível agora
                        </span>

                        <div className="dashboard-balance-value">
                            <Wallet size={21} />

                            <strong>
                                {formatarMoeda(
                                    saldoDisponivel
                                )}
                            </strong>
                        </div>

                        <div
                            className={
                                saldoAposProximos >= 0
                                    ? "dashboard-after positive"
                                    : "dashboard-after negative"
                            }
                        >
                            <span>
                                Depois dos próximos 7 dias
                            </span>

                            <strong>
                                {formatarMoeda(
                                    saldoAposProximos
                                )}
                            </strong>
                        </div>

                        <div className="dashboard-hero-actions">
                            <Link
                                to="/movimentacoes"
                            >
                                Ver movimentações
                                <ArrowRight size={14} />
                            </Link>

                            <Link
                                to="/calculos"
                            >
                                <Calculator size={14} />
                                Fazer cálculo
                            </Link>
                        </div>
                    </div>

                    <div className="dashboard-month-metrics">
                        <div>
                            <span>
                                Receitas do mês
                            </span>

                            <strong className="positive">
                                {formatarMoeda(
                                    dashboard
                                        ?.receitas_mes
                                )}
                            </strong>

                            <ArrowUpRight
                                size={16}
                            />
                        </div>

                        <div>
                            <span>
                                Despesas do mês
                            </span>

                            <strong className="negative">
                                {formatarMoeda(
                                    dashboard
                                        ?.despesas_mes
                                )}
                            </strong>

                            <ArrowDownRight
                                size={16}
                            />
                        </div>

                        <div>
                            <span>
                                Resultado
                            </span>

                            <strong
                                className={
                                    resultadoMes >= 0
                                        ? "positive"
                                        : "negative"
                                }
                            >
                                {formatarMoeda(
                                    resultadoMes
                                )}
                            </strong>

                            <Compass
                                size={16}
                            />
                        </div>

                        <div>
                            <span>
                                Índice de Rumo
                            </span>

                            <strong>
                                {
                                    dashboard
                                        ?.indice_rumo ??
                                    0
                                }
                            </strong>

                            <small>
                                saúde financeira
                            </small>
                        </div>
                    </div>
                </section>

                <Link
                    to="/calculos?calc=cambio"
                    className="dashboard-exchange-card"
                >
                    <span className="dashboard-exchange-icon">
                        <Banknote size={18} />
                    </span>

                    <span className="dashboard-exchange-copy">
                        <small>
                            Dólar hoje
                        </small>

                        <strong>
                            {cotacaoDolar
                                ? `US$ 1 = R$ ${formatarCotacao(cotacaoDolar.venda)}`
                                : "Atualizando cotação..."
                            }
                        </strong>
                    </span>

                    <span className="dashboard-exchange-source">
                        {cotacaoDolar
                            ? cotacaoDolar.fallback
                                ? "Fonte alternativa"
                                : "BCB · PTAX"
                            : "USD/BRL"
                        }
                    </span>

                    <span className="dashboard-exchange-action">
                        Converter
                        <ChevronRight
                            size={14}
                        />
                    </span>
                </Link>

                <section className="dashboard-priority-grid">
                    <article className="dashboard-upcoming">
                        <div className="dashboard-section-head">
                            <div>
                                <span>
                                    Próximos 7 dias
                                </span>

                                <h2>
                                    Compromissos
                                </h2>
                            </div>

                            <strong>
                                {formatarMoeda(
                                    totalProximos
                                )}
                            </strong>
                        </div>

                        <div className="dashboard-upcoming-list">
                            {
                                proximosCompromissos.length >
                                0 ? (
                                    proximosCompromissos.map(
                                        (item) => (
                                            <div
                                                key={item.id}
                                                className="dashboard-upcoming-item"
                                            >
                                                <span className="dashboard-date-box">
                                                    <CalendarDays
                                                        size={15}
                                                    />
                                                </span>

                                                <div>
                                                    <strong>
                                                        {
                                                            item.compromisso
                                                                ?.nome ||
                                                            "Compromisso"
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            new Date(
                                                                `${item.vencimento}T12:00:00`
                                                            )
                                                                .toLocaleDateString(
                                                                    "pt-BR",
                                                                    {
                                                                        day: "2-digit",
                                                                        month: "short"
                                                                    }
                                                                )
                                                        }
                                                    </span>
                                                </div>

                                                <b>
                                                    {
                                                        formatarMoeda(
                                                            item.valor_real ??
                                                            item.valor_previsto
                                                        )
                                                    }
                                                </b>
                                            </div>
                                        )
                                    )
                                ) : (
                                    <div className="dashboard-upcoming-empty">
                                        <CalendarDays
                                            size={20}
                                        />

                                        <div>
                                            <strong>
                                                Semana livre de vencimentos
                                            </strong>

                                            <span>
                                                Nenhum compromisso pendente nos próximos 7 dias.
                                            </span>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </article>

                    <article
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
                                Leitura do Rumo
                            </span>

                            <strong>
                                {resultadoMes >= 0
                                    ? "Seu fluxo está positivo neste período."
                                    : "Suas saídas estão acima das entradas."
                                }
                            </strong>

                            <p>
                                {resultadoMes >= 0
                                    ? `Você preservou ${formatarMoeda(resultadoMes)} entre receitas e despesas.`
                                    : `Seu fluxo está negativo em ${formatarMoeda(Math.abs(resultadoMes))}. Reveja os maiores gastos.`
                                }
                            </p>
                        </div>

                        <Link
                            to="/inteligencia"
                            className="dashboard-guidance-link"
                        >
                            Ver análise
                            <ChevronRight
                                size={15}
                            />
                        </Link>
                    </article>
                </section>

                <section className="dashboard-details-grid">
                    <CardMovimentacoes>
                        {movimentacoes
                            .slice(0, 5)
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
