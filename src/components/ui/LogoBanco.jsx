import { Landmark } from "lucide-react";
import { banks } from "react-bancos";

const aliases = {
    banco_do_brasil: "bancodobrasil",
    bb: "bancodobrasil",

    c6: "c6bank",

    banco_inter: "inter",

    mercado_pago: "mercadopago",

    pag_bank: "pagbank",
    pagseguro: "pagbank",

    banco_pan: "pan",
};

function normalizar(valor) {

    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

}

export function buscarBanco(banco) {

    const chave = normalizar(banco);

    if (!chave) {
        return null;
    }

    const slug =
        aliases[chave] ||
        chave.replaceAll("_", "");

    return (
        banks.find(
            (item) => item.slug === slug
        ) || null
    );

}

export function obterCorBanco(banco) {

    const encontrado = buscarBanco(banco);

    if (encontrado?.color) {
        return encontrado.color;
    }

    // Exceções que ainda não existem no react-bancos
    if (normalizar(banco) === "shopee") {
        return "#EE4D2D";
    }

    return "#3BC9DB";

}

export default function LogoBanco({
    banco,
    size = 48,
    radius = 12,
}) {

    const encontrado = buscarBanco(banco);

    if (encontrado?.Icon) {

        const IconeBanco = encontrado.Icon;

        return (
            <IconeBanco
                size={size}
                radius={radius}
                title={encontrado.name}
            />
        );

    }

    return (

        <div
            title={banco || "Instituição financeira"}
            style={{
                width: size,
                height: size,
                minWidth: size,
                borderRadius: radius,
                background: obterCorBanco(banco),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
            }}
        >
            <Landmark size={22} />
        </div>

    );

}