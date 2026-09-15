export function identificarPartesMercadoPago(
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


    const ehComprovanteDeposito =
        linhas.some(
            (linha) =>
                /comprovante\s+de\s+dep[oó]sito/i.test(
                    linha
                )
        );


    const indiceOrigemDestino =
        linhas.findIndex(
            (linha) =>
                /^origem\s+e\s+destino$/i.test(
                    linha
                )
        );


    if (
        !ehComprovanteDeposito ||
        indiceOrigemDestino === -1
    ) {

        return null;

    }


    let origemInstituicao = "";
    let destinoInstituicao = "";


    for (
        let i =
            indiceOrigemDestino + 1;
        i < linhas.length;
        i++
    ) {

        const linha =
            linhas[i];


        if (
            !origemInstituicao &&
            (
                /nu\s+pagamentos/i.test(
                    linha
                ) ||
                /nubank/i.test(
                    linha
                )
            )
        ) {

            origemInstituicao =
                linha;

            continue;

        }


        if (
            !destinoInstituicao &&
            /mercado\s+pago/i.test(
                linha
            )
        ) {

            destinoInstituicao =
                linha;

            break;

        }

    }


    if (
        !origemInstituicao ||
        !destinoInstituicao
    ) {

        return null;

    }


    return {

        formato:
            "mercado_pago",

        origemNome:
            "",

        origemInstituicao,

        destinoNome:
            "",

        destinoInstituicao,

        transferenciaSemTitular:
            true

    };

}