function normalizarTexto(
    valor
) {

    return String(valor || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function extrairEntre(
    texto,
    inicio,
    fim = null
) {

    const regex =
        fim
            ? new RegExp(
                `${inicio}([\\s\\S]*?)${fim}`,
                "i"
            )
            : new RegExp(
                `${inicio}([\\s\\S]*)`,
                "i"
            );


    return (
        texto.match(
            regex
        )?.[1] || ""
    ).trim();

}


function extrairNome(
    bloco
) {

    /*
     * Suporta:
     *
     * Nome
     * Dalton Rocha da Silva
     *
     * ou:
     *
     * Nome Dalton Rocha da Silva
     */
    const resultado =
        bloco.match(
            /Nome\s*[:\-]?\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{3,}?)(?=\s+(?:CPF|CNPJ|Institui[cç][aã]o|$))/i
        );


    return (
        resultado?.[1] || ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function extrairInstituicao(
    bloco
) {

    const resultado =
        bloco.match(
            /Institui[cç][aã]o\s*[:\-]?\s*(.+?)(?=\s+(?:Quem\s+recebeu|ID\s+de\s+transa[cç][aã]o|CPF|CNPJ|$))/i
        );


    return (
        resultado?.[1] || ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


export function identificarPartesPagadorRecebedor(
    texto
) {

    const textoOriginal =
        String(texto || "");


    const textoNormalizado =
        normalizarTexto(
            textoOriginal
        );


    const possuiPagador =
        /quem\s+pagou/i.test(
            textoNormalizado
        );


    const possuiRecebedor =
        /quem\s+recebeu/i.test(
            textoNormalizado
        );


    if (
        !possuiPagador ||
        !possuiRecebedor
    ) {

        return null;

    }


    const blocoOrigem =
        extrairEntre(
            textoOriginal,
            "Quem\\s+pagou",
            "Quem\\s+recebeu"
        );


    const blocoDestino =
        extrairEntre(
            textoOriginal,
            "Quem\\s+recebeu",
            "(?:ID\\s+de\\s+transa[cç][aã]o|$)"
        );


    const origemNome =
        extrairNome(
            blocoOrigem
        );


    const origemInstituicao =
        extrairInstituicao(
            blocoOrigem
        );


    const destinoNome =
        extrairNome(
            blocoDestino
        );


    const destinoInstituicao =
        extrairInstituicao(
            blocoDestino
        );


    console.log(
        "[IMPORTADOR] Pagador/Recebedor:",
        {
            origemNome,
            origemInstituicao,
            destinoNome,
            destinoInstituicao
        }
    );


    if (
        !origemNome ||
        !destinoNome
    ) {

        return null;

    }


    return {

        formato:
            "pagador_recebedor",

        origemNome,

        origemInstituicao,

        destinoNome,

        destinoInstituicao

    };

}