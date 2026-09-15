function normalizar(
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
        .trim()
        .toLowerCase();

}


function extrairLinhas(
    texto
) {

    return String(texto || "")
        .split(/\r?\n/)
        .map(
            (linha) =>
                linha.trim()
        )
        .filter(Boolean);

}


function ehRotulo(
    linha
) {

    const valor =
        normalizar(
            linha
        );


    return [
        "nome",
        "cpf",
        "cpf/cnpj",
        "instituicao",
        "agencia",
        "conta",
        "chave pix",
        "tipo de transferencia",
        "de",
        "para",
        "dados da transacao"
    ].some(
        (rotulo) =>
            valor === rotulo ||
            valor.startsWith(
                `${rotulo}:`
            )
    );

}


function extrairValorCampo(
    linhas,
    inicio,
    fim,
    campo
) {

    const campoNormalizado =
        normalizar(
            campo
        );


    for (
        let i = inicio;
        i < fim;
        i++
    ) {

        const linha =
            linhas[i];

        const linhaNormalizada =
            normalizar(
                linha
            );


        /*
         * Nome: Dalton
         * Instituição: Itaú
         */
        if (
            linhaNormalizada.startsWith(
                `${campoNormalizado}:`
            )
        ) {

            const indice =
                linha.indexOf(":");


            return indice !== -1
                ? linha
                    .slice(
                        indice + 1
                    )
                    .trim()
                : "";

        }


        /*
         * Nome Dalton
         * Instituição Itaú
         */
        if (
            linhaNormalizada.startsWith(
                `${campoNormalizado} `
            )
        ) {

            return linha
                .slice(
                    linha.indexOf(" ") + 1
                )
                .trim();

        }


        /*
         * Nome
         * Dalton
         */
        if (
            linhaNormalizada ===
            campoNormalizado
        ) {

            for (
                let j = i + 1;
                j < fim;
                j++
            ) {

                if (
                    !ehRotulo(
                        linhas[j]
                    )
                ) {

                    return (
                        linhas[j] || ""
                    ).trim();

                }

            }

        }

    }


    return "";

}


function primeiraLinhaUtil(
    linhas,
    inicio,
    fim
) {

    for (
        let i = inicio;
        i < fim;
        i++
    ) {

        const linha =
            linhas[i];


        if (
            !ehRotulo(
                linha
            )
        ) {

            return linha;

        }

    }


    return "";

}


export function identificarPartesDePara(
    texto
) {

    const linhas =
        extrairLinhas(
            texto
        );


    const indiceDe =
        linhas.findIndex(
            (linha) =>
                normalizar(
                    linha
                ) === "de"
        );


    const indicePara =
        linhas.findIndex(
            (linha) =>
                normalizar(
                    linha
                ) === "para"
        );


    if (
        indiceDe === -1 ||
        indicePara === -1 ||
        indicePara <= indiceDe
    ) {

        return null;

    }


    const fimDestinoEncontrado =
        linhas.findIndex(
            (linha, indice) =>
                indice > indicePara &&
                normalizar(
                    linha
                ) === "dados da transacao"
        );


    const fimDestino =
        fimDestinoEncontrado === -1
            ? linhas.length
            : fimDestinoEncontrado;


    /*
     * Itaú não escreve "Nome:" antes
     * do titular. O nome costuma ser a
     * primeira linha útil após De/Para.
     */
    const origemNome =
        extrairValorCampo(
            linhas,
            indiceDe + 1,
            indicePara,
            "nome"
        ) ||
        primeiraLinhaUtil(
            linhas,
            indiceDe + 1,
            indicePara
        );


    const origemInstituicao =
        extrairValorCampo(
            linhas,
            indiceDe + 1,
            indicePara,
            "instituicao"
        );


    const destinoNome =
        extrairValorCampo(
            linhas,
            indicePara + 1,
            fimDestino,
            "nome"
        ) ||
        primeiraLinhaUtil(
            linhas,
            indicePara + 1,
            fimDestino
        );


    const destinoInstituicao =
        extrairValorCampo(
            linhas,
            indicePara + 1,
            fimDestino,
            "instituicao"
        );


    if (
        !origemNome ||
        !destinoNome
    ) {

        return null;

    }


    return {

        formato:
            "de_para",

        origemNome,

        origemInstituicao,

        destinoNome,

        destinoInstituicao,

        descricaoOriginal:
            "",

        observacaoOriginal:
            ""

    };

}