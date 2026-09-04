import { useState } from "react";

import {

    MoreVertical,
    Pencil,
    Trash2
} from "lucide-react";

import "./ItemMovimentacao.css";

import IconeCategoria from "./IconeCategoria";
import LogoBanco from "./LogoBanco";

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {

        style: "currency",
        currency: "BRL"

    });

}

function corComTransparencia(cor, alpha = 0.12) {

    const valor = String(cor || "")
        .replace("#", "");

    if (!/^[0-9a-fA-F]{6}$/.test(valor)) {

        return `rgba(100, 116, 139, ${alpha})`;

    }

    const r = parseInt(
        valor.substring(0, 2),
        16
    );

    const g = parseInt(
        valor.substring(2, 4),
        16
    );

    const b = parseInt(
        valor.substring(4, 6),
        16
    );

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;

}

export default function ItemMovimentacao({
    movimentacao,
    onEditar,
    onExcluir
}) {

    const [menuAberto, setMenuAberto] = useState(false);

    const receita =
        movimentacao?.tipo === "receita";

    const prevista =
        Boolean(
            movimentacao?.prevista
        );

    function editar() {

        setMenuAberto(false);

        if (onEditar) {
            onEditar();
        }

    }

    function excluir() {

        setMenuAberto(false);

        if (onExcluir) {
            onExcluir();
        }

    }

    return (

        <div className="item-mov">

            <div
                className={`item-icon ${receita
                    ? "receita"
                    : "despesa"
                    }`}
                style={{
                    backgroundColor:
                        corComTransparencia(
                            movimentacao?.categoriaCor ||
                            (
                                receita
                                    ? "#22C55E"
                                    : "#EF4444"
                            )
                        )
                }}
            >

                <IconeCategoria
                    nome={movimentacao?.categoria}
                    icone={movimentacao?.categoriaIcone}
                    cor={movimentacao?.categoriaCor}
                    tipo={movimentacao?.tipo}
                    size={22}
                />

            </div>

            <div className="item-info">

                <h4>
                    {movimentacao?.descricao}
                </h4>

                <div className="item-info-meta">

                    <span>
                        {movimentacao?.categoria}
                    </span>

                    {
                        prevista && (

                            <span className="item-prevista">
                                PREVISTA
                            </span>

                        )
                    }

                </div>

            </div>

            <div
                className="item-conta item-conta-logo"
                title={movimentacao?.conta}
            >

                <LogoBanco
                    banco={movimentacao?.contaBanco}
                    size={38}
                    radius={10}
                />

            </div>

            <div className="item-data">

                {movimentacao?.data}

            </div>

            <div
                className={`item-valor ${receita
                    ? "receita"
                    : "despesa"
                    }`}
            >

                {formatarMoeda(
                    movimentacao?.valor
                )}

            </div>

            <div className="item-menu-container">

                <button
                    type="button"
                    className="item-menu"
                    onClick={() =>
                        setMenuAberto(
                            !menuAberto
                        )
                    }
                >

                    <MoreVertical size={18} />

                </button>

                {
                    menuAberto && (

                        <div className="item-menu-dropdown">

                            <button
                                type="button"
                                className="item-menu-opcao"
                                onClick={editar}
                            >

                                <Pencil size={16} />

                                <span>
                                    Editar
                                </span>

                            </button>

                            <button
                                type="button"
                                className="item-menu-opcao excluir"
                                onClick={excluir}
                            >

                                <Trash2 size={16} />

                                <span>
                                    Excluir
                                </span>

                            </button>

                        </div>

                    )
                }

            </div>

        </div>

    );

}