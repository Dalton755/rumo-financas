function limparLinhaOcrPessoa(
    valor
) {

    return String(valor || "")
        .trim()
        .replace(
            /^rs\s+/i,
            ""
        )
        .trim();

}


function ehLinhaCpfOcr(
    valor
) {

    const linha =
        String(valor || "")
            .trim()
            .toLowerCase();


    return (
        linha.startsWith("so ") ||
        (
            linha.includes("*") &&
            /\d/.test(linha)
        )
    );

}


export function identificarPartesMaree(
    texto
) {

    const linhas =
        String(texto || "")
            .split(/\r?\n/)
            .map(
                (linha) =>
                    linha.trim()
            )
            .filter(Boolean);


    const indiceTransferirPara =
        linhas.findIndex(
            (linha) =>
                /^transferir\s+para$/i.test(
                    linha
                )
        );


    const indiceDe =
        linhas.findIndex(
            (linha) =>
                /^de$/i.test(
                    linha
                )
        );


    if (
        indiceTransferirPara === -1 ||
        indiceDe === -1 ||
        indiceDe <= indiceTransferirPara
    ) {

        return null;

    }


    let destinoNome = "";
    let destinoInstituicao = "";


    for (
        let i =
            indiceTransferirPara + 1;
        i < indiceDe;
        i++
    ) {

        const linha =
            linhas[i];


        if (
            ehLinhaCpfOcr(
                linha
            )
        ) {
            continue;
        }


        if (!destinoNome) {

            destinoNome =
                limparLinhaOcrPessoa(
                    linha
                );

            continue;

        }


        if (!destinoInstituicao) {

            destinoInstituicao =
                linha;

            break;

        }

    }


    let origemNome = "";
    let origemInstituicao = "";


    for (
        let i =
            indiceDe + 1;
        i < linhas.length;
        i++
    ) {

        const linha =
            linhas[i];


        if (
            /^detalhes$/i.test(
                linha
            )
        ) {
            break;
        }


        if (
            ehLinhaCpfOcr(
                linha
            )
        ) {
            continue;
        }


        if (!origemNome) {

            origemNome =
                limparLinhaOcrPessoa(
                    linha
                );

            continue;

        }


        if (!origemInstituicao) {

            origemInstituicao =
                linha;

            break;

        }

    }


    if (
        !origemNome ||
        !destinoNome
    ) {

        return null;

    }


    return {

        formato:
            "maree",

        origemNome,

        origemInstituicao,

        destinoNome,

        destinoInstituicao

    };

}