import "./ModalNovaMovimentacao.css";
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { editarMovimentacao } from "../../services/movimentacoes";
import {
    listarCartoes,
    criarCompraCartao
} from "../../services/cartoes";
import { useToast } from "../../context/ToastContext";
import ModalConta from "./ModalConta";
import IconeCategoria, {
    CORES_CATEGORIA,
    OPCOES_ICONES_CATEGORIA,
} from "./IconeCategoria";

export default function ModalNovaMovimentacao({
    onFechar,
    onSalvou,
    movimentacao = null,
    dadosIniciais = null
}) {

    const { showToast } = useToast();

    const editando = Boolean(movimentacao?.id);

    const dadosBase =
        movimentacao ||
        dadosIniciais ||
        {};

    const [contas, setContas] = useState([]);
    const [cartoes, setCartoes] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [origemPagamento, setOrigemPagamento] =
        useState(
            dadosBase?.conta_id
                ? `conta:${dadosBase.conta_id}`
                : ""
        );

    const [cartaoId, setCartaoId] =
        useState("");

    const [formaCredito, setFormaCredito] =
        useState("avista");

    const [parcelasTotal, setParcelasTotal] =
        useState(1);

    const [tipo, setTipo] = useState(
        dadosBase?.tipo || "receita"
    );

    const [descricao, setDescricao] = useState(
        dadosBase?.descricao || ""
    );

    const [valor, setValor] = useState(
        dadosBase?.valor ?? ""
    );

    const [contaId, setContaId] = useState(
        dadosBase?.conta_id || ""
    );

    const [contaDestinoId, setContaDestinoId] = useState(
        dadosBase?.conta_destino_id || ""
    );

    const [categoriaId, setCategoriaId] = useState(
        dadosBase?.categoria_id || ""
    );

    const [dataMovimento, setDataMovimento] = useState(
        dadosBase?.data_movimentacao || ""
    );

    const [observacao, setObservacao] = useState(
        dadosBase?.observacao || ""
    );

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
        carregarCartoes();
        carregarCategorias();

    }, []);

    function selecionarOrigemPagamento(valorSelecionado) {

        setOrigemPagamento(
            valorSelecionado
        );

        if (
            valorSelecionado.startsWith(
                "conta:"
            )
        ) {

            const id =
                valorSelecionado.replace(
                    "conta:",
                    ""
                );

            setContaId(id);

            setCartaoId("");

            setFormaCredito(
                "avista"
            );

            setParcelasTotal(1);

            return;
        }


        if (
            valorSelecionado.startsWith(
                "cartao:"
            )
        ) {

            const id =
                valorSelecionado.replace(
                    "cartao:",
                    ""
                );

            setCartaoId(id);

            setContaId("");

            return;
        }


        setContaId("");
        setCartaoId("");

    }

    function alterarTipoMovimentacao(
        novoTipo
    ) {

        setTipo(
            novoTipo
        );


        /*
         * Transferência não utiliza categoria
         * nem cartão de crédito.
         */
        if (
            novoTipo === "transferencia"
        ) {

            setCategoriaId("");

            setCartaoId("");

            setFormaCredito(
                "avista"
            );

            setParcelasTotal(
                1
            );


            /*
             * Se a origem atual era um cartão,
             * limpamos a seleção.
             *
             * Se já era uma conta, podemos
             * preservá-la como conta de origem.
             */
            if (
                origemPagamento.startsWith(
                    "cartao:"
                )
            ) {

                setOrigemPagamento("");

                setContaId("");

            }

            return;

        }


        /*
         * Ao sair de transferência,
         * a conta de destino deixa de existir.
         */
        setContaDestinoId("");


        /*
         * Cartão de crédito só pode
         * ser usado para despesas.
         */
        if (
            novoTipo !== "despesa" &&
            cartaoId
        ) {

            setCartaoId("");

            setOrigemPagamento("");

            setFormaCredito(
                "avista"
            );

            setParcelasTotal(
                1
            );

        }

    }

    async function salvarMovimentacao() {

        const {
            data: { user }
        } = await supabase.auth.getUser();

        if (!user) {

            showToast(
                "Erro",
                "Usuário não autenticado.",
                "danger"
            );

            return;
        }

        if (!descricao.trim()) {

            showToast(
                "Erro",
                "Informe a descrição.",
                "danger"
            );

            return;
        }

        if (!valor || Number(valor) <= 0) {

            showToast(
                "Erro",
                "Informe um valor válido.",
                "danger"
            );

            return;
        }

        if (
            tipo === "transferencia"
        ) {

            if (!contaId) {

                showToast(
                    "Erro",
                    "Selecione a conta de origem.",
                    "danger"
                );

                return;

            }


            if (!contaDestinoId) {

                showToast(
                    "Erro",
                    "Selecione a conta de destino.",
                    "danger"
                );

                return;

            }


            if (
                contaId ===
                contaDestinoId
            ) {

                showToast(
                    "Erro",
                    "A conta de origem e a conta de destino devem ser diferentes.",
                    "danger"
                );

                return;

            }

        } else if (
            !contaId &&
            !cartaoId
        ) {

            showToast(
                "Erro",
                "Selecione uma conta ou cartão.",
                "danger"
            );

            return;

        }

        if (
            tipo !== "transferencia" &&
            !categoriaId
        ) {

            showToast(
                "Erro",
                "Selecione uma categoria.",
                "danger"
            );

            return;

        }

        if (!dataMovimento) {

            showToast(
                "Erro",
                "Informe a data.",
                "danger"
            );

            return;
        }

        const compraCredito =
            tipo === "despesa" &&
            Boolean(cartaoId) &&
            !editando;


        if (
            compraCredito &&
            formaCredito === "parcelado" &&
            (
                !parcelasTotal ||
                Number(parcelasTotal) < 2
            )
        ) {

            showToast(
                "Erro",
                "Informe a quantidade de parcelas.",
                "danger"
            );

            return;
        }

        const dados = {

            tipo,

            descricao:
                descricao.trim(),

            valor:
                Number(valor),

            conta_id:
                contaId,

            conta_destino_id:
                tipo === "transferencia"
                    ? contaDestinoId
                    : null,

            categoria_id:
                tipo === "transferencia"
                    ? null
                    : categoriaId,

            data_movimentacao:
                dataMovimento,

            observacao:
                observacao.trim() || null

        };

        try {

            if (compraCredito) {

                const quantidadeParcelas =
                    formaCredito === "parcelado"
                        ? Number(parcelasTotal)
                        : 1;


                await criarCompraCartao({

                    cartaoId,

                    categoriaId,

                    descricao:
                        descricao.trim(),

                    valorTotal:
                        Number(valor),

                    dataCompra:
                        dataMovimento,

                    parcelasTotal:
                        quantidadeParcelas,

                    observacao:
                        observacao.trim()

                });


                showToast(
                    "Compra registrada",
                    quantidadeParcelas > 1
                        ? `Compra registrada em ${quantidadeParcelas} parcelas.`
                        : "Compra no crédito registrada com sucesso.",
                    "success"
                );


                if (onSalvou) {
                    await onSalvou();
                }


                onFechar();

                return;

            }

            if (
                tipo === "transferencia" &&
                !editando
            ) {

                const {
                    error
                } =
                    await supabase
                        .schema("rumo")
                        .rpc(
                            "criar_transferencia",
                            {

                                p_conta_origem_id:
                                    contaId,

                                p_conta_destino_id:
                                    contaDestinoId,

                                p_valor:
                                    Number(valor),

                                p_data_movimentacao:
                                    dataMovimento,

                                p_descricao:
                                    descricao.trim(),

                                p_observacao:
                                    observacao.trim() || null,

                                p_origem:
                                    "manual",

                                p_origem_referencia:
                                    null

                            }
                        );


                if (error) {
                    throw error;
                }

            } else if (editando) {

                await editarMovimentacao(
                    movimentacao.id,
                    dados
                );

            } else {

                const {
                    error
                } =
                    await supabase
                        .schema("rumo")
                        .from("movimentacoes")
                        .insert({

                            usuario_id:
                                user.id,

                            ...dados

                        });


                if (error) {
                    throw error;
                }

            }

            showToast(
                "Sucesso",
                editando
                    ? "Movimentação atualizada com sucesso!"
                    : "Movimentação cadastrada com sucesso!",
                "success"
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

            showToast(
                "Erro",
                error.message || "Não foi possível salvar a movimentação.",
                "danger"
            );

        }

    }

    async function carregarContas() {

        const { data, error } = await supabase
            .schema("rumo")
            .from("contas")
            .select("id,nome,banco,tipo")
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

    async function carregarCartoes() {

        try {

            const dados =
                await listarCartoes();

            setCartoes(
                dados || []
            );

        } catch (error) {

            console.error(
                "Erro ao carregar cartões:",
                error
            );

            setCartoes([]);

        }

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
                data: { user }
            } = await supabase.auth.getUser();

            if (!user) {

                throw new Error(
                    "Usuário não autenticado."
                );

            }

            const {
                data: novaConta,
                error
            } = await supabase
                .schema("rumo")
                .from("contas")
                .insert({
                    usuario_id: user.id,

                    nome: novaContaNome.trim(),

                    banco: novaContaBanco,

                    tipo: novaContaTipo,

                    saldo_inicial:
                        Number(
                            novaContaSaldoInicial || 0
                        )
                })
                .select("id,nome")
                .single();

            if (error) {

                throw error;

            }

            await carregarContas();

            /*
             * Já seleciona automaticamente
             * a conta recém-criada.
             */
            setContaId(novaConta.id);

            setOrigemPagamento(
                `conta:${novaConta.id}`
            );

            setCartaoId("");

            setModalContaAberto(false);

            showToast(
                "Conta criada",
                `${novaConta.nome} foi adicionada e selecionada.`,
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
                data: { user }
            } = await supabase.auth.getUser();

            if (!user) {

                throw new Error(
                    "Usuário não autenticado."
                );

            }

            const {
                data: novaCategoria,
                error
            } = await supabase
                .schema("rumo")
                .from("categorias")
                .insert({
                    usuario_id: user.id,

                    nome:
                        novaCategoriaNome.trim(),

                    /*
                     * A categoria acompanha
                     * automaticamente o tipo
                     * da movimentação atual.
                     */
                    tipo,

                    icone: novaCategoriaIcone,

                    cor: novaCategoriaCor,

                    ativo: true
                })
                .select("id,nome,tipo,icone,cor")
                .single();

            if (error) {

                throw error;

            }

            await carregarCategorias();

            /*
             * Já seleciona automaticamente
             * a categoria recém-criada.
             */
            setCategoriaId(
                novaCategoria.id
            );

            setModalCategoriaAberto(false);

            showToast(
                "Categoria criada",
                `${novaCategoria.nome} foi adicionada e selecionada.`,
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

    return (

        <>

            <div className="modal-overlay">

                <div className="modal-conta">

                    <div className="modal-header">

                        <h2>
                            {
                                editando
                                    ? "Editar Movimentação"
                                    : "Nova Movimentação"
                            }
                        </h2>

                        <button
                            className="btn-fechar"
                            onClick={onFechar}
                        >
                            ✕
                        </button>

                    </div>

                    <div className="modal-body">

                        <select
                            value={tipo}
                            onChange={(e) =>
                                alterarTipoMovimentacao(
                                    e.target.value
                                )
                            }
                        >

                            <option value="receita">
                                Receita
                            </option>

                            <option value="despesa">
                                Despesa
                            </option>

                            <option value="transferencia">
                                Transferência entre contas
                            </option>

                        </select>

                        <input
                            type="text"
                            placeholder="Descrição"
                            value={descricao}
                            onChange={(e) =>
                                setDescricao(e.target.value)
                            }
                        />

                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Valor"
                            value={valor}
                            onChange={(e) =>
                                setValor(e.target.value)
                            }
                        />

                        <div className="movimentacao-campo-com-acao">

                            <select
                                value={origemPagamento}
                                onChange={(e) =>
                                    selecionarOrigemPagamento(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="">
                                    {
                                        tipo === "transferencia"
                                            ? "Selecione a conta de origem"
                                            : "Selecione uma conta ou cartão"
                                    }
                                </option>


                                {contas.length > 0 && (

                                    <optgroup label="Contas">

                                        {contas.map((conta) => (

                                            <option
                                                key={`conta-${conta.id}`}
                                                value={`conta:${conta.id}`}
                                            >
                                                {conta.nome}
                                            </option>

                                        ))}

                                    </optgroup>

                                )}




                                {
                                    tipo === "despesa" &&
                                    !editando &&
                                    cartoes.length > 0 && (

                                        <optgroup label="Cartões de crédito">

                                            {cartoes.map((cartao) => (

                                                <option
                                                    key={`cartao-${cartao.id}`}
                                                    value={`cartao:${cartao.id}`}
                                                >
                                                    {cartao.nome}
                                                    {
                                                        cartao.final_cartao
                                                            ? ` •••• ${cartao.final_cartao}`
                                                            : ""
                                                    }
                                                </option>

                                            ))}

                                        </optgroup>

                                    )
                                }

                            </select>


                            <button
                                type="button"
                                className="movimentacao-btn-adicionar"
                                onClick={abrirNovaConta}
                            >
                                + Nova
                            </button>

                        </div>

                        {
                            tipo === "transferencia" && (

                                <select
                                    value={
                                        contaDestinoId
                                    }
                                    onChange={(e) =>
                                        setContaDestinoId(
                                            e.target.value
                                        )
                                    }
                                >

                                    <option value="">
                                        Selecione a conta de destino
                                    </option>


                                    {
                                        contas
                                            .filter(
                                                (conta) =>
                                                    conta.id !==
                                                    contaId
                                            )
                                            .map(
                                                (conta) => (

                                                    <option
                                                        key={
                                                            `destino-${conta.id}`
                                                        }
                                                        value={
                                                            conta.id
                                                        }
                                                    >
                                                        {conta.nome}
                                                    </option>

                                                )
                                            )
                                    }

                                </select>

                            )
                        }

                        {
                            tipo === "despesa" &&
                            cartaoId &&
                            !editando && (

                                <div className="movimentacao-credito">

                                    <div className="movimentacao-credito-header">

                                        <div>
                                            <strong>
                                                Compra no crédito
                                            </strong>

                                            <span>
                                                Defina como a compra foi realizada.
                                            </span>
                                        </div>

                                    </div>


                                    <div className="movimentacao-credito-forma">

                                        <button
                                            type="button"
                                            className={
                                                formaCredito === "avista"
                                                    ? "ativo"
                                                    : ""
                                            }
                                            onClick={() => {

                                                setFormaCredito(
                                                    "avista"
                                                );

                                                setParcelasTotal(
                                                    1
                                                );

                                            }}
                                        >
                                            À vista
                                        </button>


                                        <button
                                            type="button"
                                            className={
                                                formaCredito === "parcelado"
                                                    ? "ativo"
                                                    : ""
                                            }
                                            onClick={() => {

                                                setFormaCredito(
                                                    "parcelado"
                                                );

                                                if (
                                                    Number(
                                                        parcelasTotal
                                                    ) < 2
                                                ) {
                                                    setParcelasTotal(
                                                        2
                                                    );
                                                }

                                            }}
                                        >
                                            Parcelado
                                        </button>

                                    </div>


                                    {
                                        formaCredito === "parcelado" && (

                                            <label className="movimentacao-credito-parcelas">

                                                <span>
                                                    Quantidade de parcelas
                                                </span>

                                                <select
                                                    value={
                                                        parcelasTotal
                                                    }
                                                    onChange={(e) =>
                                                        setParcelasTotal(
                                                            Number(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                >

                                                    {
                                                        Array.from(
                                                            {
                                                                length: 23
                                                            },
                                                            (_, index) =>
                                                                index + 2
                                                        ).map(
                                                            (quantidade) => (

                                                                <option
                                                                    key={
                                                                        quantidade
                                                                    }
                                                                    value={
                                                                        quantidade
                                                                    }
                                                                >
                                                                    {
                                                                        quantidade
                                                                    }x
                                                                </option>

                                                            )
                                                        )
                                                    }

                                                </select>

                                            </label>

                                        )
                                    }


                                    {
                                        Number(valor) > 0 && (

                                            <div className="movimentacao-credito-resumo">

                                                <span>
                                                    {
                                                        formaCredito === "parcelado"
                                                            ? `${parcelasTotal}x de aproximadamente`
                                                            : "Compra em"
                                                    }
                                                </span>

                                                <strong>

                                                    {
                                                        formaCredito === "parcelado"
                                                            ? (
                                                                Number(valor) /
                                                                Number(
                                                                    parcelasTotal ||
                                                                    1
                                                                )
                                                            ).toLocaleString(
                                                                "pt-BR",
                                                                {
                                                                    style:
                                                                        "currency",
                                                                    currency:
                                                                        "BRL"
                                                                }
                                                            )
                                                            : Number(
                                                                valor
                                                            ).toLocaleString(
                                                                "pt-BR",
                                                                {
                                                                    style:
                                                                        "currency",
                                                                    currency:
                                                                        "BRL"
                                                                }
                                                            )
                                                    }

                                                </strong>

                                            </div>

                                        )
                                    }

                                </div>

                            )
                        }

                        {
                            tipo !== "transferencia" && (

                                <div className="movimentacao-campo-com-acao">

                                    <select
                                        value={categoriaId}
                                        onChange={(e) =>
                                            setCategoriaId(
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="">
                                            Selecione uma categoria
                                        </option>

                                        {
                                            categorias
                                                .filter(
                                                    (categoria) =>
                                                        categoria.tipo ===
                                                        tipo
                                                )
                                                .map(
                                                    (categoria) => (

                                                        <option
                                                            key={
                                                                categoria.id
                                                            }
                                                            value={
                                                                categoria.id
                                                            }
                                                        >
                                                            {categoria.nome}
                                                        </option>

                                                    )
                                                )
                                        }

                                    </select>

                                    <button
                                        type="button"
                                        className="movimentacao-btn-adicionar"
                                        onClick={
                                            abrirNovaCategoria
                                        }
                                    >
                                        + Nova
                                    </button>

                                </div>

                            )
                        }

                        <input
                            type="date"
                            value={dataMovimento}
                            onChange={(e) =>
                                setDataMovimento(e.target.value)
                            }
                        />

                        <textarea
                            placeholder="Observações (opcional)"
                            value={observacao}
                            onChange={(e) =>
                                setObservacao(e.target.value)
                            }
                        />

                    </div>

                    <div className="modal-footer">

                        <button
                            className="btn-cancelar"
                            onClick={onFechar}
                        >
                            Cancelar
                        </button>

                        <button
                            className="btn-salvar"
                            onClick={salvarMovimentacao}
                        >
                            {
                                editando
                                    ? "Salvar alterações"
                                    : "Salvar"
                            }
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


            {
                modalCategoriaAberto && (

                    <div className="modal-overlay movimentacao-modal-secundario">

                        <div className="modal-conta movimentacao-modal-categoria">

                            <div className="modal-header">

                                <h2>
                                    Nova Categoria
                                </h2>

                                <button
                                    type="button"
                                    className="btn-fechar"
                                    onClick={() =>
                                        setModalCategoriaAberto(false)
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

                                        {
                                            OPCOES_ICONES_CATEGORIA.map(
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
                                                            icone={opcao.valor}
                                                            cor={novaCategoriaCor}
                                                            size={22}
                                                        />

                                                    </button>

                                                )
                                            )
                                        }

                                    </div>


                                    <label>
                                        Escolha uma cor
                                    </label>

                                    <div className="movimentacao-categoria-cores">

                                        {
                                            CORES_CATEGORIA.map(
                                                (cor) => (

                                                    <button
                                                        type="button"
                                                        key={cor}
                                                        title={cor}
                                                        className={
                                                            novaCategoriaCor === cor
                                                                ? "ativo"
                                                                : ""
                                                        }
                                                        style={{
                                                            backgroundColor: cor
                                                        }}
                                                        onClick={() =>
                                                            setNovaCategoriaCor(
                                                                cor
                                                            )
                                                        }
                                                    />

                                                )
                                            )
                                        }

                                    </div>

                                </div>

                                <div className="movimentacao-categoria-tipo">

                                    Essa categoria será criada como:

                                    <strong>
                                        {
                                            tipo === "receita"
                                                ? " Receita"
                                                : " Despesa"
                                        }
                                    </strong>

                                </div>

                            </div>


                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn-cancelar"
                                    onClick={() =>
                                        setModalCategoriaAberto(false)
                                    }
                                    disabled={salvandoAuxiliar}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn-salvar"
                                    onClick={salvarNovaCategoria}
                                    disabled={salvandoAuxiliar}
                                >
                                    {
                                        salvandoAuxiliar
                                            ? "Salvando..."
                                            : "Salvar"
                                    }
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </>
    );



}