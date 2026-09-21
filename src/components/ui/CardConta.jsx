import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    MoreHorizontal,
    Pencil,
    Trash2
} from "lucide-react";

import LogoBanco, {
    obterCorBanco
} from "./LogoBanco";

import "./CardConta.css";

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

export default function CardConta({
    conta,
    onEditar,
    onExcluir
}) {
    const cor =
        obterCorBanco(
            conta.banco
        );

    const [
        menuAberto,
        setMenuAberto
    ] = useState(false);

    const menuRef =
        useRef(null);

    useEffect(() => {
        function fecharMenu(e) {
            if (
                menuRef.current &&
                !menuRef.current
                    .contains(e.target)
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
        <article className="card-conta">
            <div
                className="card-conta-faixa"
                style={{
                    background:
                        cor
                }}
            />

            <div className="card-conta-topo">
                <div className="card-conta-identidade">
                    <LogoBanco
                        banco={
                            conta.banco
                        }
                        size={42}
                        radius={12}
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

                <div
                    className="card-conta-menu-wrap"
                    ref={menuRef}
                >
                    <button
                        type="button"
                        className="card-conta-menu"
                        onClick={() =>
                            setMenuAberto(
                                !menuAberto
                            )
                        }
                        aria-label="Ações da conta"
                    >
                        <MoreHorizontal
                            size={18}
                        />
                    </button>

                    {menuAberto && (
                        <div className="card-dropdown">
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuAberto(
                                        false
                                    );
                                    onEditar(
                                        conta
                                    );
                                }}
                            >
                                <Pencil
                                    size={15}
                                />
                                Editar
                            </button>

                            <button
                                type="button"
                                className="perigo"
                                onClick={() => {
                                    setMenuAberto(
                                        false
                                    );
                                    onExcluir(
                                        conta
                                    );
                                }}
                            >
                                <Trash2
                                    size={15}
                                />
                                Excluir
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card-conta-saldo-label">
                Saldo disponível
            </div>

            <div className="card-conta-saldo">
                {formatarMoeda(
                    conta.saldo_atual ??
                    conta.saldo_inicial
                )}
            </div>
        </article>
    );
}
