import { supabaseAdmin } from "./_lib/supabaseAdmin.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            error: "Método não permitido",
        });
    }

    try {
        const {
            count,
            error,
        } = await supabaseAdmin
            .schema("rumo")
            .from("planos")
            .select("id", {
                count: "exact",
                head: true,
            });

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            app: "Rumo",
            supabase: "conectado",
            quantidade_planos: count ?? 0,
        });
    } catch (error) {
        console.error(
            "Erro no teste administrativo do Supabase:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Falha ao conectar o backend ao Supabase",
        });
    }
}
