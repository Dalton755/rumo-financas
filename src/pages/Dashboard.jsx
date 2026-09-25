import {
    useEffect,
    useMemo,
    useState
} from "react";

import { Link } from "react-router-dom";

import { useDashboard } from "../context/DashboardContext";
import { supabase } from "../services/supabase";
import { listarProximosCompromissos } from "../services/compromissos";
import { listarParcelasPlanejadasDividas } from "../services/dividas";
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
    BrainCircuit,
    Calculator,
    CalendarDays,
    ChevronRight,
    CircleAlert,
    Compass,
    Sparkles,
    Target,
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
        proximasDividas,
        setProximasDividas
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

    const totalDividasProximas =
        useMemo(
            () =>
                proximasDividas
                    .reduce(
                        (total, item) =>
                            total +
                            Number(
                                item.valor_restante ||
                                0
                            ),
                        0
                    ),
            [proximasDividas]
        );

    const totalObrigacoes =
        totalProximos +
        totalDividasProximas;

    const obrigacoesProximas =
        useMemo(
            () => [
                ...proximosCompromissos.map(
                    (item) => ({
                        id:
                            `compromisso:${item.id}`,
                        tipo:
                            "Compromisso",
                        nome:
                            item.compromisso
                                ?.nome ||
                            "Compromisso",
                        vencimento:
                            item.vencimento,
                        valor:
                            Number(
                                item.valor_real ??
                                item.valor_previsto ??
                                0
                            ),
                        rota:
                            "/compromissos"
                    })
                ),
                ...proximasDividas.map(
                    (item) => ({
                        id:
                            `divida:${item.id}`,
                        tipo:
                            "Dívida",
                        nome:
                            item.divida
                                ?.nome ||
                            "Parcela de dívida",
                        vencimento:
                            item.semana_referencia,
                        valor:
                            Number(
                                item.valor_restante ||
                                0
                            ),
                        rota:
                            "/dividas"
                    })
                )
            ]
                .sort(
                    (a, b) =>
                        String(
                            a.vencimento
                        ).localeCompare(
                            String(
                                b.vencimento
                            )
                        )
                )
                .slice(
                    0,
                    5
                ),
            [
                proximosCompromissos,
                proximasDividas
            ]
        );

    const saldoDisponivel =
        Number(
            dashboard?.saldo_total ||
            0
        );

    const saldoAposProximos =
        saldoDisponivel -
        totalObrigacoes;

    const primeiraObrigacao =
        obrigacoesProximas?.[0] ||
        null;

    const dataPrimeiraObrigacao =
        primeiraObrigacao?.vencimento
            ? new Date(
                `${primeiraObrigacao.vencimento}T12:00:00`
            ).toLocaleDateString(
                "pt-BR",
                {
                    day: "2-digit",
                    month: "2-digit"
                }
            )
            : null;

    const parcelaDividaPrioritaria =
        proximasDividas?.[0] ||
        null;

    const diasParcelaDivida =
        parcelaDividaPrioritaria
            ?.semana_referencia
            ? (() => {
                const hoje =
                    new Date();

                hoje.setHours(
                    12,
                    0,
                    0,
                    0
                );

                const vencimento =
                    new Date(
                        `${parcelaDividaPrioritaria.semana_referencia}T12:00:00`
                    );

                return Math.round(
                    (
                        vencimento -
                        hoje
                    ) /
                    86400000
                );
            })()
            : null;

    const rumoHoje =
        useMemo(
            () => {
                if (
                    diasParcelaDivida !== null &&
                    diasParcelaDivida <= 0
                ) {
                    const valor =
                        Number(
                            parcelaDividaPrioritaria
                                ?.valor_restante ||
                            0
                        );

                    return {
                        status:
                            "critico",
                        etiqueta:
                            diasParcelaDivida < 0
                                ? "Dívida atrasada"
                                : "Vence hoje",
                        titulo:
                            diasParcelaDivida < 0
                                ? `Resolva ${formatarMoeda(
                                    valor
                                )} da dívida ${parcelaDividaPrioritaria?.divida?.nome || ""}`
                                : `Separe ${formatarMoeda(
                                    valor
                                )} para a dívida de hoje`,
                        descricao:
                            diasParcelaDivida < 0
                                ? "Essa parcela planejada já passou da data e agora entra como prioridade máxima do seu Rumo."
                                : "Essa parcela vence hoje e já está considerada no valor que precisa ficar protegido.",
                        acao:
                            "Resolver dívida",
                        rota:
                            "/dividas"
                    };
                }

                if (
                    totalObrigacoes >
                    saldoDisponivel
                ) {
                    const falta =
                        totalObrigacoes -
                        saldoDisponivel;

                    return {
                        status: "critico",
                        etiqueta:
                            "Ação necessária",
                        titulo:
                            `Garanta ${formatarMoeda(
                                falta
                            )} para cobrir sua semana`,
                        descricao:
                            dataPrimeiraObrigacao
                                ? `Suas próximas obrigações somam ${formatarMoeda(
                                    totalObrigacoes
                                )}. O primeiro vence em ${dataPrimeiraObrigacao}.`
                                : `Suas próximas obrigações somam ${formatarMoeda(
                                    totalObrigacoes
                                )} e superam o saldo disponível.`,
                        acao:
                            "Ver obrigação",
                        rota:
                            primeiraObrigacao
                                ?.rota ||
                            "/compromissos"
                    };
                }

                if (
                    totalObrigacoes > 0
                ) {
                    return {
                        status: "atencao",
                        etiqueta:
                            "Prioridade da semana",
                        titulo:
                            `Proteja ${formatarMoeda(
                                totalObrigacoes
                            )} para os próximos vencimentos`,
                        descricao:
                            dataPrimeiraObrigacao
                                ? `A primeira obrigação vence em ${dataPrimeiraObrigacao}. Depois de reservar tudo, ficam ${formatarMoeda(
                                    Math.max(
                                        0,
                                        saldoAposProximos
                                    )
                                )} disponíveis.`
                                : `Depois de reservar os próximos vencimentos, ficam ${formatarMoeda(
                                    Math.max(
                                        0,
                                        saldoAposProximos
                                    )
                                )} disponíveis.`,
                        acao:
                            "Organizar semana",
                        rota:
                            "/compromissos"
                    };
                }

                if (
                    resultadoMes < 0
                ) {
                    return {
                        status: "atencao",
                        etiqueta:
                            "Ajuste recomendado",
                        titulo:
                            "Revise seus gastos antes da próxima saída",
                        descricao:
                            `As despesas estão ${formatarMoeda(
                                Math.abs(
                                    resultadoMes
                                )
                            )} acima das receitas neste mês.`,
                        acao:
                            "Analisar gastos",
                        rota:
                            "/inteligencia"
                    };
                }

                return {
                    status: "positivo",
                    etiqueta:
                        "Seu rumo hoje",
                    titulo:
                        "Nada urgente. Use a folga para avançar.",
                    descricao:
                        resultadoMes > 0
                            ? `Seu mês está positivo em ${formatarMoeda(
                                resultadoMes
                            )} e não há compromissos pendentes nos próximos 7 dias.`
                            : "Não há vencimentos pendentes nos próximos 7 dias. Você pode planejar o próximo objetivo.",
                    acao:
                        "Planejar próximo passo",
                    rota:
                        "/metas"
                };
            },
            [
                totalObrigacoes,
                saldoDisponivel,
                saldoAposProximos,
                resultadoMes,
                dataPrimeiraObrigacao,
                diasParcelaDivida,
                parcelaDividaPrioritaria
            ]
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

    async function carregarProximos() {
        try {
            const [
                compromissos,
                dividasPlanejadas
            ] =
                await Promise.all([
                    listarProximosCompromissos({
                        dias: 7,
                        limite: 20
                    }),
                    listarParcelasPlanejadasDividas({
                        dias: 7,
                        incluirVencidas: true
                    })
                ]);

            setProximosCompromissos(
                compromissos || []
            );

            setProximasDividas(
                dividasPlanejadas || []
            );
        } catch (error) {
            console.error(
                "[RUMO DASHBOARD] Erro ao carregar compromissos:",
                error
            );

            setProximosCompromissos([]);
            setProximasDividas([]);
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
                    subtitulo="Abra, entenda a prioridade e saiba qual é o próximo passo."
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

                <section
                    className={
                        `dashboard-rumo-hoje ${rumoHoje.status}`
                    }
                >
                    <div className="dashboard-rumo-status">
                        <span className="dashboard-rumo-icon">
                            {
                                rumoHoje.status === "critico"
                                    ? <CircleAlert size={20} />
                                    : rumoHoje.status === "atencao"
                                        ? <Target size={20} />
                                        : <Compass size={20} />
                            }
                        </span>

                        <div className="dashboard-rumo-copy">
                            <span className="dashboard-rumo-label">
                                {rumoHoje.etiqueta}
                            </span>

                            <h2>
                                {rumoHoje.titulo}
                            </h2>

                            <p>
                                {rumoHoje.descricao}
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-rumo-actions">
                        <Link
                            to={rumoHoje.rota}
                            className="dashboard-rumo-primary"
                        >
                            {rumoHoje.acao}
                            <ArrowRight size={15} />
                        </Link>

                        <Link
                            to="/inteligencia"
                            className="dashboard-rumo-ai"
                        >
                            <Sparkles size={15} />
                            Perguntar ao Rumo IA
                        </Link>
                    </div>
                </section>

                <section className="dashboard-rumo-snapshot">
                    <div>
                        <span>Disponível agora</span>
                        <strong>
                            {formatarMoeda(
                                saldoDisponivel
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Próximos 7 dias</span>
                        <strong>
                            {formatarMoeda(
                                totalObrigacoes
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Depois da semana</span>
                        <strong
                            className={
                                saldoAposProximos >= 0
                                    ? "positivo"
                                    : "negativo"
                            }
                        >
                            {formatarMoeda(
                                saldoAposProximos
                            )}
                        </strong>
                    </div>
                </section>

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
                                    Obrigações
                                </h2>
                            </div>

                            <strong>
                                {formatarMoeda(
                                    totalObrigacoes
                                )}
                            </strong>
                        </div>

                        <div className="dashboard-upcoming-list">
                            {
                                obrigacoesProximas.length >
                                0 ? (
                                    obrigacoesProximas.map(
                                        (item) => (
                                            <Link
                                                to={item.rota}
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
                                                            item.nome
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
                                                            item.valor
                                                        )
                                                    }
                                                </b>
                                                <span className="dashboard-upcoming-type">
                                                    {item.tipo}
                                                </span>
                                            </Link>
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
                                                Nenhuma obrigação pendente nos próximos 7 dias.
                                            </span>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </article>

                    <article className="dashboard-guidance ai-entry">
                        <div className="dashboard-guidance-icon">
                            <BrainCircuit
                                size={19}
                            />
                        </div>

                        <div className="dashboard-guidance-copy">
                            <span>
                                Rumo IA
                            </span>

                            <strong>
                                Quer entender melhor antes de decidir?
                            </strong>

                            <p>
                                Pergunte quanto pode gastar, como estão seus próximos 30 dias ou simule uma compra antes de fazê-la.
                            </p>
                        </div>

                        <Link
                            to="/inteligencia"
                            className="dashboard-guidance-link"
                        >
                            Abrir Rumo IA
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
