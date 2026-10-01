import { supabase } from "./supabase";
import {
    obterPrimeiroRiscoSaldo,
    obterProjecoesInteligentes,
} from "./projecoesInteligentes";

const CHAVE_RISCO =
    "RISCO_SALDO_PADROES_INTELIGENTES";

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

function formatarData(valor) {
    return new Date(
        `${valor}T12:00:00`
    ).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL",
            }
        );
}

function diasAte(dataIso) {
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);

    const data = new Date(
        `${dataIso}T12:00:00`
    );

    return Math.round(
        (
            data.getTime() -
            hoje.getTime()
        ) /
        86400000
    );
}

export async function atualizarAlertaRiscoPadroes() {
    const user = await obterUsuario();

    const projecoes =
        await obterProjecoesInteligentes();

    const risco =
        obterPrimeiroRiscoSaldo(
            projecoes
        );

    const {
        data: existente,
        error: erroExistente,
    } = await supabase
        .schema("rumo")
        .from("alertas")
        .select(`
            id,
            lido,
            ativo,
            nivel,
            dados
        `)
        .eq("usuario_id", user.id)
        .eq("chave", CHAVE_RISCO)
        .maybeSingle();

    if (erroExistente) {
        throw erroExistente;
    }

    if (!risco) {
        if (existente?.id && existente.ativo) {
            const { error } = await supabase
                .schema("rumo")
                .from("alertas")
                .update({
                    ativo: false,
                    resolvido_em:
                        new Date().toISOString(),
                    updated_at:
                        new Date().toISOString(),
                })
                .eq("id", existente.id)
                .eq("usuario_id", user.id);

            if (error) throw error;
        }

        return null;
    }

    const dias =
        diasAte(risco.data);

    const nivel =
        dias <= 7
            ? "critico"
            : "atencao";

    const dados = {
        data: risco.data,
        saldo_projetado:
            risco.saldo,
        falta:
            risco.falta,
        origem:
            "padroes_inteligentes",
    };

    const mudou =
        !existente ||
        !existente.ativo ||
        existente.nivel !== nivel ||
        String(
            existente.dados?.data || ""
        ) !== String(risco.data) ||
        Math.abs(
            Number(
                existente.dados?.falta || 0
            ) -
            Number(risco.falta || 0)
        ) > 0.01;

    const payload = {
        usuario_id: user.id,
        tipo:
            "PROJECAO_INTELIGENTE",
        titulo:
            "Rumo detectou um risco antes do saldo ficar negativo",
        descricao:
            `Mantendo o cenário atual, podem faltar aproximadamente ${formatarMoeda(
                risco.falta
            )} em ${formatarData(
                risco.data
            )}.`,
        chave: CHAVE_RISCO,
        nivel,
        rota: "/projecoes",
        ativo: true,
        lido:
            mudou
                ? false
                : Boolean(
                    existente?.lido
                ),
        dados,
        resolvido_em: null,
        updated_at:
            new Date().toISOString(),
    };

    if (existente?.id) {
        const { data, error } = await supabase
            .schema("rumo")
            .from("alertas")
            .update(payload)
            .eq("id", existente.id)
            .eq("usuario_id", user.id)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    const { data, error } = await supabase
        .schema("rumo")
        .from("alertas")
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    return data;
}
