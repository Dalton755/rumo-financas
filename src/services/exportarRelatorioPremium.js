function formatarMoeda(valor) {

    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

}


function formatarData(data) {

    if (!data) {
        return "";
    }

    const [
        ano,
        mes,
        dia
    ] =
        String(data)
            .split("-");

    return `${dia}/${mes}/${ano}`;

}


function obterNomeArquivo(extensao) {

    const agora =
        new Date();

    const data =
        agora
            .toISOString()
            .slice(0, 10);

    return `relatorio-rumo-${data}.${extensao}`;

}


function obterPeriodoTexto({
    periodo,
    dataInicio,
    dataFim
}) {

    if (
        periodo === "personalizado" &&
        dataInicio &&
        dataFim
    ) {

        return (
            `${formatarData(dataInicio)} a ` +
            `${formatarData(dataFim)}`
        );

    }


    const periodos = {
        mes: "Este mês",
        "3meses": "Últimos 3 meses",
        "6meses": "Últimos 6 meses",
        ano: "Este ano",
        tudo: "Todo o período"
    };


    return (
        periodos[periodo] ||
        "Período selecionado"
    );

}


function prepararFiltros({
    periodo,
    dataInicio,
    dataFim,
    contaNome,
    categoriaNome
}) {

    return {
        periodo:
            obterPeriodoTexto({
                periodo,
                dataInicio,
                dataFim
            }),

        conta:
            contaNome ||
            "Todas as contas",

        categoria:
            categoriaNome ||
            "Todas as categorias"
    };

}


export async function exportarRelatorioPdf({
    analise,
    periodo,
    dataInicio,
    dataFim,
    contaNome,
    categoriaNome
}) {

    /*
     * Importação dinâmica:
     * essas bibliotecas só entram no navegador
     * quando o usuário realmente exportar.
     */
    const [
        moduloJsPdf,
        moduloAutoTable
    ] =
        await Promise.all([
            import("jspdf"),
            import("jspdf-autotable")
        ]);


    const {
        jsPDF
    } =
        moduloJsPdf;


    const autoTable =
        moduloAutoTable.default;


    const filtros =
        prepararFiltros({
            periodo,
            dataInicio,
            dataFim,
            contaNome,
            categoriaNome
        });


    const doc =
        new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });


    const largura =
        doc.internal
            .pageSize
            .getWidth();


    /*
     * Cabeçalho
     */
    doc.setFillColor(
        34,
        184,
        207
    );

    doc.rect(
        0,
        0,
        largura,
        28,
        "F"
    );


    doc.setTextColor(
        255,
        255,
        255
    );

    doc.setFontSize(20);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Rumo",
        14,
        13
    );


    doc.setFontSize(10);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.text(
        "Relatório Financeiro Premium",
        14,
        20
    );


    doc.setTextColor(
        30,
        41,
        59
    );


    /*
     * Filtros utilizados
     */
    doc.setFontSize(12);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Filtros do relatório",
        14,
        38
    );


    doc.setFontSize(9);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.text(
        `Período: ${filtros.periodo}`,
        14,
        45
    );

    doc.text(
        `Conta: ${filtros.conta}`,
        14,
        50
    );

    doc.text(
        `Categoria: ${filtros.categoria}`,
        14,
        55
    );


    /*
     * Indicadores
     */
    autoTable(
        doc,
        {
            startY: 63,

            head: [[
                "Receitas",
                "Despesas",
                "Resultado",
                "Taxa de economia"
            ]],

            body: [[
                formatarMoeda(
                    analise.receitas
                ),

                formatarMoeda(
                    analise.despesas
                ),

                formatarMoeda(
                    analise.resultado
                ),

                `${Number(
                    analise.taxaEconomia || 0
                ).toLocaleString(
                    "pt-BR",
                    {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1
                    }
                )}%`
            ]],

            theme: "grid",

            headStyles: {
                fillColor: [
                    34,
                    184,
                    207
                ],
                textColor: 255
            }
        }
    );


    let proximoY =
        doc.lastAutoTable.finalY +
        10;


    /*
     * Gastos por categoria
     */
    doc.setFontSize(12);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Gastos por categoria",
        14,
        proximoY
    );


    autoTable(
        doc,
        {
            startY:
                proximoY + 4,

            head: [[
                "Categoria",
                "Valor"
            ]],

            body:
                analise
                    .gastosCategorias
                    .map(
                        (item) => [
                            item.nome,
                            formatarMoeda(
                                item.total
                            )
                        ]
                    ),

            theme: "striped",

            headStyles: {
                fillColor: [
                    51,
                    65,
                    85
                ]
            }
        }
    );


    proximoY =
        doc.lastAutoTable.finalY +
        10;


    /*
     * Gastos por conta
     */
    doc.setFontSize(12);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Gastos por conta",
        14,
        proximoY
    );


    autoTable(
        doc,
        {
            startY:
                proximoY + 4,

            head: [[
                "Conta",
                "Valor"
            ]],

            body:
                analise
                    .gastosContas
                    .map(
                        (item) => [
                            item.nome,
                            formatarMoeda(
                                item.total
                            )
                        ]
                    ),

            theme: "striped",

            headStyles: {
                fillColor: [
                    51,
                    65,
                    85
                ]
            }
        }
    );


    /*
     * Movimentações
     */
    doc.addPage();


    doc.setFontSize(15);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "Movimentações do período",
        14,
        18
    );


    autoTable(
        doc,
        {
            startY: 24,

            head: [[
                "Data",
                "Descrição",
                "Categoria",
                "Conta",
                "Tipo",
                "Valor"
            ]],

            body:
                analise
                    .atual
                    .slice()
                    .sort(
                        (a, b) =>
                            b
                                .data_movimentacao
                                .localeCompare(
                                    a.data_movimentacao
                                )
                    )
                    .map(
                        (item) => [

                            formatarData(
                                item.data_movimentacao
                            ),

                            item.descricao,

                            item
                                .categoria
                                ?.nome ||
                                "Sem categoria",

                            item
                                .conta
                                ?.nome ||
                                "Conta",

                            item.tipo ===
                                "receita"
                                ? "Receita"
                                : "Despesa",

                            formatarMoeda(
                                item.valor
                            )
                        ]
                    ),

            styles: {
                fontSize: 7
            },

            headStyles: {
                fillColor: [
                    34,
                    184,
                    207
                ]
            },

            columnStyles: {
                0: {
                    cellWidth: 20
                },

                1: {
                    cellWidth: 48
                },

                2: {
                    cellWidth: 32
                },

                3: {
                    cellWidth: 27
                },

                4: {
                    cellWidth: 20
                }
            }
        }
    );


    /*
     * Rodapé em todas as páginas
     */
    const totalPaginas =
        doc.getNumberOfPages();


    for (
        let pagina = 1;
        pagina <= totalPaginas;
        pagina++
    ) {

        doc.setPage(
            pagina
        );

        doc.setFontSize(8);

        doc.setTextColor(
            148,
            163,
            184
        );

        doc.text(
            `Rumo · Relatório Premium · Página ${pagina} de ${totalPaginas}`,
            largura / 2,
            290,
            {
                align: "center"
            }
        );

    }


    doc.save(
        obterNomeArquivo(
            "pdf"
        )
    );

}


export async function exportarRelatorioExcel({
    analise,
    periodo,
    dataInicio,
    dataFim,
    contaNome,
    categoriaNome
}) {

    const modulo =
        await import(
            "exceljs"
        );


    const ExcelJS =
        modulo.default ||
        modulo;


    const workbook =
        new ExcelJS.Workbook();


    workbook.creator =
        "Rumo";

    workbook.created =
        new Date();


    const filtros =
        prepararFiltros({
            periodo,
            dataInicio,
            dataFim,
            contaNome,
            categoriaNome
        });


    /*
     * ==================================================
     * ABA 1 — RESUMO
     * ==================================================
     */
    const resumo =
        workbook
            .addWorksheet(
                "Resumo"
            );


    resumo.addRow([
        "Rumo — Relatório Financeiro Premium"
    ]);


    resumo.mergeCells(
        "A1:D1"
    );


    resumo.getCell("A1").font = {
        bold: true,
        size: 18,
        color: {
            argb: "FF0891B2"
        }
    };


    resumo.addRow([]);

    resumo.addRow([
        "Período",
        filtros.periodo
    ]);

    resumo.addRow([
        "Conta",
        filtros.conta
    ]);

    resumo.addRow([
        "Categoria",
        filtros.categoria
    ]);


    resumo.addRow([]);


    resumo.addRow([
        "Indicador",
        "Valor"
    ]);


    resumo.addRow([
        "Receitas",
        Number(
            analise.receitas
        )
    ]);

    resumo.addRow([
        "Despesas",
        Number(
            analise.despesas
        )
    ]);

    resumo.addRow([
        "Resultado",
        Number(
            analise.resultado
        )
    ]);

    resumo.addRow([
        "Taxa de economia",
        Number(
            analise.taxaEconomia || 0
        ) / 100
    ]);


    resumo.getColumn("A").width =
        28;

    resumo.getColumn("B").width =
        30;


    resumo.getCell("A7").font = {
        bold: true
    };

    resumo.getCell("B7").font = {
        bold: true
    };


    resumo.getCell("B8").numFmt =
        '"R$" #,##0.00';

    resumo.getCell("B9").numFmt =
        '"R$" #,##0.00';

    resumo.getCell("B10").numFmt =
        '"R$" #,##0.00';

    resumo.getCell("B11").numFmt =
        "0.0%";


    /*
     * ==================================================
     * ABA 2 — MOVIMENTAÇÕES
     * ==================================================
     */
    const movimentos =
        workbook
            .addWorksheet(
                "Movimentações"
            );


    movimentos.columns = [
        {
            header: "Data",
            key: "data",
            width: 14
        },
        {
            header: "Descrição",
            key: "descricao",
            width: 32
        },
        {
            header: "Categoria",
            key: "categoria",
            width: 24
        },
        {
            header: "Conta",
            key: "conta",
            width: 22
        },
        {
            header: "Tipo",
            key: "tipo",
            width: 14
        },
        {
            header: "Valor",
            key: "valor",
            width: 18
        }
    ];


    analise
        .atual
        .slice()
        .sort(
            (a, b) =>
                b
                    .data_movimentacao
                    .localeCompare(
                        a.data_movimentacao
                    )
        )
        .forEach(
            (item) => {

                movimentos.addRow({
                    data:
                        formatarData(
                            item.data_movimentacao
                        ),

                    descricao:
                        item.descricao,

                    categoria:
                        item
                            .categoria
                            ?.nome ||
                        "Sem categoria",

                    conta:
                        item
                            .conta
                            ?.nome ||
                        "Conta",

                    tipo:
                        item.tipo ===
                            "receita"
                            ? "Receita"
                            : "Despesa",

                    valor:
                        Number(
                            item.valor
                        )
                });

            }
        );


    movimentos
        .getRow(1)
        .font = {
            bold: true,
            color: {
                argb: "FFFFFFFF"
            }
        };


    movimentos
        .getRow(1)
        .fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
                argb: "FF16A3B6"
            }
        };


    movimentos
        .getColumn("valor")
        .numFmt =
        '"R$" #,##0.00';


    movimentos.autoFilter = {
        from: "A1",
        to: "F1"
    };


    movimentos.views = [
        {
            state: "frozen",
            ySplit: 1
        }
    ];


    /*
     * ==================================================
     * ABA 3 — CATEGORIAS
     * ==================================================
     */
    const categorias =
        workbook
            .addWorksheet(
                "Categorias"
            );


    categorias.columns = [
        {
            header: "Categoria",
            key: "categoria",
            width: 30
        },
        {
            header: "Total",
            key: "total",
            width: 20
        },
        {
            header: "% das despesas",
            key: "percentual",
            width: 20
        }
    ];


    analise
        .gastosCategorias
        .forEach(
            (item) => {

                categorias.addRow({
                    categoria:
                        item.nome,

                    total:
                        Number(
                            item.total
                        ),

                    percentual:
                        analise.despesas > 0
                            ? (
                                Number(
                                    item.total
                                ) /
                                analise.despesas
                            )
                            : 0
                });

            }
        );


    categorias
        .getColumn("total")
        .numFmt =
        '"R$" #,##0.00';

    categorias
        .getColumn("percentual")
        .numFmt =
        "0.0%";


    categorias
        .getRow(1)
        .font = {
            bold: true
        };


    /*
     * ==================================================
     * ABA 4 — CONTAS
     * ==================================================
     */
    const contas =
        workbook
            .addWorksheet(
                "Contas"
            );


    contas.columns = [
        {
            header: "Conta",
            key: "conta",
            width: 30
        },
        {
            header: "Total de despesas",
            key: "total",
            width: 22
        },
        {
            header: "% das despesas",
            key: "percentual",
            width: 20
        }
    ];


    analise
        .gastosContas
        .forEach(
            (item) => {

                contas.addRow({
                    conta:
                        item.nome,

                    total:
                        Number(
                            item.total
                        ),

                    percentual:
                        analise.despesas > 0
                            ? (
                                Number(
                                    item.total
                                ) /
                                analise.despesas
                            )
                            : 0
                });

            }
        );


    contas
        .getColumn("total")
        .numFmt =
        '"R$" #,##0.00';

    contas
        .getColumn("percentual")
        .numFmt =
        "0.0%";


    contas
        .getRow(1)
        .font = {
            bold: true
        };


    /*
     * Gera o arquivo
     */
    const buffer =
        await workbook
            .xlsx
            .writeBuffer();


    const blob =
        new Blob(
            [buffer],
            {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;

    link.download =
        obterNomeArquivo(
            "xlsx"
        );


    document.body
        .appendChild(
            link
        );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}