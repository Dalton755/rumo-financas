import { useState } from "react";

import {
    ArrowRightLeft,
    MoreHorizontal,
    Pencil,
    Trash2
} from "lucide-react";

import "./ItemMovimentacao.css";

import IconeCategoria from "./IconeCategoria";
import LogoBanco from "./LogoBanco";

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

function corComTransparencia(
    cor,
    alpha = 0.12
) {
    const valor =
        String(cor || "")
            .replace("#", "");

    if (
        !/^[0-9a-fA-F]{6}$/.test(
            valor
        )
    ) {
        return `rgba(100, 116, 139, ${alpha})`;
    }

    const r =
        parseInt(
            valor.substring(0, 2),
            16
        );

    const g =
        parseInt(
            valor.substring(2, 4),
            16
        );

    const b =
        parseInt(
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
    const [menuAberto, setMenuAberto] =
        useState(false);

    const receita =
        movimentacao?.tipo ===
        "receita";

    const transferencia =
        movimentacao?.tipo ===
        "transferencia";

    const prevista =
        Boolean(
            movimentacao?.prevista
        );

    const possuiAcoes =
        Boolean(
            onEditar ||
            onExcluir
        );

    function editar() {
        setMenuAberto(false);
        onEditar?.();
    }

    function excluir() {
        setMenuAberto(false);
        onExcluir?.();
    }

    return (
        <div className="item-mov">
            <div
                className={
                    `item-icon ${transferencia
                        ? "transferencia"
                        : receita
                            ? "receita"
                            : "despesa"
                    }`
                }
                style={{
                    backgroundColor:
                        corComTransparencia(
                            movimentacao?.categoriaCor ||
                            (
                                transferencia
                                    ? "#0F766E"
                                    : receita
                                        ? "#22C55E"
                                        : "#EF4444"
                            )
                        )
                }}
            >
                {
                    transferencia
                        ? (
                            <ArrowRightLeft
                                size={18}
                            />
                        )
                        : (
                            <IconeCategoria
                                nome={
                                    movimentacao?.categoria
                                }
                                icone={
                                    movimentacao?.categoriaIcone
                                }
                                cor={
                                    movimentacao?.categoriaCor
                                }
                                tipo={
                                    movimentacao?.tipo
                                }
                                size={19}
                            />
                        )
                }
            </div>

            <div className="item-info">
                <h4>
                    {movimentacao?.descricao}
                </h4>

                <div className="item-info-meta">
                    <span>
                        {
                            transferencia
                                ? (
                                    movimentacao?.conta &&
                                    movimentacao?.contaDestino
                                        ? `${movimentacao.conta} → ${movimentacao.contaDestino}`
                                        : "Transferência entre contas"
                                )
                                : (
                                    movimentacao?.categoria ||
                                    "Sem categoria"
                                )
                        }
                    </span>

                    {prevista && (
                        <span className="item-prevista">
                            Prevista
                        </span>
                    )}
                </div>
            </div>

            {movimentacao?.conta && (
                <div
                    className="item-conta item-conta-logo"
                    title={
                        movimentacao?.conta
                    }
                >
                    <LogoBanco
                        banco={
                            movimentacao?.contaBanco
                        }
                        size={32}
                        radius={9}
                    />
                </div>
            )}

            <div className="item-data">
                {movimentacao?.data}
            </div>

            <div
                className={
                    `item-valor ${transferencia
                        ? "transferencia"
                        : receita
                            ? "receita"
                            : "despesa"
                    }`
                }
            >
                {
                    transferencia
                        ? "↔ "
                        : receita
                            ? "+"
                            : "-"
                }
                {formatarMoeda(
                    Math.abs(
                        Number(
                            movimentacao?.valor ||
                            0
                        )
                    )
                )}
            </div>

            {possuiAcoes && (
                <div className="item-menu-container">
                    <button
                        type="button"
                        className="item-menu"
                        onClick={() =>
                            setMenuAberto(
                                !menuAberto
                            )
                        }
                        aria-label="Ações da movimentação"
                    >
                        <MoreHorizontal
                            size={18}
                        />
                    </button>

                    {menuAberto && (
                        <div className="item-menu-dropdown">
                            {onEditar && (
                                <button
                                    type="button"
                                    className="item-menu-opcao"
                                    onClick={editar}
                                >
                                    <Pencil
                                        size={15}
                                    />

                                    <span>
                                        Editar
                                    </span>
                                </button>
                            )}

                            {onExcluir && (
                                <button
                                    type="button"
                                    className="item-menu-opcao excluir"
                                    onClick={excluir}
                                >
                                    <Trash2
                                        size={15}
                                    />

                                    <span>
                                        Excluir
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
