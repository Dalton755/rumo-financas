export function identificarPartesBradesco(
    texto
) {

    const textoCompleto =
        String(texto || "");


    const textoNormalizado =
        textoCompleto
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim()
            .toLowerCase();


    const ehBradesco =
        textoNormalizado.includes(
            "bradesco"
        ) &&
        (
            textoNormalizado.includes(
                "comprovante de transferencia pix"
            ) ||
            textoNormalizado.includes(
                "dados de quem recebeu"
            )
        );


    if (!ehBradesco) {
        return null;
    }


    const recebidoMatch =
        textoCompleto.match(
            /Dados\s+de\s+quem\s+recebeu([\s\S]*?)Dados\s+da\s+transa[cç][aã]o/i
        );


    const enviouMatch =
        textoCompleto.match(
            /Dados\s+de\s+quem\s+fez\s+a\s+transa[cç][aã]o([\s\S]*?)(?:Esta\s+transa[cç][aã]o|Autentica[cç][aã]o|Telefones\s+de\s+contato|$)/i
        );


    if (
        !recebidoMatch ||
        !enviouMatch
    ) {

        return null;

    }


    const blocoDestino =
        recebidoMatch[1] || "";


    const blocoOrigem =
        enviouMatch[1] || "";


    const destinoNome =
        blocoDestino
            .match(
                /Nome:\s*([^\r\n]+)/i
            )?.[1]
            ?.trim() || "";


    const destinoInstituicao =
        blocoDestino
            .match(
                /Institui[cç][aã]o:\s*([^\r\n]+)/i
            )?.[1]
            ?.trim() || "";


    const origemNome =
        blocoOrigem
            .match(
                /Nome:\s*([^\r\n]+)/i
            )?.[1]
            ?.trim() || "";


    if (
        !origemNome ||
        !destinoNome
    ) {

        return null;

    }


    return {

        formato:
            "bradesco",

        origemNome,

        origemInstituicao:
            "Banco Bradesco S.A.",

        destinoNome,

        destinoInstituicao:
            destinoInstituicao ||
            "Banco Bradesco S.A."

    };

}