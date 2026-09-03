import { supabaseAdmin } from "./supabaseAdmin.js";

export async function autenticarUsuario(req) {
    const authorization =
        req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        throw new Error("TOKEN_AUSENTE");
    }

    const token =
        authorization.substring(7).trim();

    if (!token) {
        throw new Error("TOKEN_AUSENTE");
    }

    const {
        data: { user },
        error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
        throw new Error("TOKEN_INVALIDO");
    }

    return user;
}
