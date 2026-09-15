import * as pdfjsLib from "pdfjs-dist";

import pdfWorker from
    "pdfjs-dist/build/pdf.worker.min.mjs?url";


pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorker;


/*
 * Converte:
 * 1.234,56 -> 1234.56
 * -1.234,56 -> -1234.56
 */
function converterValorBrasileiro(
    texto
) {

    if (!texto) {
        return null;
    }


    let valor =
        String(texto)
            .trim()
            .replace(/\s/g, "")
            .replace(/^R\$/i, "");


    let negativo = false;


    /*
     * R$-19,80
     */
    if (
        valor.startsWith("-")
    ) {

        negativo = true;

        valor =
            valor.substring(1);

    }


    /*
     * Alguns bancos:
     * 100,00 D
     * 100,00 C
     */
    if (
        /D$/i.test(valor)
    ) {

        negativo = true;

        valor =
            valor.replace(
                /D$/i,
                ""
            );

    }


    if (
        /C$/i.test(valor)
    ) {

        valor =
            valor.replace(
                /C$/i,
                ""
            );

    }


    valor =
        valor
            .replace(/\./g, "")
            .replace(",", ".");


    const numero =
        Number(valor);


    if (
        Number.isNaN(numero)
    ) {
        return null;
    }


    return negativo
        ? -numero
        : numero;

}


function normalizarData(
    texto,
    anoReferencia = null
) {

    if (!texto) {
        return "";
    }


    const valor =
        String(texto)
            .trim()
            .replace(/\./g, "/")
            .replace(/-/g, "/");


    /*
     * DD/MM/YYYY
     * DD-MM-YYYY
     */
    let resultado =
        valor.match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        );


    if (resultado) {

        const [, dia, mes, ano] =
            resultado;


        return `${ano}-${mes}-${dia}`;

    }


    /*
     * DD/MM
     * DD-MM
     */
    resultado =
        valor.match(
            /^(\d{2})\/(\d{2})$/
        );


    if (resultado) {

        const [, dia, mes] =
            resultado;


        const ano =
            anoReferencia ||
            new Date().getFullYear();


        return `${ano}-${mes}-${dia}`;

    }


    return "";

}


function limparTexto(
    texto
) {

    return String(
        texto || ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/*
 * Reconstrói as linhas usando a posição
 * vertical do texto dentro da página.
 */
async function extrairLinhasPagina(
    pagina
) {

    const conteudo =
        await pagina.getTextContent();


    const grupos =
        new Map();


    for (
        const item
        of conteudo.items
    ) {

        const texto =
            limparTexto(
                item.str
            );


        if (!texto) {
            continue;
        }


        const y =
            Math.round(
                item.transform?.[5] || 0
            );


        /*
         * Pequena tolerância porque textos da mesma
         * linha podem vir com Y ligeiramente diferente.
         */
        let chaveEncontrada =
            null;


        for (
            const chave
            of grupos.keys()
        ) {

            if (
                Math.abs(
                    chave - y
                ) <= 2
            ) {

                chaveEncontrada =
                    chave;

                break;

            }

        }


        const chave =
            chaveEncontrada ??
            y;


        if (
            !grupos.has(chave)
        ) {

            grupos.set(
                chave,
                []
            );

        }


        grupos
            .get(chave)
            .push({

                x:
                    item.transform?.[4] ||
                    0,

                texto

            });

    }


    /*
     * PDF usa coordenada Y de baixo para cima.
     * Por isso ordenamos de forma decrescente.
     */
    return [
        ...grupos.entries()
    ]
        .sort(
            (a, b) =>
                b[0] - a[0]
        )
        .map(
            ([, itens]) =>

                itens
                    .sort(
                        (a, b) =>
                            a.x - b.x
                    )
                    .map(
                        (item) =>
                            item.texto
                    )
                    .join(" ")

        )
        .map(limparTexto)
        .filter(Boolean);

}


function localizarAno(
    linhas
) {

    const texto =
        linhas.join(" ");


    /*
     * DD/MM/YYYY
     * DD-MM-YYYY
     */
    const datas =
        [
            ...texto.matchAll(
                /\b\d{2}[\/-]\d{2}[\/-](20\d{2})\b/g
            )
        ];


    if (
        datas.length > 0
    ) {

        return Number(
            datas[0][1]
        );

    }


    const ano =
        texto.match(
            /\b(20\d{2})\b/
        );


    return ano
        ? Number(ano[1])
        : new Date().getFullYear();

}


/*
 * Detecta valores comuns em extratos brasileiros:
 *
 * 100,00
 * 1.234,56
 * -100,00
 * 100,00 D
 * 100,00 C
 */
function encontrarValores(
    linha
) {

    const regex =
        /R\$\s*-?\s*\d{1,3}(?:\.\d{3})*,\d{2}\s*[CD]?|R\$\s*-?\s*\d+,\d{2}\s*[CD]?|-?\s*\d{1,3}(?:\.\d{3})*,\d{2}\s*[CD]?|-?\s*\d+,\d{2}\s*[CD]?/gi;


    return [
        ...linha.matchAll(regex)
    ].map(
        (resultado) => ({
            texto:
                resultado[0]
                    .trim(),

            index:
                resultado.index
        })
    );

}


function encontrarDataInicio(
    linha
) {

    return linha.match(
        /^\s*(\d{2}[\/-]\d{2}(?:[\/-]\d{4})?)\b/
    );

}


function pareceSaldo(
    descricao
) {

    const texto =
        descricao
            .toLowerCase();


    return (
        texto.includes(
            "saldo anterior"
        ) ||
        texto.includes(
            "saldo do dia"
        ) ||
        texto.includes(
            "saldo atual"
        ) ||
        texto === "saldo" ||
        texto.includes(
            "saldo disponível"
        )
    );

}


function inferirTipoPeloTexto(
    descricao,
    valorOriginal
) {

    if (
        valorOriginal < 0
    ) {
        return "despesa";
    }


    const texto =
        descricao
            .toLowerCase();


    const palavrasReceita = [

        "pix recebido",
        "transferência recebida",
        "transferencia recebida",
        "depósito",
        "deposito",
        "crédito",
        "credito recebido",
        "recebimento",
        "salário",
        "salario"

    ];


    const palavrasDespesa = [

        "pix enviado",
        "pix realizado",
        "pagamento",
        "compra",
        "débito",
        "debito",
        "boleto",
        "saque",
        "tarifa"

    ];


    if (
        palavrasReceita.some(
            (palavra) =>
                texto.includes(
                    palavra
                )
        )
    ) {

        return "receita";

    }


    if (
        palavrasDespesa.some(
            (palavra) =>
                texto.includes(
                    palavra
                )
        )
    ) {

        return "despesa";

    }


    /*
     * Valor positivo sem outro indício:
     * inicialmente tratamos como receita,
     * mas o usuário poderá revisar.
     */
    return "receita";

}


function transformarLinhasEmTransacoes(
    linhas,
    anoReferencia
) {

    const transacoes = [];


    for (
        let indice = 0;
        indice < linhas.length;
        indice++
    ) {

        let linha =
            linhas[indice];


        const dataEncontrada =
            encontrarDataInicio(
                linha
            );


        if (
            !dataEncontrada
        ) {
            continue;
        }


        const dataTexto =
            dataEncontrada[1];


        /*
         * Alguns PDFs quebram uma movimentação
         * em duas linhas.
         *
         * Se a primeira linha tem data mas não valor,
         * tentamos juntar com a próxima.
         */
        let valores =
            encontrarValores(
                linha
            );


        if (
            valores.length === 0 &&
            linhas[indice + 1]
        ) {

            const proxima =
                linhas[
                indice + 1
                ];


            if (
                !encontrarDataInicio(
                    proxima
                )
            ) {

                linha =
                    `${linha} ${proxima}`;


                valores =
                    encontrarValores(
                        linha
                    );


                if (
                    valores.length > 0
                ) {

                    indice++;

                }

            }

        }


        if (
            valores.length === 0
        ) {
            continue;
        }


        /*
         * Normalmente o último valor da linha
         * é o lançamento.
         *
         * Em alguns bancos existe uma coluna
         * de saldo. Por enquanto a revisão
         * do usuário continuará disponível.
         */
        const valorEncontrado =
            valores[
            valores.length - 1
            ];


        const valorOriginal =
            converterValorBrasileiro(
                valorEncontrado.texto
            );


        if (
            valorOriginal === null ||
            valorOriginal === 0
        ) {
            continue;
        }


        let descricao =
            linha
                .substring(
                    dataEncontrada[0]
                        .length,
                    valorEncontrado.index
                );


        descricao =
            descricao
                .replace(
                    /^\s*\d{2}:\d{2}:\d{2}\s*/,
                    ""
                );


        descricao =
            limparTexto(
                descricao
            );


        if (
            !descricao ||
            pareceSaldo(
                descricao
            )
        ) {
            continue;
        }


        const data =
            normalizarData(
                dataTexto,
                anoReferencia
            );


        if (!data) {
            continue;
        }


        const tipo =
            inferirTipoPeloTexto(
                descricao,
                valorOriginal
            );


        transacoes.push({

            chave:
                `pdf-${indice}-${data}-${Math.abs(
                    valorOriginal
                )}`,

            identificadorExterno:
                null,

            data,

            descricaoOriginal:
                descricao,

            descricao,

            valor:
                Math.abs(
                    valorOriginal
                ),

            tipo,

            categoriaId:
                "",

            selecionado:
                true,

            duplicado:
                false,

            dadosOriginais: {

                origem:
                    "pdf",

                linha:
                    linha

            }

        });

    }


    return transacoes;

}


export async function parsePdfExtrato(
    arquivo
) {

    if (!arquivo) {
        throw new Error(
            "Arquivo PDF não informado."
        );
    }


    const buffer =
        await arquivo.arrayBuffer();


    const documento =
        await pdfjsLib
            .getDocument({
                data:
                    new Uint8Array(
                        buffer
                    )
            })
            .promise;


    const linhas = [];


    for (
        let numeroPagina = 1;
        numeroPagina <=
        documento.numPages;
        numeroPagina++
    ) {

        const pagina =
            await documento.getPage(
                numeroPagina
            );


        const linhasPagina =
            await extrairLinhasPagina(
                pagina
            );


        linhas.push(
            ...linhasPagina
        );

    }


    if (
        linhas.length === 0
    ) {

        throw new Error(
            "Não foi possível encontrar texto neste PDF. Ele pode ser um documento digitalizado como imagem."
        );

    }


    const anoReferencia =
        localizarAno(
            linhas
        );


    const transacoes =
        transformarLinhasEmTransacoes(
            linhas,
            anoReferencia
        );


    if (
        transacoes.length === 0
    ) {

        throw new Error(
            "O PDF foi lido, mas não foi possível identificar movimentações automaticamente."
        );

    }


    return {
        transacoes,
        linhas,
        paginas:
            documento.numPages
    };

}