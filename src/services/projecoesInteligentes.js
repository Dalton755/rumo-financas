import {
    obterProjecoesFinanceiras,
} from "./projecoes";
import {
    gerarOcorrenciasPadroesConfirmados,
} from "./motoresInteligentes";

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function assinaturaMovimento(item) {
    return [
        item.tipo,
        item.data,
        normalizarTexto(item.descricao),
    ].join(":");
}

function dentroDoHorizonte(
    item,
    hoje,
    dias
) {
    if (!item?.data) return false;

    const data =
        new Date(
            `${item.data}T12:00:00`
        );

    const limite = new Date(hoje);
    limite.setDate(
        limite.getDate() + dias
    );

    return (
        data > hoje &&
        data <= limite
    );
}

function somarPorTipo(
    ocorrencias,
    hoje,
    dias,
    tipo
) {
    return ocorrencias
        .filter(
            (item) =>
                item.tipo === tipo &&
                dentroDoHorizonte(
                    item,
                    hoje,
                    dias
                )
        )
        .reduce(
            (total, item) =>
                total +
                Number(item.valor || 0),
            0
        );
}

function recalcularEvolucao(
    saldoReal,
    hojeIso,
    movimentos
) {
    const porDia = new Map();

    movimentos.forEach((item) => {
        if (!item?.data) return;

        const impacto =
            Number(
                item.impacto ??
                (
                    item.tipo === "receita"
                        ? item.valor
                        : -Number(
                            item.valor || 0
                        )
                )
            );

        porDia.set(
            item.data,
            (
                porDia.get(item.data) ||
                0
            ) + impacto
        );
    });

    let saldo = Number(saldoReal || 0);

    const evolucao = [
        {
            data: hojeIso,
            saldo,
            tipo: "saldo_atual",
        },
    ];

    [...porDia.entries()]
        .sort(
            ([dataA], [dataB]) =>
                String(dataA)
                    .localeCompare(
                        String(dataB)
                    )
        )
        .forEach(
            ([data, resultado]) => {
                saldo +=
                    Number(resultado || 0);

                evolucao.push({
                    data,
                    resultado_dia:
                        Number(resultado || 0),
                    saldo,
                    tipo: "projecao",
                });
            }
        );

    return evolucao;
}

function enriquecerHorizonte(
    base,
    saldoReal,
    receitasPadroes,
    despesasPadroes
) {
    const receitas =
        Number(
            base?.receitas_previstas || 0
        ) +
        Number(receitasPadroes || 0);

    const despesas =
        Number(
            base?.despesas_previstas || 0
        ) +
        Number(despesasPadroes || 0);

    return {
        ...base,
        receitas_previstas: receitas,
        despesas_previstas: despesas,
        receitas_padroes_inteligentes:
            Number(receitasPadroes || 0),
        despesas_padroes_inteligentes:
            Number(despesasPadroes || 0),
        resultado_previsto:
            receitas - despesas,
        saldo_projetado:
            Number(saldoReal || 0) +
            receitas -
            despesas,
    };
}

export async function obterProjecoesInteligentes() {
    const [
        base,
        ocorrenciasDetectadas,
    ] = await Promise.all([
        obterProjecoesFinanceiras(),
        gerarOcorrenciasPadroesConfirmados({
            dias: 90,
        }).catch(() => []),
    ]);

    if (!base) {
        return base;
    }

    const hoje =
        base?.periodo?.hoje
            ? new Date(
                `${base.periodo.hoje}T12:00:00`
            )
            : new Date();

    hoje.setHours(12, 0, 0, 0);

    const hojeIso = [
        hoje.getFullYear(),
        String(hoje.getMonth() + 1)
            .padStart(2, "0"),
        String(hoje.getDate())
            .padStart(2, "0"),
    ].join("-");

    const movimentosBase =
        base?.proximas_movimentacoes || [];

    const assinaturasBase =
        new Set(
            movimentosBase.map(
                assinaturaMovimento
            )
        );

    const ocorrenciasFuturas =
        (ocorrenciasDetectadas || [])
            .filter(
                (item) =>
                    item?.data &&
                    String(item.data) > hojeIso
            );

    const padroesSemDuplicidade =
        ocorrenciasFuturas
            .filter(
                (item) =>
                    !assinaturasBase.has(
                        assinaturaMovimento(item)
                    )
            );

    const movimentos = [
        ...movimentosBase,
        ...padroesSemDuplicidade,
    ].sort(
        (a, b) =>
            String(a.data)
                .localeCompare(
                    String(b.data)
                )
    );

    const saldoReal =
        Number(
            base?.saldo_real || 0
        );

    const receitas30 =
        somarPorTipo(
            padroesSemDuplicidade,
            hoje,
            30,
            "receita"
        );

    const despesas30 =
        somarPorTipo(
            padroesSemDuplicidade,
            hoje,
            30,
            "despesa"
        );

    const receitas60 =
        somarPorTipo(
            padroesSemDuplicidade,
            hoje,
            60,
            "receita"
        );

    const despesas60 =
        somarPorTipo(
            padroesSemDuplicidade,
            hoje,
            60,
            "despesa"
        );

    const receitas90 =
        somarPorTipo(
            padroesSemDuplicidade,
            hoje,
            90,
            "receita"
        );

    const despesas90 =
        somarPorTipo(
            padroesSemDuplicidade,
            hoje,
            90,
            "despesa"
        );

    return {
        ...base,
        dias_30:
            enriquecerHorizonte(
                base.dias_30,
                saldoReal,
                receitas30,
                despesas30
            ),
        dias_60:
            enriquecerHorizonte(
                base.dias_60,
                saldoReal,
                receitas60,
                despesas60
            ),
        dias_90:
            enriquecerHorizonte(
                base.dias_90,
                saldoReal,
                receitas90,
                despesas90
            ),
        proximas_movimentacoes:
            movimentos,
        evolucao:
            recalcularEvolucao(
                saldoReal,
                hojeIso,
                movimentos
            ),
        padroes_inteligentes:
            padroesSemDuplicidade,
    };
}

export function obterPrimeiroRiscoSaldo(
    dados
) {
    const ponto =
        (dados?.evolucao || [])
            .find(
                (item) =>
                    item.tipo === "projecao" &&
                    Number(item.saldo || 0) < 0
            );

    if (!ponto) {
        return null;
    }

    return {
        data: ponto.data,
        saldo: Number(ponto.saldo || 0),
        falta: Math.abs(
            Number(ponto.saldo || 0)
        ),
    };
}
