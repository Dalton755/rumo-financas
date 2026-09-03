import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { autenticarUsuario } from "./_lib/autenticarUsuario.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            error: "Método não permitido",
        });
    }

    try {
        const user =
            await autenticarUsuario(req);

        const {
            data: assinatura,
            error: erroAssinatura,
        } = await supabaseAdmin
            .schema("rumo")
            .from("assinaturas")
            .select(`
                status,
                inicio_em,
                vence_em,
                renovacao_automatica,
                plano:planos (
                    codigo,
                    nome
                )
            `)
            .eq("usuario_id", user.id)
            .maybeSingle();

        if (erroAssinatura) {
            throw erroAssinatura;
        }

        return res.status(200).json({
            success: true,

            usuario: {
                id: user.id,
                email: user.email,
            },

            assinatura: assinatura
                ? {
                    plano:
                        assinatura.plano?.codigo || null,

                    nome_plano:
                        assinatura.plano?.nome || null,

                    status:
                        assinatura.status,

                    inicio_em:
                        assinatura.inicio_em,

                    vence_em:
                        assinatura.vence_em,

                    renovacao_automatica:
                        assinatura.renovacao_automatica,
                }
                : null,
        });
    } catch (error) {
        if (
            error?.message === "TOKEN_AUSENTE" ||
            error?.message === "TOKEN_INVALIDO"
        ) {
            return res.status(401).json({
                success: false,
                error: "Não autorizado",
            });
        }

        console.error(
            "Erro em /api/me:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Erro interno do servidor",
        });
    }
}
