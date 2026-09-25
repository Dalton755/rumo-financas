
import { supabase } from "./supabase";
import {
    listarParcelasPlanejadasDividas
} from "./dividas";


function dataIsoLocal(data) {
    return [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0")
    ].join("-");
}


function somarParcelasAte(
    parcelas,
    hoje,
    dias
) {
    const limite =
        new Date(hoje);

    limite.setDate(
        limite.getDate() +
        dias
    );

    return parcelas.reduce(
        (total, item) => {
            const data =
                new Date(
                    String(item.data_projecao) +
                    "T12:00:00"
                );

            if (
                Number.isNaN(
                    data.getTime()
                ) ||
                data > limite
            ) {
                return total;
            }

            return total +
                Number(
                    item.valor_restante ||
                    0
                );
        },
        0
    );
}


function combinarProjecoesComDividas(
    dados,
    parcelas
) {
    if (!dados) {
        return dados;
    }

    const hoje =
        dados?.periodo?.hoje
            ? new Date(
                String(
                    dados.periodo.hoje
                ) + "T12:00:00"
            )
            : new Date();

    hoje.setHours(
        12,
        0,
        0,
        0
    );

    const hojeIso =
        dataIsoLocal(hoje);

    const limite90 =
        new Date(hoje);

    limite90.setDate(
        limite90.getDate() +
        90
    );

    const limite90Iso =
        dataIsoLocal(
            limite90
        );

    const parcelasPendentes =
        (parcelas || [])
            .filter(
                (item) =>
                    Number(
                        item.valor_restante ||
                        0
                    ) > 0
            )
            .map(
                (item) => ({
                    ...item,
                    data_projecao:
                        String(
                            item.semana_referencia
                        ) <
                        hojeIso
                            ? hojeIso
                            : String(
                                item.semana_referencia
                            ),
                })
            );

    const dividas30 =
        somarParcelasAte(
            parcelasPendentes,
            hoje,
            30
        );

    const dividas60 =
        somarParcelasAte(
            parcelasPendentes,
            hoje,
            60
        );

    const dividas90 =
        somarParcelasAte(
            parcelasPendentes,
            hoje,
            90
        );

    function horizonte(
        base,
        dividas
    ) {
        const receitas =
            Number(
                base?.receitas_previstas ||
                0
            );

        const despesas =
            Number(
                base?.despesas_previstas ||
                0
            ) +
            dividas;

        const saldoReal =
            Number(
                dados?.saldo_real ||
                0
            );

        return {
            ...base,
            receitas_previstas:
                receitas,
            despesas_previstas:
                despesas,
            despesas_dividas_planejadas:
                dividas,
            resultado_previsto:
                receitas -
                despesas,
            saldo_projetado:
                saldoReal +
                receitas -
                despesas,
        };
    }

    const movimentosBase =
        dados?.proximas_movimentacoes ||
        [];

    const movimentosDividas =
        parcelasPendentes.map(
            (item) => ({
                id:
                    "divida:" +
                    item.id,
                descricao:
                    "Dívida • " +
                    (
                        item.divida?.nome ||
                        "Parcela planejada"
                    ),
                tipo:
                    "pagamento_divida_planejado",
                valor:
                    Number(
                        item.valor_restante ||
                        0
                    ),
                data:
                    item.data_projecao,
                vencimento_original:
                    item.semana_referencia,
                conta:
                    null,
                categoria:
                    "Dívida",
                impacto:
                    -Number(
                        item.valor_restante ||
                        0
                    ),
                origem:
                    "plano_quitacao",
                divida_id:
                    item.divida_id,
                parcela_id:
                    item.id,
            })
        );

    const movimentos =
        [
            ...movimentosBase,
            ...movimentosDividas,
        ]
            .filter(
                (item) =>
                    item.data &&
                    String(
                        item.data
                    ) <=
                    limite90Iso
            )
            .sort(
                (a, b) =>
                    String(
                        a.data
                    ).localeCompare(
                        String(
                            b.data
                        )
                    )
            );

    const porDia =
        new Map();

    movimentos.forEach(
        (item) => {
            const impacto =
                Number(
                    item.impacto ??
                    (
                        item.tipo ===
                        "receita"
                            ? item.valor
                            : -Number(
                                item.valor ||
                                0
                            )
                    )
                );

            porDia.set(
                item.data,
                (
                    porDia.get(
                        item.data
                    ) ||
                    0
                ) +
                impacto
            );
        }
    );

    let saldo =
        Number(
            dados?.saldo_real ||
            0
        );

    const evolucao = [
        {
            data:
                hojeIso,
            saldo,
            tipo:
                "saldo_atual",
        },
    ];

    [...porDia.entries()]
        .sort(
            ([dataA], [dataB]) =>
                String(
                    dataA
                ).localeCompare(
                    String(
                        dataB
                    )
                )
        )
        .forEach(
            ([
                data,
                resultado,
            ]) => {
                saldo +=
                    Number(
                        resultado ||
                        0
                    );

                evolucao.push({
                    data,
                    resultado_dia:
                        resultado,
                    saldo,
                    tipo:
                        "projecao",
                });
            }
        );

    return {
        ...dados,
        dias_30:
            horizonte(
                dados.dias_30,
                dividas30
            ),
        dias_60:
            horizonte(
                dados.dias_60,
                dividas60
            ),
        dias_90:
            horizonte(
                dados.dias_90,
                dividas90
            ),
        proximas_movimentacoes:
            movimentos,
        evolucao,
        dividas_planejadas:
            parcelasPendentes,
    };
}


export async function obterProjecoesFinanceiras() {

    const [
        resposta,
        parcelas
    ] =
        await Promise.all([
            supabase
                .schema("rumo")
                .rpc(
                    "obter_projecoes_financeiras"
                ),

            listarParcelasPlanejadasDividas({
                dias: 90,
                incluirVencidas: true
            })
        ]);


    const {
        data,
        error
    } = resposta;


    if (error) {

        console.error(
            "[RUMO PROJECOES] Erro ao obter projeções:",
            error
        );

        throw error;

    }


    return combinarProjecoesComDividas(
        data,
        parcelas
    );

}
