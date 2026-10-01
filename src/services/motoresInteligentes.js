import { supabase } from "./supabase";
import {
    criarCompromisso,
    listarCompromissos,
} from "./compromissos";

const DIA_MS = 86400000;

function dataIsoLocal(data) {
    return [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0"),
    ].join("-");
}

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\b\d+\s*[xX]\b/g, " ")
        .replace(/\b\d+\s*\/\s*\d+\b/g, " ")
        .replace(/\b\d{1,4}\b/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function mediana(lista) {
    const valores = [...lista]
        .map(Number)
        .filter(Number.isFinite)
        .sort((a, b) => a - b);

    if (!valores.length) return 0;

    const meio = Math.floor(valores.length / 2);

    if (valores.length % 2) {
        return valores[meio];
    }

    return (
        valores[meio - 1] +
        valores[meio]
    ) / 2;
}

function diferencaDias(dataA, dataB) {
    const a = new Date(`${dataA}T12:00:00`);
    const b = new Date(`${dataB}T12:00:00`);

    return Math.round(
        (b.getTime() - a.getTime()) /
        DIA_MS
    );
}

function somarFrequencia(dataIso, frequencia) {
    const data = new Date(`${dataIso}T12:00:00`);

    if (frequencia === "semanal") {
        data.setDate(data.getDate() + 7);
        return dataIsoLocal(data);
    }

    const diaOriginal = data.getDate();

    data.setDate(1);
    data.setMonth(data.getMonth() + 1);

    const ultimoDia = new Date(
        data.getFullYear(),
        data.getMonth() + 1,
        0
    ).getDate();

    data.setDate(
        Math.min(
            diaOriginal,
            ultimoDia
        )
    );

    return dataIsoLocal(data);
}

function classificarFrequencia(intervalos) {
    const intervaloMediano =
        mediana(intervalos);

    if (
        intervaloMediano >= 5 &&
        intervaloMediano <= 9
    ) {
        return {
            frequencia: "semanal",
            intervaloDias: 7,
            tolerancia: 3,
        };
    }

    if (
        intervaloMediano >= 25 &&
        intervaloMediano <= 35
    ) {
        return {
            frequencia: "mensal",
            intervaloDias: 30,
            tolerancia: 7,
        };
    }

    return null;
}

function calcularConfianca({
    quantidade,
    intervalos,
    valores,
    frequencia,
}) {
    const alvo =
        frequencia === "semanal"
            ? 7
            : 30;

    const desvioIntervalos =
        intervalos.length
            ? intervalos.reduce(
                (total, intervalo) =>
                    total +
                    Math.abs(
                        Number(intervalo) -
                        alvo
                    ),
                0
            ) / intervalos.length
            : alvo;

    const mediaValor =
        valores.reduce(
            (total, valor) =>
                total + Number(valor || 0),
            0
        ) /
        Math.max(1, valores.length);

    const desvioValor =
        mediaValor > 0
            ? valores.reduce(
                (total, valor) =>
                    total +
                    Math.abs(
                        Number(valor || 0) -
                        mediaValor
                    ),
                0
            ) /
            valores.length /
            mediaValor
            : 1;

    const regularidade =
        Math.max(
            0,
            1 -
            desvioIntervalos /
            (frequencia === "semanal" ? 7 : 20)
        );

    const estabilidadeValor =
        Math.max(
            0,
            1 - Math.min(1, desvioValor)
        );

    const repeticao =
        Math.min(
            1,
            quantidade / 5
        );

    return Number(
        (
            0.5 * regularidade +
            0.3 * repeticao +
            0.2 * estabilidadeValor
        ).toFixed(4)
    );
}

async function obterUsuario() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) throw error;

    if (!user) {
        throw new Error(
            "Usuário não autenticado."
        );
    }

    return user;
}

async function listarDecisoesExistentes(usuarioId) {
    const { data, error } = await supabase
        .schema("rumo")
        .from("padroes_inteligentes")
        .select(`
            id,
            chave,
            status,
            compromisso_id,
            tipo,
            descricao,
            frequencia,
            valor_estimado,
            proxima_data,
            confianca,
            categoria_id,
            conta_id,
            dados
        `)
        .eq("usuario_id", usuarioId);

    if (error) throw error;

    return data || [];
}

export async function detectarPadroesFinanceiros({
    diasHistorico = 180,
    limite = 6,
} = {}) {
    const user = await obterUsuario();

    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);

    const inicio = new Date(hoje);
    inicio.setDate(
        inicio.getDate() -
        Math.max(60, Number(diasHistorico) || 180)
    );

    const [
        respostaMovimentacoes,
        decisoes,
        compromissos,
    ] = await Promise.all([
        supabase
            .schema("rumo")
            .from("movimentacoes")
            .select(`
                id,
                descricao,
                valor,
                tipo,
                data_movimentacao,
                categoria_id,
                conta_id,
                categoria:categorias!movimentacoes_categoria_id_fkey(
                    nome
                )
            `)
            .eq("usuario_id", user.id)
            .in("tipo", ["receita", "despesa"])
            .gte(
                "data_movimentacao",
                dataIsoLocal(inicio)
            )
            .lte(
                "data_movimentacao",
                dataIsoLocal(hoje)
            )
            .order("data_movimentacao", {
                ascending: true,
            }),
        listarDecisoesExistentes(user.id),
        listarCompromissos().catch(() => []),
    ]);

    if (respostaMovimentacoes.error) {
        throw respostaMovimentacoes.error;
    }

    const decisoesPorChave =
        new Map(
            (decisoes || []).map(
                (item) => [item.chave, item]
            )
        );

    const nomesCompromissos =
        new Set(
            (compromissos || [])
                .map((item) =>
                    normalizarTexto(item.nome)
                )
                .filter(Boolean)
        );

    const grupos = new Map();

    (respostaMovimentacoes.data || [])
        .forEach((movimento) => {
            const descricaoNormalizada =
                normalizarTexto(
                    movimento.descricao
                );

            const categoriaNormalizada =
                normalizarTexto(
                    movimento.categoria?.nome
                );

            if (
                descricaoNormalizada.length < 3 ||
                categoriaNormalizada === "emprestimo" ||
                categoriaNormalizada === "emprestimos"
            ) {
                return;
            }

            const chave = [
                movimento.tipo,
                movimento.categoria_id || "sem-categoria",
                descricaoNormalizada,
            ].join(":");

            if (!grupos.has(chave)) {
                grupos.set(chave, []);
            }

            grupos.get(chave).push(movimento);
        });

    const sugestoes = [];

    grupos.forEach((movimentos, chave) => {
        if (movimentos.length < 3) {
            return;
        }

        if (decisoesPorChave.has(chave)) {
            return;
        }

        const ordenados = [...movimentos]
            .sort((a, b) =>
                String(a.data_movimentacao)
                    .localeCompare(
                        String(b.data_movimentacao)
                    )
            );

        const intervalos = [];

        for (
            let indice = 1;
            indice < ordenados.length;
            indice += 1
        ) {
            intervalos.push(
                diferencaDias(
                    ordenados[indice - 1]
                        .data_movimentacao,
                    ordenados[indice]
                        .data_movimentacao
                )
            );
        }

        const classificacao =
            classificarFrequencia(intervalos);

        if (!classificacao) {
            return;
        }

        const intervaloMediano =
            mediana(intervalos);

        const intervalosValidos =
            intervalos.filter(
                (intervalo) =>
                    Math.abs(
                        intervalo -
                        intervaloMediano
                    ) <=
                    classificacao.tolerancia
            );

        if (
            intervalosValidos.length <
            Math.max(
                2,
                Math.ceil(
                    intervalos.length * 0.66
                )
            )
        ) {
            return;
        }

        const ultimo =
            ordenados[
                ordenados.length - 1
            ];

        const diasDesdeUltimo =
            diferencaDias(
                ultimo.data_movimentacao,
                dataIsoLocal(hoje)
            );

        const limiteInatividade =
            classificacao.frequencia === "semanal"
                ? 16
                : 50;

        if (diasDesdeUltimo > limiteInatividade) {
            return;
        }

        const valores =
            ordenados.map(
                (item) =>
                    Number(item.valor || 0)
            );

        const confianca =
            calcularConfianca({
                quantidade: ordenados.length,
                intervalos,
                valores,
                frequencia:
                    classificacao.frequencia,
            });

        if (confianca < 0.72) {
            return;
        }

        if (
            ultimo.tipo === "despesa" &&
            nomesCompromissos.has(
                normalizarTexto(
                    ultimo.descricao
                )
            )
        ) {
            return;
        }

        const valorEstimado =
            Number(
                mediana(valores).toFixed(2)
            );

        const proximaData =
            somarFrequencia(
                ultimo.data_movimentacao,
                classificacao.frequencia
            );

        sugestoes.push({
            chave,
            tipo: ultimo.tipo,
            descricao: ultimo.descricao,
            categoriaId:
                ultimo.categoria_id || null,
            categoria:
                ultimo.categoria?.nome || null,
            contaId:
                ultimo.conta_id || null,
            frequencia:
                classificacao.frequencia,
            intervaloDias:
                classificacao.intervaloDias,
            valorEstimado,
            proximaData,
            confianca,
            quantidadeOcorrencias:
                ordenados.length,
            valorMinimo:
                Math.min(...valores),
            valorMaximo:
                Math.max(...valores),
        });
    });

    return sugestoes
        .sort(
            (a, b) =>
                b.confianca -
                a.confianca
        )
        .slice(
            0,
            Math.max(1, Number(limite) || 6)
        );
}

async function salvarDecisao(
    padrao,
    status,
    compromissoId = null
) {
    const user = await obterUsuario();

    const payload = {
        usuario_id: user.id,
        chave: padrao.chave,
        tipo: padrao.tipo,
        descricao: padrao.descricao,
        categoria_id:
            padrao.categoriaId || null,
        conta_id:
            padrao.contaId || null,
        frequencia: padrao.frequencia,
        intervalo_dias:
            padrao.intervaloDias ||
            (
                padrao.frequencia === "semanal"
                    ? 7
                    : 30
            ),
        valor_estimado:
            Number(padrao.valorEstimado || 0),
        proxima_data: padrao.proximaData,
        confianca:
            Number(padrao.confianca || 0),
        status,
        origem: "historico",
        compromisso_id:
            compromissoId || null,
        dados: {
            quantidade_ocorrencias:
                padrao.quantidadeOcorrencias || null,
            valor_minimo:
                padrao.valorMinimo ?? null,
            valor_maximo:
                padrao.valorMaximo ?? null,
        },
        updated_at:
            new Date().toISOString(),
    };

    const { data, error } = await supabase
        .schema("rumo")
        .from("padroes_inteligentes")
        .upsert(
            payload,
            {
                onConflict:
                    "usuario_id,chave",
            }
        )
        .select()
        .single();

    if (error) throw error;

    return data;
}

export async function aceitarPadraoDetectado(
    padrao
) {
    let compromisso = null;

    if (padrao.tipo === "despesa") {
        compromisso =
            await criarCompromisso({
                nome: padrao.descricao,
                categoriaId:
                    padrao.categoriaId || null,
                contaId:
                    padrao.contaId || null,
                frequencia:
                    padrao.frequencia,
                dataInicio:
                    padrao.proximaData,
                tipoValor:
                    Math.abs(
                        Number(
                            padrao.valorMaximo || 0
                        ) -
                        Number(
                            padrao.valorMinimo || 0
                        )
                    ) <=
                    Number(
                        padrao.valorEstimado || 0
                    ) * 0.1
                        ? "fixo"
                        : "estimado",
                valorPadrao:
                    Number(padrao.valorEstimado || 0),
                valorEstimado:
                    Number(padrao.valorEstimado || 0),
            });
    }

    return salvarDecisao(
        padrao,
        "confirmado",
        compromisso?.id || null
    );
}

export async function ignorarPadraoDetectado(
    padrao
) {
    return salvarDecisao(
        padrao,
        "ignorado"
    );
}

export async function listarPadroesConfirmados() {
    const user = await obterUsuario();

    const { data, error } = await supabase
        .schema("rumo")
        .from("padroes_inteligentes")
        .select(`
            id,
            chave,
            tipo,
            descricao,
            categoria_id,
            conta_id,
            frequencia,
            intervalo_dias,
            valor_estimado,
            proxima_data,
            confianca,
            compromisso_id,
            dados
        `)
        .eq("usuario_id", user.id)
        .eq("status", "confirmado")
        .order("proxima_data", {
            ascending: true,
        });

    if (error) throw error;

    return data || [];
}

export async function gerarOcorrenciasPadroesConfirmados({
    dias = 90,
} = {}) {
    const padroes =
        await listarPadroesConfirmados();

    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);

    const limite = new Date(hoje);
    limite.setDate(
        limite.getDate() +
        Math.max(1, Number(dias) || 90)
    );

    const hojeIso = dataIsoLocal(hoje);
    const limiteIso = dataIsoLocal(limite);
    const ocorrencias = [];

    padroes.forEach((padrao) => {
        let data = String(
            padrao.proxima_data || ""
        );

        let seguranca = 0;

        while (
            data &&
            data < hojeIso &&
            seguranca < 60
        ) {
            data = somarFrequencia(
                data,
                padrao.frequencia
            );
            seguranca += 1;
        }

        while (
            data &&
            data <= limiteIso &&
            seguranca < 120
        ) {
            ocorrencias.push({
                id:
                    `padrao:${padrao.id}:${data}`,
                padrao_id: padrao.id,
                descricao:
                    padrao.descricao,
                tipo:
                    padrao.tipo,
                valor:
                    Number(
                        padrao.valor_estimado || 0
                    ),
                data,
                categoria:
                    null,
                conta:
                    null,
                impacto:
                    padrao.tipo === "receita"
                        ? Number(
                            padrao.valor_estimado || 0
                        )
                        : -Number(
                            padrao.valor_estimado || 0
                        ),
                origem:
                    "padrao_inteligente",
                confianca:
                    Number(
                        padrao.confianca || 0
                    ),
            });

            data = somarFrequencia(
                data,
                padrao.frequencia
            );
            seguranca += 1;
        }
    });

    return ocorrencias.sort(
        (a, b) =>
            String(a.data)
                .localeCompare(
                    String(b.data)
                )
    );
}
