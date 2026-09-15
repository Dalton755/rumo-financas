import * as pdfjsLib from "pdfjs-dist";

import pdfWorker from
    "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
    createWorker
} from "tesseract.js";

import {
    identificarPartesEspecificas
} from "./comprovantes/identificarFormato";


pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorker;


function limparTexto(texto) {

    return String(
        texto || ""
    )
        .replace(/\s+/g, " ")
        .trim();

}


function converterValorBrasileiro(texto) {

    if (!texto) {
        return null;
    }


    let valor =
        String(texto)
            .trim()
            .replace(/\s/g, "")
            .replace(/^R\$/i, "")
            .replace(/\./g, "")
            .replace(",", ".");


    const numero =
        Number(valor);


    return Number.isNaN(numero)
        ? null
        : numero;

}


function normalizarData(texto) {

    if (!texto) {
        return "";
    }


    const valor =
        String(texto)
            .trim()
            .toUpperCase();


    /*
     * Formatos numéricos:
     * 26/07/2026
     * 26-07-2026
     * 26.07.2026
     */
    let resultado =
        valor.match(
            /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/
        );


    if (resultado) {

        const dia =
            resultado[1]
                .padStart(2, "0");

        const mes =
            resultado[2]
                .padStart(2, "0");

        const ano =
            resultado[3];


        return `${ano}-${mes}-${dia}`;

    }


    /*
     * Formato Nubank:
     * 26 JUL 2026
     */
    resultado =
        valor.match(
            /(\d{1,2})\s+(?:DE\s+)?([A-ZÇ]{3,})\s+(?:DE\s+)?(\d{4})/
        );


    if (!resultado) {
        return "";
    }


    const meses = {

        JAN: "01",
        FEV: "02",
        MAR: "03",
        ABR: "04",
        MAI: "05",
        JUN: "06",
        JUL: "07",
        AGO: "08",
        SET: "09",
        OUT: "10",
        NOV: "11",
        DEZ: "12",

        JANUARY: "01",
        FEBRUARY: "02",
        MARCH: "03",
        APRIL: "04",
        MAY: "05",
        JUNE: "06",
        JULY: "07",
        AUGUST: "08",
        SEPTEMBER: "09",
        OCTOBER: "10",
        NOVEMBER: "11",
        DECEMBER: "12",

        JANEIRO: "01",
        FEVEREIRO: "02",
        MARCO: "03",
        MARÇO: "03",
        ABRIL: "04",
        MAIO: "05",
        JUNHO: "06",
        JULHO: "07",
        AGOSTO: "08",
        SETEMBRO: "09",
        OUTUBRO: "10",
        NOVEMBRO: "11",
        DEZEMBRO: "12",

    };


    const dia =
        resultado[1]
            .padStart(2, "0");


    const mesTexto =
        resultado[2];


    const mes =
        meses[mesTexto];


    const ano =
        resultado[3];


    if (!mes) {
        return "";
    }


    return `${ano}-${mes}-${dia}`;

}


function identificarValor(texto) {

    const resultados =
        [
            ...texto.matchAll(
                /R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?|R\$\s*\d+(?:,\d{2})?/gi
            )
        ];


    if (
        resultados.length === 0
    ) {
        return null;
    }


    /*
     * Em comprovantes geralmente há um
     * valor principal. Por enquanto,
     * usamos o primeiro valor encontrado.
     */
    return converterValorBrasileiro(
        resultados[0][0]
    );

}


function identificarData(
    texto
) {

    /*
     * 1. Prioridade máxima:
     * Data real do débito.
     *
     * Exemplo:
     * Data do débito: 14/07/2026 - 19:55:04
     */
    let resultado =
        texto.match(
            /data\s+do\s+d[eé]bito\s*:\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})/i
        );


    if (resultado?.[1]) {

        return normalizarData(
            resultado[1]
        );

    }


    /*
     * 2. Outras datas explicitamente
     * ligadas à transação.
     */
    resultado =
        texto.match(
            /data\s+(?:da\s+)?transa[cç][aã]o\s*:\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})/i
        );


    if (resultado?.[1]) {

        return normalizarData(
            resultado[1]
        );

    }


    /*
     * 3. Fallback:
     * primeira data numérica encontrada.
     */
    resultado =
        texto.match(
            /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}\b/
        );


    if (resultado) {

        return normalizarData(
            resultado[0]
        );

    }


    /*
     * 4. Datas por extenso:
     * 5 de setembro de 2026
     * 04 set 2026
     */
    resultado =
        texto.match(
            /\b\d{1,2}\s+(?:de\s+)?(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ|JANEIRO|FEVEREIRO|MARÇO|MARCO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\s+(?:de\s+)?\d{4}\b/i
        );


    return resultado
        ? normalizarData(
            resultado[0]
        )
        : "";

}


function identificarTipo(
    texto,
    usuarioNome = ""
) {

    const partes =
        identificarPartes(
            texto
        );

    /*
* Alguns comprovantes não exibem o nome
* do titular, mas o próprio formato permite
* identificar origem e destino com segurança.
*
* Exemplo:
* Mercado Pago - Comprovante de depósito
* NU PAGAMENTOS -> Mercado Pago
*/
    if (
        partes?.transferenciaSemTitular
    ) {

        return "transferencia";

    }


    const usuarioEhOrigem =
        nomesCorrespondem(
            usuarioNome,
            partes.origemNome
        );


    const usuarioEhDestino =
        nomesCorrespondem(
            usuarioNome,
            partes.destinoNome
        );

    /*
     * Se temos o nome do usuário,
     * a prioridade absoluta é Origem/Destino.
     */
    if (usuarioNome) {


        /*
         * Conta própria -> conta própria
         */
        if (
            usuarioEhOrigem &&
            usuarioEhDestino
        ) {

            return "transferencia";

        }


        /*
         * Usuário enviou.
         */
        if (
            usuarioEhOrigem &&
            !usuarioEhDestino
        ) {

            return "despesa";

        }


        /*
         * Usuário recebeu.
         */
        if (
            !usuarioEhOrigem &&
            usuarioEhDestino
        ) {

            return "receita";

        }

    }


    /*
     * Fallback para comprovantes
     * que não possuem Origem/Destino estruturados.
     */
    const t =
        texto.toLowerCase();


    const indiciosDespesa = [

        "pix enviado",
        "transferência enviada",
        "transferencia enviada",
        "pagamento realizado",
        "pagamento efetuado",
        "você pagou",
        "voce pagou",
        "enviado para"

    ];


    const indiciosReceita = [

        "pix recebido",
        "transferência recebida",
        "transferencia recebida",
        "recebido de",
        "valor recebido",
        "crédito recebido",
        "credito recebido"

    ];


    if (
        indiciosReceita.some(
            (item) =>
                t.includes(item)
        )
    ) {

        return "receita";

    }


    if (
        indiciosDespesa.some(
            (item) =>
                t.includes(item)
        )
    ) {

        return "despesa";

    }


    /*
     * Não temos evidência suficiente.
     * Mantemos despesa como fallback,
     * mas o usuário continuará revisando.
     */
    return "despesa";

}

function extrairLinhas(texto) {

    return String(texto || "")
        .split("\n")
        .map(
            (linha) =>
                limparTexto(linha)
        )
        .filter(Boolean);

}


function localizarValorAposRotulo(
    linhas,
    rotulo,
    campo = "Nome"
) {

    const indiceInicio =
        linhas.findIndex(
            (linha) =>
                linha.toLowerCase() ===
                rotulo.toLowerCase()
        );


    if (indiceInicio < 0) {
        return "";
    }


    /*
     * Procura somente dentro de um pequeno
     * bloco depois de Origem/Destino.
     */
    const limite =
        Math.min(
            indiceInicio + 12,
            linhas.length
        );


    for (
        let i = indiceInicio + 1;
        i < limite;
        i++
    ) {

        if (
            linhas[i]
                .toLowerCase() ===
            campo.toLowerCase()
        ) {

            return linhas[i + 1] || "";

        }

    }


    return "";

}





function identificarPartes(
    texto
) {

    /*
     * Primeiro tentamos os formatos
     * específicos conhecidos.
     */
    const partesEspecificas =
        identificarPartesEspecificas(
            texto
        );


    if (
        partesEspecificas
    ) {

        return partesEspecificas;

    }


    /*
     * Fallback genérico.
     *
     * Usado para bancos que seguem
     * estruturas semelhantes a:
     *
     * Origem
     * Nome
     * ...
     *
     * Destino
     * Nome
     * ...
     */
    const linhas =
        extrairLinhas(
            texto
        );


    return {

        formato:
            "generico",

        origemNome:
            localizarValorAposRotulo(
                linhas,
                "Origem",
                "Nome"
            ),

        destinoNome:
            localizarValorAposRotulo(
                linhas,
                "Destino",
                "Nome"
            ),

        origemInstituicao:
            localizarValorAposRotulo(
                linhas,
                "Origem",
                "Instituição"
            ),

        destinoInstituicao:
            localizarValorAposRotulo(
                linhas,
                "Destino",
                "Instituição"
            )

    };

}

function identificarDescricaoOriginal(
    texto
) {

    const textoOriginal =
        String(texto || "");


    const padroes = [

        /descri[cç][aã]o\s*[:\-]?\s*([^\r\n]+)/i,

        /observa[cç][aã]o\s*[:\-]?\s*([^\r\n]+)/i,

        /mensagem\s*[:\-]?\s*([^\r\n]+)/i,

        /motivo\s*[:\-]?\s*([^\r\n]+)/i,

        /informa[cç][oõ]es?\s+adicionais?\s*[:\-]?\s*([^\r\n]+)/i,

        /refer[eê]ncia\s*[:\-]?\s*([^\r\n]+)/i

    ];


    for (
        const padrao of padroes
    ) {

        const resultado =
            textoOriginal.match(
                padrao
            );


        const valor =
            resultado?.[1]
                ?.trim();


        if (
            valor &&
            valor.length >= 3
        ) {

            return valor;

        }

    }


    return "";

}


function identificarObservacaoOriginal(
    texto
) {

    const textoOriginal =
        String(texto || "");


    const resultado =
        textoOriginal.match(
            /observa[cç][aã]o\s*[:\-]?\s*([^\r\n]+)/i
        );


    return (
        resultado?.[1] || ""
    ).trim();

}


function identificarDescricao(
    texto,
    tipo
) {

    const partes =
        identificarPartes(
            texto
        );


    if (
        tipo === "transferencia"
    ) {

        return partes.destinoInstituicao
            ? `Transferência para ${partes.destinoInstituicao}`
            : "Transferência entre contas";

    }


    if (
        tipo === "receita"
    ) {

        if (
            partes.origemNome
        ) {

            return `Pix recebido de ${partes.origemNome}`;

        }


        return "Recebimento importado";

    }


    if (
        tipo === "despesa"
    ) {

        if (
            partes.destinoNome
        ) {

            return `Pix para ${partes.destinoNome}`;

        }


        return "Pagamento importado";

    }


    return "Movimentação importada";

}

function normalizarNomePessoa(
    nome
) {

    return String(nome || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-zA-Z0-9\s]/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim()
        .toLowerCase();

}


function nomesCorrespondem(
    nomeA,
    nomeB
) {

    const a =
        normalizarNomePessoa(
            nomeA
        );


    const b =
        normalizarNomePessoa(
            nomeB
        );


    if (
        !a ||
        !b
    ) {
        return false;
    }


    /*
     * Nome completo exatamente igual.
     */
    if (
        a === b
    ) {
        return true;
    }


    const palavrasA =
        a.split(" ")
            .filter(Boolean);


    const palavrasB =
        b.split(" ")
            .filter(Boolean);


    /*
     * Exemplo:
     *
     * metadata:
     * Dalton
     *
     * comprovante:
     * Dalton Rocha da Silva
     */
    if (
        palavrasA.length === 1
    ) {

        return (
            palavrasB[0] ===
            palavrasA[0]
        );

    }


    if (
        palavrasB.length === 1
    ) {

        return (
            palavrasA[0] ===
            palavrasB[0]
        );

    }


    /*
     * Quando temos mais de uma palavra,
     * exige que todas as palavras do nome
     * menor existam no nome maior.
     */
    const menor =
        palavrasA.length <=
            palavrasB.length
            ? palavrasA
            : palavrasB;


    const maior =
        palavrasA.length <=
            palavrasB.length
            ? palavrasB
            : palavrasA;


    return menor.every(
        (palavra) =>
            maior.includes(
                palavra
            )
    );

}


function pareceTransferenciaPropria(
    texto
) {

    const partes =
        identificarPartes(
            texto
        );


    if (
        !partes.origemNome ||
        !partes.destinoNome
    ) {
        return false;
    }


    return (
        normalizarNomePessoa(
            partes.origemNome
        ) ===
        normalizarNomePessoa(
            partes.destinoNome
        )
    );

}

async function extrairTextoPdfPorOcr(
    arquivo
) {

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


    const worker =
        await createWorker(
            "por"
        );


    const partes = [];


    try {

        for (
            let numeroPagina = 1;
            numeroPagina <= documento.numPages;
            numeroPagina++
        ) {

            const pagina =
                await documento.getPage(
                    numeroPagina
                );


            /*
             * Escala maior melhora bastante
             * a leitura de comprovantes.
             */
            const viewport =
                pagina.getViewport({
                    scale: 2.5
                });


            const canvas =
                document.createElement(
                    "canvas"
                );


            const contexto =
                canvas.getContext(
                    "2d"
                );


            canvas.width =
                Math.ceil(
                    viewport.width
                );

            canvas.height =
                Math.ceil(
                    viewport.height
                );


            await pagina.render({
                canvasContext:
                    contexto,

                viewport
            }).promise;


            const {
                data: {
                    text
                }
            } =
                await worker.recognize(
                    canvas
                );


            console.log(
                `[IMPORTADOR OCR] Página ${numeroPagina}:`,
                text
            );


            partes.push(
                text || ""
            );

        }

    } finally {

        await worker.terminate();

    }


    return partes.join(
        "\n"
    );

}

async function prepararImagemParaOcr(
    arquivo
) {

    const bitmap =
        await createImageBitmap(
            arquivo
        );


    /*
     * Aumentamos a imagem.
     * Isso ajuda bastante em comprovantes
     * recebidos pelo WhatsApp.
     */
    const escala =
        bitmap.width < 1800
            ? 2.5
            : 1.5;


    const canvas =
        document.createElement(
            "canvas"
        );


    const contexto =
        canvas.getContext(
            "2d"
        );


    canvas.width =
        Math.round(
            bitmap.width *
            escala
        );


    canvas.height =
        Math.round(
            bitmap.height *
            escala
        );


    contexto.drawImage(
        bitmap,
        0,
        0,
        canvas.width,
        canvas.height
    );


    const imagem =
        contexto.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );


    const pixels =
        imagem.data;


    /*
     * Pré-processamento:
     *
     * 1. escala de cinza
     * 2. contraste
     * 3. fundo mais branco
     */
    for (
        let i = 0;
        i < pixels.length;
        i += 4
    ) {

        const r =
            pixels[i];

        const g =
            pixels[i + 1];

        const b =
            pixels[i + 2];


        /*
         * luminância perceptual
         */
        let cinza =
            (
                0.299 * r +
                0.587 * g +
                0.114 * b
            );


        /*
         * aumenta contraste
         */
        cinza =
            (
                cinza - 128
            ) * 1.45 + 128;


        /*
         * limita entre 0 e 255
         */
        cinza =
            Math.max(
                0,
                Math.min(
                    255,
                    cinza
                )
            );


        pixels[i] =
            cinza;

        pixels[i + 1] =
            cinza;

        pixels[i + 2] =
            cinza;

    }


    contexto.putImageData(
        imagem,
        0,
        0
    );


    return canvas;

}


async function extrairTextoImagemPorOcr(
    arquivo
) {

    const worker =
        await createWorker(
            "por"
        );


    try {

        const imagemPreparada =
            await prepararImagemParaOcr(
                arquivo
            );


        const {
            data: {
                text
            }
        } =
            await worker.recognize(
                imagemPreparada
            );


        console.log(
            "[IMPORTADOR OCR] Imagem:",
            text
        );


        return text || "";

    } finally {

        await worker.terminate();

    }

}


async function extrairTextoPdf(
    arquivo
) {

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


    const partes = [];


    for (
        let numeroPagina = 1;
        numeroPagina <= documento.numPages;
        numeroPagina++
    ) {

        const pagina =
            await documento.getPage(
                numeroPagina
            );


        const conteudo =
            await pagina.getTextContent();


        const textoPagina =
            conteudo.items
                .map(
                    (item) =>
                        item.str
                )
                .join("\n");


        partes.push(
            textoPagina
        );

    }


    return partes.join("\n");

}

function avaliarConfiancaImportacao({
    tipo,
    valor,
    data,
    partes,
    usuarioNome
}) {

    let pontos = 0;


    const detalhes = {

        tipo:
            false,

        valor:
            false,

        data:
            false,

        origem:
            false,

        destino:
            false,

        formatoConhecido:
            false,

        titularOrigem:
            false,

        titularDestino:
            false

    };


    /*
     * VALOR
     */
    if (
        valor !== null &&
        Number(valor) > 0
    ) {

        pontos += 25;

        detalhes.valor =
            true;

    }


    /*
     * DATA
     */
    if (data) {

        pontos += 20;

        detalhes.data =
            true;

    }


    /*
     * ORIGEM
     */
    if (
        partes?.origemNome ||
        partes?.origemInstituicao
    ) {

        pontos += 10;

        detalhes.origem =
            true;

    }


    /*
     * DESTINO
     */
    if (
        partes?.destinoNome ||
        partes?.destinoInstituicao
    ) {

        pontos += 10;

        detalhes.destino =
            true;

    }


    /*
     * FORMATO ESPECÍFICO OU SEMÂNTICO
     */
    if (
        partes?.formato &&
        partes.formato !== "generico"
    ) {

        pontos += 15;

        detalhes.formatoConhecido =
            true;

    }


    /*
     * VALIDAÇÃO DO TITULAR
     */
    const usuarioEhOrigem =
        nomesCorrespondem(
            usuarioNome,
            partes?.origemNome
        );


    const usuarioEhDestino =
        nomesCorrespondem(
            usuarioNome,
            partes?.destinoNome
        );


    if (
        usuarioEhOrigem
    ) {

        pontos += 10;

        detalhes.titularOrigem =
            true;

    }


    if (
        usuarioEhDestino
    ) {

        pontos += 10;

        detalhes.titularDestino =
            true;

    }


    /*
     * O tipo só é considerado confiável
     * quando há evidência compatível.
     */
    let tipoConfiavel =
        false;


    if (
        tipo === "transferencia" &&
        (
            (
                usuarioEhOrigem &&
                usuarioEhDestino
            ) ||
            partes?.transferenciaSemTitular
        )
    ) {

        tipoConfiavel =
            true;

    }


    if (
        tipo === "despesa" &&
        usuarioEhOrigem &&
        !usuarioEhDestino
    ) {

        tipoConfiavel =
            true;

    }


    if (
        tipo === "receita" &&
        !usuarioEhOrigem &&
        usuarioEhDestino
    ) {

        tipoConfiavel =
            true;

    }


    if (
        tipoConfiavel
    ) {

        pontos += 10;

        detalhes.tipo =
            true;

    }


    const percentual =
        Math.min(
            100,
            Math.round(
                pontos
            )
        );


    let nivel =
        "baixa";


    const camposEssenciaisCompletos =
        Boolean(
            detalhes.tipo &&
            detalhes.valor &&
            detalhes.data
        );


    const ladosCompletos =
        Boolean(
            detalhes.origem &&
            detalhes.destino
        );


    if (
        percentual >= 85 &&
        camposEssenciaisCompletos &&
        ladosCompletos
    ) {

        nivel =
            "alta";

    } else if (
        percentual >= 60
    ) {

        nivel =
            "media";

    }


    return {

        percentual,

        nivel,

        detalhes

    };

}


export async function parseComprovantePdf(
    arquivo,
    usuarioNome = ""
) {



    if (!arquivo) {
        throw new Error(
            "Arquivo não informado."
        );
    }


    const extensao =
        String(
            arquivo?.name || ""
        )
            .split(".")
            .pop()
            ?.toLowerCase();


    let texto = "";


    if (
        extensao === "jpg" ||
        extensao === "jpeg" ||
        extensao === "png"
    ) {

        console.log(
            "[IMPORTADOR] Imagem identificada. Iniciando OCR..."
        );


        texto =
            await extrairTextoImagemPorOcr(
                arquivo
            );

    } else {

        texto =
            await extrairTextoPdf(
                arquivo
            );


        if (
            !limparTexto(texto)
        ) {

            console.log(
                "[IMPORTADOR] PDF sem camada de texto. Iniciando OCR..."
            );


            texto =
                await extrairTextoPdfPorOcr(
                    arquivo
                );


            console.log(
                "[IMPORTADOR] Texto obtido via OCR:",
                texto
            );

        }

    }


    if (
        !limparTexto(texto)
    ) {

        throw new Error(
            "Não foi possível identificar texto no comprovante."
        );

    }


    const tipo =
        identificarTipo(
            texto,
            usuarioNome
        );


    const valor =
        identificarValor(
            texto
        );


    const data =
        identificarData(
            texto
        );


    const descricao =
        identificarDescricao(
            texto,
            tipo
        );

    const descricaoOriginal =
        identificarDescricaoOriginal(
            texto
        );


    const observacaoOriginal =
        identificarObservacaoOriginal(
            texto
        );

    const partes =
        identificarPartes(
            texto
        );

    const confianca =
        avaliarConfiancaImportacao({
            tipo,
            valor,
            data,
            partes,
            usuarioNome
        });


    const transferenciaPropria =
        tipo === "transferencia";


    return {

        tipo,

        valor,

        data_movimentacao:
            data,

        descricao,

        descricaoOriginal,

        observacaoOriginal,

        confianca,

        observacao:
            transferenciaPropria
                ? "Possível transferência entre contas próprias identificada automaticamente."
                : "Dados identificados automaticamente a partir de comprovante PDF.",

        transferenciaPropria,

        origemNome:
            partes.origemNome,

        destinoNome:
            partes.destinoNome,

        origemInstituicao:
            partes.origemInstituicao,

        destinoInstituicao:
            partes.destinoInstituicao,

        textoOriginal:
            texto

    };

}