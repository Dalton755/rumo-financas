import { supabase } from "./supabase";
import {
    arquivarCompromisso,
    criarCompromisso,
} from "./compromissos";

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
            Number(
                padrao.intervaloDias ||
                (
                    padrao.frequencia === "semanal"
                        ? 7
                        : 30
                )
            ),
        valor_estimado:
            Number(padrao.valorEstimado || 0),
        proxima_data:
            padrao.proximaData,
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

export async function confirmarPadraoInteligente(
    padrao
) {
    let compromisso = null;

    try {
        if (padrao.tipo === "despesa") {
            const valorEstimado =
                Number(
                    padrao.valorEstimado || 0
                );

            const amplitude =
                Math.abs(
                    Number(
                        padrao.valorMaximo ??
                        valorEstimado
                    ) -
                    Number(
                        padrao.valorMinimo ??
                        valorEstimado
                    )
                );

            const valorFixo =
                valorEstimado > 0 &&
                amplitude <=
                valorEstimado * 0.1;

            compromisso =
                await criarCompromisso({
                    nome:
                        padrao.descricao,
                    categoriaId:
                        padrao.categoriaId || null,
                    contaId:
                        padrao.contaId || null,
                    frequencia:
                        padrao.frequencia,
                    dataInicio:
                        padrao.proximaData,
                    tipoValor:
                        valorFixo
                            ? "fixo"
                            : "variavel",
                    valorPadrao:
                        valorFixo
                            ? valorEstimado
                            : null,
                    valorEstimado:
                        valorFixo
                            ? null
                            : valorEstimado,
                });
        }

        const decisao =
            await salvarDecisao(
                padrao,
                "confirmado",
                compromisso?.id || null
            );

        window.dispatchEvent(
            new Event(
                "rumo:dados-atualizados"
            )
        );

        return decisao;
    } catch (error) {
        if (compromisso?.id) {
            try {
                await arquivarCompromisso(
                    compromisso.id
                );
            } catch (erroRollback) {
                console.error(
                    "[RUMO IA] Erro ao desfazer compromisso:",
                    erroRollback
                );
            }
        }

        throw error;
    }
}

export async function ignorarPadraoInteligente(
    padrao
) {
    const decisao =
        await salvarDecisao(
            padrao,
            "ignorado"
        );

    return decisao;
}
