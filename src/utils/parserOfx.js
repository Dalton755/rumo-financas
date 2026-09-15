function extrairCampo(
    bloco,
    campo
) {

    const regex =
        new RegExp(
            `<${campo}>([^<\\r\\n]+)`,
            "i"
        );


    const resultado =
        bloco.match(regex);


    return resultado?.[1]
        ?.trim() || "";

}


function normalizarDataOfx(
    valor
) {

    if (!valor) {
        return "";
    }


    const somenteNumeros =
        String(valor)
            .replace(
                /\D/g,
                ""
            );


    if (
        somenteNumeros.length <
        8
    ) {
        return "";
    }


    const ano =
        somenteNumeros.slice(0, 4);

    const mes =
        somenteNumeros.slice(4, 6);

    const dia =
        somenteNumeros.slice(6, 8);


    return `${ano}-${mes}-${dia}`;

}


function limparDescricao(
    valor
) {

    return String(
        valor || ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function obterDescricao(
    bloco
) {

    const memo =
        extrairCampo(
            bloco,
            "MEMO"
        );


    const nome =
        extrairCampo(
            bloco,
            "NAME"
        );


    const payee =
        extrairCampo(
            bloco,
            "PAYEE"
        );


    return limparDescricao(
        memo ||
        nome ||
        payee ||
        "Movimentação importada"
    );

}


export function parseOfx(
    conteudo
) {

    if (
        !conteudo ||
        typeof conteudo !==
        "string"
    ) {
        throw new Error(
            "Arquivo OFX inválido."
        );
    }


    /*
     * OFX normalmente possui um bloco
     * <STMTTRN> para cada transação.
     *
     * A regex aceita tanto OFX SGML
     * quanto OFX com fechamento XML.
     */
    const blocos =
        conteudo.match(
            /<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>|<\/STMTTRN>|$)/gi
        ) || [];


    const itens =
        blocos.map(
            (bloco, index) => {

                const valorOriginal =
                    Number(
                        String(
                            extrairCampo(
                                bloco,
                                "TRNAMT"
                            )
                        )
                            .replace(
                                ",",
                                "."
                            )
                    );


                const tipo =
                    valorOriginal >= 0
                        ? "receita"
                        : "despesa";


                const valor =
                    Math.abs(
                        valorOriginal
                    );


                const descricao =
                    obterDescricao(
                        bloco
                    );


                const fitid =
                    extrairCampo(
                        bloco,
                        "FITID"
                    );


                const tipoOfx =
                    extrairCampo(
                        bloco,
                        "TRNTYPE"
                    );


                return {

                    chave:
                        `${fitid || index}`,

                    identificadorExterno:
                        fitid || null,

                    data:
                        normalizarDataOfx(
                            extrairCampo(
                                bloco,
                                "DTPOSTED"
                            )
                        ),

                    descricaoOriginal:
                        descricao,

                    descricao,

                    valor,

                    tipo,

                    categoriaId:
                        "",

                    selecionado:
                        true,

                    duplicado:
                        false,

                    dadosOriginais: {
                        trntype:
                            tipoOfx || null,

                        fitid:
                            fitid || null
                    }

                };

            }
        )
        .filter(
            (item) =>
                item.data &&
                item.valor > 0
        );


    if (
        itens.length === 0
    ) {
        throw new Error(
            "Nenhuma movimentação foi encontrada neste OFX."
        );
    }


    return itens;

}