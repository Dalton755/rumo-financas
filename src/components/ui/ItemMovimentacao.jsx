import {
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical
} from "lucide-react";

import "./ItemMovimentacao.css";

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {

        style: "currency",
        currency: "BRL"

    });

}

export default function ItemMovimentacao({ movimentacao }) {

    const receita = movimentacao?.tipo === "receita";

    return (

        <div className="item-mov">

            <div className={`item-icon ${receita ? "receita" : "despesa"}`}>

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

                <span>

                    {movimentacao?.categoria}

                </span>

            </div>

            <div className="item-conta">

                {movimentacao?.conta}

            </div>

            <div className="item-data">

                {movimentacao?.data}

            </div>

            <div
                className={`item-valor ${receita ? "receita" : "despesa"}`}
            >

                {formatarMoeda(movimentacao?.valor)}

            </div>

            <button className="item-menu">

                <MoreVertical size={18} />

            </button>

        </div>

    );

}