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
        "chave pix",
        "agencia",
        "conta",
        "origem",
        "destino",
        "id da transacao"
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
         * FORMATO 1
         *
         * Nome: Dalton Rocha da Silva
         * Instituição: NU PAGAMENTOS - IP
         */
        if (
            linhaNormalizada.startsWith(
                `${campoNormalizado}:`
            )
        ) {

            const indiceDoisPontos =
                linha.indexOf(":");


            if (
                indiceDoisPontos !== -1
            ) {

                return linha
                    .slice(
                        indiceDoisPontos + 1
                    )
                    .trim();

            }

        }


        /*
         * FORMATO 2
         *
         * Nome Dalton Rocha da Silva
         * Instituição NU PAGAMENTOS - IP
         *
         * Muito comum no texto devolvido
         * pelo OCR.
         */
        if (
            linhaNormalizada.startsWith(
                `${campoNormalizado} `
            )
        ) {

            const indiceEspaco =
                linha.indexOf(" ");


            if (
                indiceEspaco !== -1
            ) {

                return linha
                    .slice(
                        indiceEspaco + 1
                    )
                    .trim();

            }

        }


        /*
         * FORMATO 3
         *
         * Nome
         * Dalton Rocha da Silva
         *
         * Instituição
         * NU PAGAMENTOS - IP
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


export function identificarPartesOrigemDestino(
    texto
) {

    const linhas =
        extrairLinhas(
            texto
        );


    const indiceDestino =
        linhas.findIndex(
            (linha) =>
                normalizar(
                    linha
                ) === "destino"
        );


    const indiceOrigem =
        linhas.findIndex(
            (linha) =>
                normalizar(
                    linha
                ) === "origem"
        );


    if (
        indiceDestino === -1 ||
        indiceOrigem === -1 ||
        indiceOrigem <= indiceDestino
    ) {

        return null;

    }


    const destinoNome =
        extrairValorCampo(
            linhas,
            indiceDestino + 1,
            indiceOrigem,
            "Nome"
        );


    const destinoInstituicao =
        extrairValorCampo(
            linhas,
            indiceDestino + 1,
            indiceOrigem,
            "instituicao"
        );


    const origemNome =
        extrairValorCampo(
            linhas,
            indiceOrigem + 1,
            linhas.length,
            "Nome"
        );


    const origemInstituicao =
        extrairValorCampo(
            linhas,
            indiceOrigem + 1,
            linhas.length,
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
            "origem_destino",

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