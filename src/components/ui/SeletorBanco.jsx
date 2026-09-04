import { useMemo, useState } from "react";
import {
    Check,
    ChevronDown,
    Search,
} from "lucide-react";
import { banks } from "react-bancos";

import LogoBanco, {
    buscarBanco,
} from "./LogoBanco";

import "./SeletorBanco.css";


const BANCOS_POPULARES = [
    "nubank",
    "caixa",
    "bancodobrasil",
    "itau",
    "bradesco",
    "santander",
    "inter",
    "c6bank",
    "mercadopago",
    "picpay",
    "pagbank",
    "btgpactual",
    "pan",
    "bv",
    "sicoob",
    "sicredi",
    "safra",
    "bmg",
    "agibank",
    "neon",
];


const INSTITUICOES_EXTRAS = new Set([
    "mercadopago",
    "picpay",
    "pagbank",
    "neon",
    "cora",
    "infinitepay",
    "recargapay",
    "99pay",
    "stone",
    "xp",
    "wise",
]);


const INSTITUICOES_MANUAIS = [
    {
        slug: "shopee",
        name: "Shopee",
        compe: null,
    },
];


function normalizar(valor) {

    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


function montarInstituicoes() {

    const mapa = new Map();


    banks.forEach((instituicao) => {

        if (!instituicao?.slug) {
            return;
        }


        /*
         * A biblioteca também possui marcas de cartões,
         * lojas e outros serviços.
         *
         * Aqui mantemos instituições financeiras:
         * - quem possui código COMPE
         * - mais algumas fintechs/carteiras selecionadas
         */

        if (
            instituicao.compe ||
            INSTITUICOES_EXTRAS.has(
                instituicao.slug
            )
        ) {

            mapa.set(
                instituicao.slug,
                instituicao
            );

        }

    });


    INSTITUICOES_MANUAIS.forEach(
        (instituicao) => {

            mapa.set(
                instituicao.slug,
                instituicao
            );

        }
    );


    return Array
        .from(mapa.values())
        .sort((a, b) =>
            a.name.localeCompare(
                b.name,
                "pt-BR"
            )
        );

}


const INSTITUICOES =
    montarInstituicoes();


export default function SeletorBanco({
    banco,
    setBanco,
}) {

    const [aberto, setAberto] =
        useState(false);

    const [busca, setBusca] =
        useState("");


    const bancoBiblioteca =
        buscarBanco(banco);


    const bancoSelecionado =
        bancoBiblioteca ||
        INSTITUICOES.find(
            (item) =>
                item.slug === banco
        ) ||
        {
            slug: banco || "",
            name:
                banco
                    ? banco
                    : "Selecione uma instituição",
            compe: null,
        };


    const populares =
        useMemo(() => {

            return BANCOS_POPULARES
                .map((slug) =>
                    INSTITUICOES.find(
                        (item) =>
                            item.slug === slug
                    )
                )
                .filter(Boolean);

        }, []);


    const resultados =
        useMemo(() => {

            const termo =
                normalizar(busca);


            if (!termo) {
                return INSTITUICOES;
            }


            return INSTITUICOES.filter(
                (instituicao) => {

                    const nome =
                        normalizar(
                            instituicao.name
                        );

                    const slug =
                        normalizar(
                            instituicao.slug
                        );

                    const compe =
                        String(
                            instituicao.compe || ""
                        );


                    return (
                        nome.includes(termo) ||
                        slug.includes(termo) ||
                        compe.includes(termo)
                    );

                }
            );

        }, [busca]);


    function selecionar(
        instituicao
    ) {

        setBanco(
            instituicao.slug
        );

        setBusca("");

        setAberto(false);

    }


    return (

        <div className="seletor-banco">

            <label className="seletor-banco-label">
                Instituição financeira
            </label>


            <button
                type="button"
                className="seletor-banco-selecionado"
                onClick={() =>
                    setAberto(
                        (valor) => !valor
                    )
                }
            >

                <div className="seletor-banco-identidade">

                    <LogoBanco
                        banco={
                            bancoSelecionado.slug
                        }
                        size={44}
                        radius={11}
                    />


                    <div className="seletor-banco-textos">

                        <strong>
                            {
                                bancoSelecionado.name
                            }
                        </strong>

                        {
                            bancoSelecionado.compe && (

                                <small>
                                    Código {
                                        bancoSelecionado.compe
                                    }
                                </small>

                            )
                        }

                    </div>

                </div>


                <ChevronDown
                    size={20}
                    className={
                        aberto
                            ? "seletor-banco-chevron aberto"
                            : "seletor-banco-chevron"
                    }
                />

            </button>


            {
                aberto && (

                    <div className="seletor-banco-painel">

                        <div className="seletor-banco-busca">

                            <Search size={19} />

                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar banco ou instituição..."
                                value={busca}
                                onChange={(e) =>
                                    setBusca(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        {
                            !busca && (

                                <>

                                    <div className="seletor-banco-titulo">
                                        Mais usados
                                    </div>


                                    <div className="seletor-banco-populares">

                                        {
                                            populares.map(
                                                (instituicao) => (

                                                    <button
                                                        type="button"
                                                        key={
                                                            instituicao.slug
                                                        }
                                                        className={
                                                            bancoSelecionado.slug ===
                                                            instituicao.slug
                                                                ? "seletor-banco-popular ativo"
                                                                : "seletor-banco-popular"
                                                        }
                                                        onClick={() =>
                                                            selecionar(
                                                                instituicao
                                                            )
                                                        }
                                                    >

                                                        <LogoBanco
                                                            banco={
                                                                instituicao.slug
                                                            }
                                                            size={38}
                                                            radius={9}
                                                        />

                                                        <span>
                                                            {
                                                                instituicao.name
                                                            }
                                                        </span>

                                                    </button>

                                                )
                                            )
                                        }

                                    </div>

                                </>

                            )
                        }


                        <div className="seletor-banco-titulo">
                            {
                                busca
                                    ? "Resultados"
                                    : "Todas as instituições"
                            }
                        </div>


                        <div className="seletor-banco-lista">

                            {
                                resultados.length === 0 ? (

                                    <div className="seletor-banco-vazio">
                                        Nenhuma instituição encontrada.
                                    </div>

                                ) : (

                                    resultados.map(
                                        (instituicao) => {

                                            const ativo =
                                                bancoSelecionado.slug ===
                                                instituicao.slug;


                                            return (

                                                <button
                                                    type="button"
                                                    key={
                                                        instituicao.slug
                                                    }
                                                    className={
                                                        ativo
                                                            ? "seletor-banco-item ativo"
                                                            : "seletor-banco-item"
                                                    }
                                                    onClick={() =>
                                                        selecionar(
                                                            instituicao
                                                        )
                                                    }
                                                >

                                                    <LogoBanco
                                                        banco={
                                                            instituicao.slug
                                                        }
                                                        size={40}
                                                        radius={10}
                                                    />


                                                    <div className="seletor-banco-item-texto">

                                                        <strong>
                                                            {
                                                                instituicao.name
                                                            }
                                                        </strong>

                                                        {
                                                            instituicao.compe && (

                                                                <small>
                                                                    Código {
                                                                        instituicao.compe
                                                                    }
                                                                </small>

                                                            )
                                                        }

                                                    </div>


                                                    {
                                                        ativo && (
                                                            <Check
                                                                size={19}
                                                            />
                                                        )
                                                    }

                                                </button>

                                            );

                                        }
                                    )

                                )
                            }

                        </div>

                    </div>

                )
            }

        </div>

    );

}