import "./ModalNovaMovimentacao.css";
import { useEffect, useState } from "react";
import {
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    CalendarClock,
    Check,
    Repeat2,
    Sparkles,
} from "lucide-react";

import { supabase } from "../../services/supabase";
import {
    editarMovimentacao,
    excluirMovimentacao,
} from "../../services/movimentacoes";
import {
    arquivarCompromisso,
    criarCompromisso,
} from "../../services/compromissos";
import {
    criarDivida,
    criarParcelaPlanoQuitacao,
    excluirDivida,
} from "../../services/dividas";
import { useToast } from "../../context/ToastContext";

import ModalConta from "./ModalConta";
import MoneyCalculatorInput from "./MoneyCalculatorInput";
import IconeCategoria, {
    CORES_CATEGORIA,
    OPCOES_ICONES_CATEGORIA,
} from "./IconeCategoria";

function hojeIso() {
    const hoje = new Date();

    return [
        hoje.getFullYear(),
        String(hoje.getMonth() + 1).padStart(2, "0"),
        String(hoje.getDate()).padStart(2, "0"),
    ].join("-");
}

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function ehCategoriaEmprestimo(categoria) {
    const nome =
        normalizarTexto(categoria?.nome);

    return (
        nome === "emprestimo" ||
        nome === "emprestimos"
    );
}

function adicionarRecorrencia(dataIso, frequencia) {
    if (!dataIso) return "";

    const data = new Date(`${dataIso}T12:00:00`);

    if (Number.isNaN(data.getTime())) {
        return "";
    }

    if (frequencia === "semanal") {
        data.setDate(data.getDate() + 7);
    } else {
        const diaOriginal = data.getDate();

        data.setDate(1);
        data.setMonth(data.getMonth() + 1);

        const ultimoDia =
            new Date(
                data.getFullYear(),
                data.getMonth() + 1,
                0
            ).getDate();

        data.setDate(
            Math.min(
                diaOriginal,
                ultimoDia
            )
        );
    }

    return [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0"),
    ].join("-");
}

const OPCOES_TIPO = [
    {
        valor: "receita",
        titulo: "Recebi dinheiro",
        descricao: "Salário, venda, Pix ou qualquer entrada",
        Icone: ArrowDownLeft,
    },
    {
        valor: "despesa",
        titulo: "Gastei dinheiro",
        descricao: "Conta, compra ou qualquer saída",
        Icone: ArrowUpRight,
    },
    {
        valor: "transferencia",
        titulo: "Transferi dinheiro",
        descricao: "Movimento entre suas próprias contas",
        Icone: ArrowLeftRight,
    },
];

export default function ModalNovaMovimentacao({
    onFechar,
    onSalvou,
    movimentacao = null,
}) {
    const { showToast } = useToast();

    const editando = Boolean(movimentacao?.id);

    const [contas, setContas] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [tipo, setTipo] = useState(
        movimentacao?.tipo || ""
    );
    const [descricao, setDescricao] = useState(
        movimentacao?.descricao || ""
    );
    const [valor, setValor] = useState(
        movimentacao?.valor ?? ""
    );
    const [contaId, setContaId] = useState(
        movimentacao?.conta_id || ""
    );
    const [contaDestinoId, setContaDestinoId] = useState(
        movimentacao?.conta_destino_id || ""
    );
    const [categoriaId, setCategoriaId] = useState(
        movimentacao?.categoria_id || ""
    );
    const [dataMovimento, setDataMovimento] = useState(
        movimentacao?.data_movimentacao || hojeIso()
    );
    const [observacao, setObservacao] = useState(
        movimentacao?.observacao || ""
    );

    const [recorrente, setRecorrente] = useState(false);
    const [frequencia, setFrequencia] = useState("mensal");
    const [
        dataQuitacaoEmprestimo,
        setDataQuitacaoEmprestimo,
    ] = useState("");
    const [salvando, setSalvando] = useState(false);

    const [modalContaAberto, setModalContaAberto] = useState(false);
    const [novaContaNome, setNovaContaNome] = useState("");
    const [novaContaBanco, setNovaContaBanco] = useState("nubank");
    const [novaContaTipo, setNovaContaTipo] = useState("corrente");
    const [novaContaSaldoInicial, setNovaContaSaldoInicial] = useState("0");

    const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);
    const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
    const [novaCategoriaIcone, setNovaCategoriaIcone] =
        useState("shopping-cart");
    const [novaCategoriaCor, setNovaCategoriaCor] =
        useState("#F97316");
    const [salvandoAuxiliar, setSalvandoAuxiliar] = useState(false);

    useEffect(() => {
        carregarContas();
        carregarCategorias();
    }, []);

    function selecionarTipo(proximoTipo) {
        setTipo(proximoTipo);

        if (proximoTipo === "transferencia") {
            setCategoriaId("");
            setRecorrente(false);
        } else {
            setContaDestinoId("");
        }

        if (proximoTipo !== "despesa") {
            setRecorrente(false);
        }

        if (proximoTipo !== "receita") {
            setDataQuitacaoEmprestimo("");
        }
    }

    async function salvarMovimentacao() {
        if (salvando) return;

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            showToast(
                "Erro",
                "Usuário não autenticado.",
                "danger"
            );
            return;
        }

        if (!tipo) {
            showToast(
                "Falta uma informação",
                "Diga ao Rumo o que aconteceu.",
                "danger"
            );
            return;
        }

        if (!descricao.trim()) {
            showToast(
                "Falta uma informação",
                tipo === "receita"
                    ? "Descreva de onde veio esse dinheiro."
                    : tipo === "despesa"
                        ? "Descreva com o que você gastou."
                        : "Descreva a transferência.",
                "danger"
            );
            return;
        }

        if (!valor || Number(valor) <= 0) {
            showToast(
                "Falta uma informação",
                "Informe um valor válido.",
                "danger"
            );
            return;
        }

        if (!contaId) {
            showToast(
                "Falta uma informação",
                tipo === "transferencia"
                    ? "Selecione a conta de origem."
                    : "Selecione a conta usada.",
                "danger"
            );
            return;
        }

        if (
            tipo !== "transferencia" &&
            !categoriaId
        ) {
            showToast(
                "Falta uma informação",
                "Selecione uma categoria.",
                "danger"
            );
            return;
        }

        if (
            tipo === "transferencia" &&
            !contaDestinoId
        ) {
            showToast(
                "Falta uma informação",
                "Selecione a conta de destino.",
                "danger"
            );
            return;
        }

        if (
            tipo === "transferencia" &&
            contaDestinoId === contaId
        ) {
            showToast(
                "Confira as contas",
                "A conta de origem e a conta de destino precisam ser diferentes.",
                "danger"
            );
            return;
        }

        if (!dataMovimento) {
            showToast(
                "Falta uma informação",
                "Informe a data.",
                "danger"
            );
            return;
        }

        if (
            categoriaEmprestimo &&
            !dataQuitacaoEmprestimo
        ) {
            showToast(
                "Quando você vai devolver?",
                "Informe a data prevista para pagar esse empréstimo.",
                "danger"
            );
            return;
        }

        if (
            categoriaEmprestimo &&
            dataQuitacaoEmprestimo <= dataMovimento
        ) {
            showToast(
                "Confira a data",
                "A data de pagamento do empréstimo precisa ser posterior à data em que o dinheiro entrou.",
                "danger"
            );
            return;
        }

        const dados = {
            tipo,
            descricao: descricao.trim(),
            valor: Number(valor),
            conta_id: contaId,
            conta_destino_id:
                tipo === "transferencia"
                    ? contaDestinoId
                    : null,
            categoria_id:
                tipo === "transferencia"
                    ? null
                    : categoriaId,
            data_movimentacao: dataMovimento,
            observacao: observacao.trim() || null,
        };

        let novaMovimentacaoId = null;
        let compromissoCriado = null;
        let dividaCriada = null;
        let persistenciaConcluida = false;

        try {
            setSalvando(true);

            if (editando) {
                await editarMovimentacao(
                    movimentacao.id,
                    dados
                );
            } else {
                const {
                    data: novaMovimentacao,
                    error,
                } = await supabase
                    .schema("rumo")
                    .from("movimentacoes")
                    .insert({
                        usuario_id: user.id,
                        ...dados,
                    })
                    .select("id")
                    .single();

                if (error) {
                    throw error;
                }

                novaMovimentacaoId =
                    novaMovimentacao?.id || null;

                if (
                    tipo === "despesa" &&
                    recorrente
                ) {
                    compromissoCriado =
                        await criarCompromisso({
                            nome: descricao.trim(),
                            categoriaId,
                            contaId,
                            frequencia,
                            dataInicio:
                                adicionarRecorrencia(
                                    dataMovimento,
                                    frequencia
                                ),
                            tipoValor: "fixo",
                            valorPadrao: Number(valor),
                            valorEstimado: null,
                        });
                }

                if (categoriaEmprestimo) {
                    const dataQuitacao =
                        new Date(
                            `${dataQuitacaoEmprestimo}T12:00:00`
                        );

                    dividaCriada =
                        await criarDivida({
                            nome:
                                `Empréstimo - ${descricao.trim()}`,
                            credor:
                                descricao.trim(),
                            valorOriginal:
                                Number(valor),
                            saldoAtual:
                                Number(valor),
                            jurosMensal: 0,
                            parcelaMinima:
                                Number(valor),
                            vencimentoDia:
                                dataQuitacao.getDate(),
                            prioridade: 2,
                        });

                    await criarParcelaPlanoQuitacao(
                        dividaCriada.id,
                        {
                            semanaReferencia:
                                dataQuitacaoEmprestimo,
                            valorPrevisto:
                                Number(valor),
                            valorPago: 0,
                        }
                    );
                }
            }

            persistenciaConcluida = true;

            showToast(
                "Pronto",
                editando
                    ? "Movimentação atualizada."
                    : categoriaEmprestimo
                        ? "Empréstimo recebido. A entrada foi registrada e a dívida futura já entrou no seu planejamento."
                        : tipo === "despesa" && recorrente
                            ? "Despesa salva e próximos pagamentos organizados automaticamente."
                            : "Movimentação salva. O Rumo já atualizou seus números.",
                "success"
            );

            window.dispatchEvent(
                new Event("rumo:dados-atualizados")
            );

            if (onSalvou) {
                await onSalvou();
            }

            onFechar();
        } catch (error) {
            console.error(
                "Erro ao salvar movimentação:",
                error
            );

            /*
             * Evita deixar um cadastro pela metade quando
             * a automação de recorrência falha.
             */
            if (
                !editando &&
                !persistenciaConcluida
            ) {
                if (dividaCriada?.id) {
                    try {
                        await excluirDivida(
                            dividaCriada.id
                        );
                    } catch (erroRollbackDivida) {
                        console.error(
                            "Erro ao desfazer dívida:",
                            erroRollbackDivida
                        );
                    }
                }

                if (compromissoCriado?.id) {
                    try {
                        await arquivarCompromisso(
                            compromissoCriado.id
                        );
                    } catch (erroRollbackCompromisso) {
                        console.error(
                            "Erro ao desfazer compromisso:",
                            erroRollbackCompromisso
                        );
                    }
                }

                if (novaMovimentacaoId) {
                    try {
                        await excluirMovimentacao(
                            novaMovimentacaoId
                        );
                    } catch (erroRollbackMovimentacao) {
                        console.error(
                            "Erro ao desfazer movimentação:",
                            erroRollbackMovimentacao
                        );
                    }
                }
            }

            showToast(
                "Não foi possível concluir",
                error.message ||
                    "Confira os dados e tente novamente.",
                "danger"
            );
        } finally {
            setSalvando(false);
        }
    }

    async function carregarContas() {
        const { data, error } = await supabase
            .schema("rumo")
            .from("contas")
            .select("id,nome")
            .eq("ativo", true)
            .order("nome");

        if (error) {
            console.error(
                "Erro ao carregar contas:",
                error
            );
            setContas([]);
            return;
        }

        setContas(data || []);
    }

    async function carregarCategorias() {
        const { data, error } = await supabase
            .schema("rumo")
            .from("categorias")
            .select("id,nome,tipo,icone,cor")
            .eq("ativo", true)
            .order("nome");

        if (error) {
            console.error(
                "Erro ao carregar categorias:",
                error
            );
            setCategorias([]);
            return;
        }

        setCategorias(data || []);
    }

    function abrirNovaConta() {
        setNovaContaNome("");
        setNovaContaBanco("nubank");
        setNovaContaTipo("corrente");
        setNovaContaSaldoInicial("0");
        setModalContaAberto(true);
    }

    async function salvarNovaConta() {
        if (!novaContaNome.trim()) {
            showToast(
                "Erro",
                "Informe o nome da conta.",
                "danger"
            );
            return;
        }

        try {
            setSalvandoAuxiliar(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error(
                    "Usuário não autenticado."
                );
            }

            const {
                data: novaConta,
                error,
            } = await supabase
                .schema("rumo")
                .from("contas")
                .insert({
                    usuario_id: user.id,
                    nome: novaContaNome.trim(),
                    banco: novaContaBanco,
                    tipo: novaContaTipo,
                    saldo_inicial:
                        Number(novaContaSaldoInicial || 0),
                })
                .select("id,nome")
                .single();

            if (error) throw error;

            await carregarContas();
            setContaId(novaConta.id);
            setModalContaAberto(false);

            showToast(
                "Conta criada",
                `${novaConta.nome} já está selecionada.`,
                "success"
            );
        } catch (error) {
            console.error(
                "Erro ao criar conta pela movimentação:",
                error
            );
            showToast(
                "Erro",
                error.message ||
                    "Não foi possível criar a conta.",
                "danger"
            );
        } finally {
            setSalvandoAuxiliar(false);
        }
    }

    function abrirNovaCategoria() {
        setNovaCategoriaNome("");
        setNovaCategoriaIcone(
            tipo === "receita"
                ? "banknote"
                : "shopping-cart"
        );
        setNovaCategoriaCor(
            tipo === "receita"
                ? "#22C55E"
                : "#F97316"
        );
        setModalCategoriaAberto(true);
    }

    async function salvarNovaCategoria() {
        if (!novaCategoriaNome.trim()) {
            showToast(
                "Erro",
                "Informe o nome da categoria.",
                "danger"
            );
            return;
        }

        try {
            setSalvandoAuxiliar(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error(
                    "Usuário não autenticado."
                );
            }

            const {
                data: novaCategoria,
                error,
            } = await supabase
                .schema("rumo")
                .from("categorias")
                .insert({
                    usuario_id: user.id,
                    nome: novaCategoriaNome.trim(),
                    tipo,
                    icone: novaCategoriaIcone,
                    cor: novaCategoriaCor,
                    ativo: true,
                })
                .select("id,nome,tipo,icone,cor")
                .single();

            if (error) throw error;

            await carregarCategorias();
            setCategoriaId(novaCategoria.id);
            setModalCategoriaAberto(false);

            showToast(
                "Categoria criada",
                `${novaCategoria.nome} já está selecionada.`,
                "success"
            );
        } catch (error) {
            console.error(
                "Erro ao criar categoria pela movimentação:",
                error
            );
            showToast(
                "Erro",
                error.message ||
                    "Não foi possível criar a categoria.",
                "danger"
            );
        } finally {
            setSalvandoAuxiliar(false);
        }
    }

    const categoriaSelecionada =
        categorias.find(
            (categoria) =>
                categoria.id === categoriaId
        ) || null;

    const categoriaEmprestimo =
        tipo === "receita" &&
        ehCategoriaEmprestimo(
            categoriaSelecionada
        );

    const rotuloDescricao =
        categoriaEmprestimo
            ? "De quem você recebeu o empréstimo?"
            : tipo === "receita"
            ? "De onde veio esse dinheiro?"
            : tipo === "despesa"
                ? "Com o que você gastou?"
                : "Qual foi o motivo da transferência?";

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-conta movimentacao-inteligente">
                    <div className="modal-header movimentacao-inteligente-header">
                        <div>
                            <span className="movimentacao-inteligente-eyebrow">
                                <Sparkles size={13} />
                                Cadastro inteligente
                            </span>
                            <h2>
                                {editando
                                    ? "Editar movimentação"
                                    : "O que aconteceu?"}
                            </h2>
                            {!editando && (
                                <p>
                                    Você informa o básico. O Rumo organiza o resto.
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            className="btn-fechar"
                            onClick={onFechar}
                            aria-label="Fechar"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="modal-body">
                        {!editando && (
                            <div className="movimentacao-intencoes">
                                {OPCOES_TIPO.map(
                                    ({
                                        valor: valorTipo,
                                        titulo,
                                        descricao: descricaoTipo,
                                        Icone,
                                    }) => (
                                        <button
                                            type="button"
                                            key={valorTipo}
                                            className={
                                                tipo === valorTipo
                                                    ? "movimentacao-intencao ativo"
                                                    : "movimentacao-intencao"
                                            }
                                            onClick={() =>
                                                selecionarTipo(
                                                    valorTipo
                                                )
                                            }
                                        >
                                            <span>
                                                <Icone size={19} />
                                            </span>
                                            <div>
                                                <strong>
                                                    {titulo}
                                                </strong>
                                                <small>
                                                    {descricaoTipo}
                                                </small>
                                            </div>
                                            {tipo === valorTipo && (
                                                <Check size={16} />
                                            )}
                                        </button>
                                    )
                                )}
                            </div>
                        )}

                        {editando && (
                            <div className="movimentacao-tipo-resumo">
                                {OPCOES_TIPO.map(
                                    ({
                                        valor: valorTipo,
                                        titulo,
                                    }) =>
                                        valorTipo === tipo ? (
                                            <strong key={valorTipo}>
                                                {titulo}
                                            </strong>
                                        ) : null
                                )}
                            </div>
                        )}

                        {tipo && (
                            <>
                                <label className="movimentacao-data-campo">
                                    <span>{rotuloDescricao}</span>
                                    <input
                                        type="text"
                                        autoFocus={!editando}
                                        placeholder={
                                            categoriaEmprestimo
                                                ? "Ex.: Banco, financeira ou pessoa"
                                                : tipo === "receita"
                                                    ? "Ex.: salário, venda, Pix recebido"
                                                : tipo === "despesa"
                                                    ? "Ex.: aluguel, mercado, academia"
                                                    : "Ex.: mandar dinheiro para a poupança"
                                        }
                                        value={descricao}
                                        onChange={(e) =>
                                            setDescricao(
                                                e.target.value
                                            )
                                        }
                                    />
                                </label>

                                <label className="movimentacao-data-campo">
                                    <span>Quanto?</span>
                                    <MoneyCalculatorInput
                                        value={valor}
                                        onChange={setValor}
                                        placeholder="R$ 0,00"
                                        ariaLabel="Valor da movimentação"
                                    />
                                </label>

                                <div className="movimentacao-campo-com-acao">
                                    <select
                                        value={contaId}
                                        onChange={(e) =>
                                            setContaId(
                                                e.target.value
                                            )
                                        }
                                        aria-label={
                                            tipo === "transferencia"
                                                ? "Conta de origem"
                                                : "Conta usada"
                                        }
                                    >
                                        <option value="">
                                            {tipo === "transferencia"
                                                ? "De qual conta saiu?"
                                                : tipo === "receita"
                                                    ? "Em qual conta entrou?"
                                                    : "De qual conta saiu?"}
                                        </option>

                                        {contas.map((conta) => (
                                            <option
                                                key={conta.id}
                                                value={conta.id}
                                            >
                                                {conta.nome}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        className="movimentacao-btn-adicionar"
                                        onClick={abrirNovaConta}
                                    >
                                        + Nova
                                    </button>
                                </div>

                                {tipo === "transferencia" && (
                                    <select
                                        value={contaDestinoId}
                                        onChange={(e) =>
                                            setContaDestinoId(
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="">
                                            Para qual conta foi?
                                        </option>
                                        {contas
                                            .filter(
                                                (conta) =>
                                                    conta.id !== contaId
                                            )
                                            .map((conta) => (
                                                <option
                                                    key={conta.id}
                                                    value={conta.id}
                                                >
                                                    {conta.nome}
                                                </option>
                                            ))}
                                    </select>
                                )}

                                {tipo !== "transferencia" && (
                                    <div className="movimentacao-campo-com-acao">
                                        <select
                                            value={categoriaId}
                                            onChange={(e) => {
                                                const proximaCategoriaId =
                                                    e.target.value;

                                                setCategoriaId(
                                                    proximaCategoriaId
                                                );

                                                const proximaCategoria =
                                                    categorias.find(
                                                        (categoria) =>
                                                            categoria.id ===
                                                            proximaCategoriaId
                                                    );

                                                if (
                                                    !ehCategoriaEmprestimo(
                                                        proximaCategoria
                                                    )
                                                ) {
                                                    setDataQuitacaoEmprestimo(
                                                        ""
                                                    );
                                                }
                                            }}
                                        >
                                            <option value="">
                                                Qual categoria?
                                            </option>

                                            {categorias
                                                .filter(
                                                    (categoria) =>
                                                        categoria.tipo ===
                                                        tipo
                                                )
                                                .map((categoria) => (
                                                    <option
                                                        key={
                                                            categoria.id
                                                        }
                                                        value={
                                                            categoria.id
                                                        }
                                                    >
                                                        {
                                                            categoria.nome
                                                        }
                                                    </option>
                                                ))}
                                        </select>

                                        <button
                                            type="button"
                                            className="movimentacao-btn-adicionar"
                                            onClick={abrirNovaCategoria}
                                        >
                                            + Nova
                                        </button>
                                    </div>
                                )}

                                {categoriaEmprestimo && !editando && (
                                    <section className="movimentacao-motor-inteligente emprestimo">
                                        <div className="movimentacao-motor-head">
                                            <span>
                                                <Sparkles size={18} />
                                            </span>

                                            <div>
                                                <strong>
                                                    O Rumo reconheceu um empréstimo
                                                </strong>
                                                <small>
                                                    Esse dinheiro entra hoje, mas também cria uma obrigação futura.
                                                </small>
                                            </div>
                                        </div>

                                        <label className="movimentacao-data-campo">
                                            <span>
                                                Quando você pretende pagar esse empréstimo?
                                            </span>

                                            <input
                                                type="date"
                                                min={dataMovimento || hojeIso()}
                                                value={dataQuitacaoEmprestimo}
                                                onChange={(e) =>
                                                    setDataQuitacaoEmprestimo(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </label>

                                        {dataQuitacaoEmprestimo && (
                                            <p className="movimentacao-motor-preview">
                                                <CalendarClock size={14} />
                                                O Rumo vai registrar uma dívida de{" "}
                                                <strong>
                                                    {Number(valor || 0).toLocaleString(
                                                        "pt-BR",
                                                        {
                                                            style: "currency",
                                                            currency: "BRL",
                                                        }
                                                    )}
                                                </strong>{" "}
                                                para{" "}
                                                <strong>
                                                    {new Date(
                                                        `${dataQuitacaoEmprestimo}T12:00:00`
                                                    ).toLocaleDateString(
                                                        "pt-BR"
                                                    )}
                                                </strong>
                                                .
                                            </p>
                                        )}
                                    </section>
                                )}

                                <label className="movimentacao-data-campo">
                                    <span>
                                        {tipo === "receita"
                                            ? "Quando recebeu?"
                                            : tipo === "despesa"
                                                ? "Quando pagou?"
                                                : "Quando transferiu?"}
                                    </span>

                                    <input
                                        type="date"
                                        value={dataMovimento}
                                        onChange={(e) =>
                                            setDataMovimento(
                                                e.target.value
                                            )
                                        }
                                    />
                                </label>

                                {!editando &&
                                    tipo === "despesa" && (
                                        <section className="movimentacao-recorrencia">
                                            <div className="movimentacao-recorrencia-head">
                                                <span className="movimentacao-recorrencia-icon">
                                                    <Repeat2 size={18} />
                                                </span>
                                                <div>
                                                    <strong>
                                                        Essa despesa se repete?
                                                    </strong>
                                                    <small>
                                                        Se sim, o Rumo cria os próximos vencimentos sozinho.
                                                    </small>
                                                </div>
                                            </div>

                                            <div className="movimentacao-recorrencia-opcoes">
                                                <button
                                                    type="button"
                                                    className={
                                                        !recorrente
                                                            ? "ativo"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        setRecorrente(
                                                            false
                                                        )
                                                    }
                                                >
                                                    Não, foi só agora
                                                </button>
                                                <button
                                                    type="button"
                                                    className={
                                                        recorrente
                                                            ? "ativo"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        setRecorrente(
                                                            true
                                                        )
                                                    }
                                                >
                                                    Sim, se repete
                                                </button>
                                            </div>

                                            {recorrente && (
                                                <div className="movimentacao-frequencia">
                                                    <span>
                                                        Com que frequência?
                                                    </span>

                                                    <div>
                                                        <button
                                                            type="button"
                                                            className={
                                                                frequencia ===
                                                                "semanal"
                                                                    ? "ativo"
                                                                    : ""
                                                            }
                                                            onClick={() =>
                                                                setFrequencia(
                                                                    "semanal"
                                                                )
                                                            }
                                                        >
                                                            Toda semana
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={
                                                                frequencia ===
                                                                "mensal"
                                                                    ? "ativo"
                                                                    : ""
                                                            }
                                                            onClick={() =>
                                                                setFrequencia(
                                                                    "mensal"
                                                                )
                                                            }
                                                        >
                                                            Todo mês
                                                        </button>
                                                    </div>

                                                    <p>
                                                        <CalendarClock
                                                            size={14}
                                                        />
                                                        Próximo vencimento:{" "}
                                                        <strong>
                                                            {dataMovimento
                                                                ? new Date(
                                                                    `${adicionarRecorrencia(
                                                                        dataMovimento,
                                                                        frequencia
                                                                    )}T12:00:00`
                                                                ).toLocaleDateString(
                                                                    "pt-BR"
                                                                )
                                                                : "defina a data acima"}
                                                        </strong>
                                                    </p>
                                                </div>
                                            )}
                                        </section>
                                    )}

                                <details className="movimentacao-opcional">
                                    <summary>
                                        Adicionar observação
                                    </summary>
                                    <textarea
                                        placeholder="Informações extras (opcional)"
                                        value={observacao}
                                        onChange={(e) =>
                                            setObservacao(
                                                e.target.value
                                            )
                                        }
                                    />
                                </details>
                            </>
                        )}
                    </div>

                    <div className="modal-footer movimentacao-inteligente-footer">
                        <button
                            type="button"
                            className="btn-cancelar"
                            onClick={onFechar}
                            disabled={salvando}
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            className="btn-salvar"
                            onClick={salvarMovimentacao}
                            disabled={salvando || !tipo}
                        >
                            {salvando
                                ? "Organizando..."
                                : editando
                                    ? "Salvar alterações"
                                    : categoriaEmprestimo
                                        ? "Salvar entrada e criar dívida"
                                        : tipo === "despesa" &&
                                            recorrente
                                            ? "Salvar e organizar próximos"
                                            : "Salvar"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="movimentacao-modal-secundario-wrap">
                <ModalConta
                    aberto={modalContaAberto}
                    titulo="Nova Conta"
                    nome={novaContaNome}
                    setNome={setNovaContaNome}
                    banco={novaContaBanco}
                    setBanco={setNovaContaBanco}
                    tipo={novaContaTipo}
                    setTipo={setNovaContaTipo}
                    saldoInicial={novaContaSaldoInicial}
                    setSaldoInicial={setNovaContaSaldoInicial}
                    onSalvar={salvarNovaConta}
                    onFechar={() =>
                        setModalContaAberto(false)
                    }
                />
            </div>

            {modalCategoriaAberto && (
                <div className="modal-overlay movimentacao-modal-secundario">
                    <div className="modal-conta movimentacao-modal-categoria">
                        <div className="modal-header">
                            <h2>Nova Categoria</h2>

                            <button
                                type="button"
                                className="btn-fechar"
                                onClick={() =>
                                    setModalCategoriaAberto(
                                        false
                                    )
                                }
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <input
                                type="text"
                                autoFocus
                                placeholder="Nome da categoria"
                                value={novaCategoriaNome}
                                onChange={(e) =>
                                    setNovaCategoriaNome(
                                        e.target.value
                                    )
                                }
                            />

                            <div className="movimentacao-categoria-opcoes">
                                <label>
                                    Escolha um ícone
                                </label>

                                <div className="movimentacao-categoria-icones">
                                    {OPCOES_ICONES_CATEGORIA.map(
                                        (opcao) => (
                                            <button
                                                type="button"
                                                key={opcao.valor}
                                                title={opcao.rotulo}
                                                className={
                                                    novaCategoriaIcone ===
                                                    opcao.valor
                                                        ? "ativo"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    setNovaCategoriaIcone(
                                                        opcao.valor
                                                    )
                                                }
                                            >
                                                <IconeCategoria
                                                    icone={
                                                        opcao.valor
                                                    }
                                                    cor={
                                                        novaCategoriaCor
                                                    }
                                                    size={22}
                                                />
                                            </button>
                                        )
                                    )}
                                </div>

                                <label>
                                    Escolha uma cor
                                </label>

                                <div className="movimentacao-categoria-cores">
                                    {CORES_CATEGORIA.map(
                                        (cor) => (
                                            <button
                                                type="button"
                                                key={cor}
                                                title={cor}
                                                className={
                                                    novaCategoriaCor ===
                                                    cor
                                                        ? "ativo"
                                                        : ""
                                                }
                                                style={{
                                                    backgroundColor:
                                                        cor,
                                                }}
                                                onClick={() =>
                                                    setNovaCategoriaCor(
                                                        cor
                                                    )
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="movimentacao-categoria-tipo">
                                Essa categoria será criada como:
                                <strong>
                                    {tipo === "receita"
                                        ? " Receita"
                                        : " Despesa"}
                                </strong>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={() =>
                                    setModalCategoriaAberto(
                                        false
                                    )
                                }
                                disabled={salvandoAuxiliar}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="btn-salvar"
                                onClick={
                                    salvarNovaCategoria
                                }
                                disabled={salvandoAuxiliar}
                            >
                                {salvandoAuxiliar
                                    ? "Salvando..."
                                    : "Salvar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
