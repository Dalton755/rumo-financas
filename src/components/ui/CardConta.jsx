import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import LogoBanco, { obterCorBanco } from "./LogoBanco";
import "./CardConta.css";

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {

        style: "currency",
        currency: "BRL"

    });

}


export default function CardConta({ conta, onEditar, onExcluir }) {

    const cor = obterCorBanco(conta.banco);

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

                <div className="card-conta-identidade">

                    <LogoBanco
                        banco={conta.banco}
                        size={52}
                        radius={14}
                    />

                    <div className="card-conta-dados">

                        <h3>
                            {conta.nome}
                        </h3>

                        <span>
                            {conta.tipo}
                        </span>

                    </div>

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