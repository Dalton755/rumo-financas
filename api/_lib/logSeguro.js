export function resumirErroSeguro(error) {
    const statusRaw =
        error?.response?.status ??
        error?.status ??
        error?.statusCode ??
        null;

    const status =
        Number.isFinite(Number(statusRaw))
            ? Number(statusRaw)
            : null;

    const code =
        error?.code !== undefined &&
        error?.code !== null
            ? String(error.code).slice(0, 80)
            : null;

    const name =
        error?.name
            ? String(error.name).slice(0, 80)
            : "Error";

    const message =
        error?.message
            ? String(error.message).slice(0, 300)
            : "Erro sem mensagem.";

    return {
        name,
        message,
        status,
        code,
    };
}
