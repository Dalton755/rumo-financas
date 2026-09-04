import {
    Baby,
    Banknote,
    Briefcase,
    Car,
    Church,
    CircleDollarSign,
    Coffee,
    Dumbbell,
    Fuel,
    Gamepad2,
    Gift,
    GraduationCap,
    HeartPulse,
    Home,
    MoreHorizontal,
    PawPrint,
    PiggyBank,
    Plane,
    Receipt,
    Shirt,
    ShoppingBag,
    ShoppingCart,
    Smartphone,
    Utensils,
    Wallet,
    Wifi,
    Wrench,
} from "lucide-react";


const ICONES = {
    baby: Baby,
    banknote: Banknote,
    briefcase: Briefcase,
    car: Car,
    church: Church,
    "circle-dollar-sign": CircleDollarSign,
    coffee: Coffee,
    dumbbell: Dumbbell,
    fuel: Fuel,
    gamepad: Gamepad2,
    gift: Gift,
    education: GraduationCap,
    health: HeartPulse,
    home: Home,
    other: MoreHorizontal,
    pets: PawPrint,
    piggybank: PiggyBank,
    plane: Plane,
    receipt: Receipt,
    shirt: Shirt,
    "shopping-bag": ShoppingBag,
    "shopping-cart": ShoppingCart,
    smartphone: Smartphone,
    utensils: Utensils,
    wallet: Wallet,
    wifi: Wifi,
    wrench: Wrench,
};


export const OPCOES_ICONES_CATEGORIA = [
    { valor: "shopping-cart", rotulo: "Mercado" },
    { valor: "utensils", rotulo: "Alimentação" },
    { valor: "coffee", rotulo: "Café" },
    { valor: "home", rotulo: "Moradia" },
    { valor: "car", rotulo: "Transporte" },
    { valor: "fuel", rotulo: "Combustível" },
    { valor: "health", rotulo: "Saúde" },
    { valor: "education", rotulo: "Educação" },
    { valor: "gamepad", rotulo: "Lazer" },
    { valor: "church", rotulo: "Igreja" },
    { valor: "briefcase", rotulo: "Trabalho" },
    { valor: "banknote", rotulo: "Salário" },
    { valor: "piggybank", rotulo: "Investimento" },
    { valor: "receipt", rotulo: "Contas" },
    { valor: "shopping-bag", rotulo: "Compras" },
    { valor: "gift", rotulo: "Presentes" },
    { valor: "plane", rotulo: "Viagem" },
    { valor: "dumbbell", rotulo: "Academia" },
    { valor: "pets", rotulo: "Pets" },
    { valor: "baby", rotulo: "Filhos" },
    { valor: "smartphone", rotulo: "Celular" },
    { valor: "wifi", rotulo: "Internet" },
    { valor: "shirt", rotulo: "Roupas" },
    { valor: "wrench", rotulo: "Manutenção" },
    { valor: "wallet", rotulo: "Carteira" },
    { valor: "circle-dollar-sign", rotulo: "Dinheiro" },
    { valor: "other", rotulo: "Outros" },
];


export const CORES_CATEGORIA = [
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#84CC16",
    "#22C55E",
    "#14B8A6",
    "#06B6D4",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#A855F7",
    "#EC4899",
];


function normalizar(valor) {

    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


export function obterVisualCategoria({
    nome,
    icone,
    cor,
    tipo,
}) {

    if (icone && ICONES[icone]) {

        return {
            icone,
            cor:
                cor ||
                (
                    tipo === "receita"
                        ? "#22C55E"
                        : "#64748B"
                ),
        };

    }


    const texto = normalizar(nome);


    const regras = [
        {
            termos: ["alimentacao", "restaurante", "comida"],
            icone: "utensils",
            cor: "#F97316",
        },
        {
            termos: ["mercado", "supermercado"],
            icone: "shopping-cart",
            cor: "#22C55E",
        },
        {
            termos: ["combustivel", "gasolina", "posto"],
            icone: "fuel",
            cor: "#F59E0B",
        },
        {
            termos: ["moradia", "aluguel", "casa"],
            icone: "home",
            cor: "#3B82F6",
        },
        {
            termos: ["saude", "farmacia", "medico"],
            icone: "health",
            cor: "#EF4444",
        },
        {
            termos: ["educacao", "escola", "curso", "faculdade"],
            icone: "education",
            cor: "#6366F1",
        },
        {
            termos: ["lazer", "diversao"],
            icone: "gamepad",
            cor: "#8B5CF6",
        },
        {
            termos: ["igreja", "dizimo", "oferta"],
            icone: "church",
            cor: "#A855F7",
        },
        {
            termos: ["transporte", "uber", "99"],
            icone: "car",
            cor: "#06B6D4",
        },
        {
            termos: ["salario"],
            icone: "banknote",
            cor: "#22C55E",
        },
        {
            termos: ["freelance", "comissao", "trabalho"],
            icone: "briefcase",
            cor: "#14B8A6",
        },
        {
            termos: ["cafe"],
            icone: "coffee",
            cor: "#F97316",
        },
        {
            termos: ["compra", "internet"],
            icone: "shopping-bag",
            cor: "#EC4899",
        },
    ];


    const regra = regras.find(
        (item) =>
            item.termos.some(
                (termo) =>
                    texto.includes(termo)
            )
    );


    if (regra) {
        return regra;
    }


    return {
        icone:
            tipo === "receita"
                ? "circle-dollar-sign"
                : "other",

        cor:
            cor ||
            (
                tipo === "receita"
                    ? "#22C55E"
                    : "#64748B"
            ),
    };

}


export default function IconeCategoria({
    nome,
    icone,
    cor,
    tipo,
    size = 22,
}) {

    const visual =
        obterVisualCategoria({
            nome,
            icone,
            cor,
            tipo,
        });


    const Icone =
        ICONES[visual.icone] ||
        MoreHorizontal;


    return (
        <Icone
            size={size}
            color={visual.cor}
            strokeWidth={2}
        />
    );

}