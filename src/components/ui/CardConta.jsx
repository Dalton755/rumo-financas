import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import "./CardConta.css";

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {

        style: "currency",
        currency: "BRL"

    });

}

const cores = {

    nubank: "#820AD1",
    neon: "#00D8D6",
    santander: "#EC0000",
    bradesco: "#CC092F",
    inter: "#FF7A00",
    caixa: "#0066B3",
    itau: "#FF6200",
    banco_do_brasil: "#F7D117",
    shopee: "#EE4D2D",
    open_finance: "#3BC9DB"

};

export default function CardConta({ conta, onEditar, onExcluir }) {

    const cor = cores[conta.banco] || "#3BC9DB";

    const [menuAberto, setMenuAberto] = useState(false);

    const menuRef = useRef(null);

    useEffect(() => {

        function fecharMenu(e) {

            if (
                menuRef.current &&
                !menuRef.current.contains(e.target)
            ) {

                setMenuAberto(false);

            }

        }

        document.addEventListener(
            "mousedown",
            fecharMenu
        );

        return () => {

            document.removeEventListener(
                "mousedown",
                fecharMenu
            );

        };

    }, []);

    return (

        <div className="card-conta">

            <div
                className="card-conta-faixa"
                style={{ background: cor }}
            />

            <div className="card-conta-topo">

                <div>

                    <h3>

                        {conta.nome}

                    </h3>

                    <span>

                        {conta.tipo}

                    </span>

                </div>

                <button
                    className="card-conta-menu"
                    onClick={() => setMenuAberto(!menuAberto)}
                >
                    <MoreVertical size={18} />
                </button>

                {
                    menuAberto && (

                        <div className="card-dropdown"
                            ref={menuRef}

                        >

                            <button onClick={() => {

                                setMenuAberto(false);

                                onEditar(conta);

                            }}>

                                <span>✏️</span>

                                Editar

                            </button>

                            <button onClick={() => {

                                setMenuAberto(false);

                                onExcluir(conta);

                            }}>

                                <span>🗑</span>

                                Excluir

                            </button>

                        </div>

                    )
                }

            </div>

            <div className="card-conta-saldo">

                {formatarMoeda(
                    conta.saldo_atual ??
                    conta.saldo_inicial
                )}

            </div>

        </div>

    );

}