import { useState } from "react";

import {
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Pencil,
    Trash2
} from "lucide-react";

import "./ItemMovimentacao.css";

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {

        style: "currency",
        currency: "BRL"

    });

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
            >

                {
                    receita

                        ? <ArrowUpRight size={22} />

                        : <ArrowDownRight size={22} />
                }

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

            <div className="item-conta">

                {movimentacao?.conta}

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