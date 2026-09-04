import "./ModalNovaMovimentacao.css";
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { editarMovimentacao } from "../../services/movimentacoes";
import { useToast } from "../../context/ToastContext";
import ModalConta from "./ModalConta";
import IconeCategoria, {
    CORES_CATEGORIA,
    OPCOES_ICONES_CATEGORIA,
} from "./IconeCategoria";

export default function ModalNovaMovimentacao({
    onFechar,
    onSalvou,
    movimentacao = null
}) {

    const { showToast } = useToast();

    const editando = Boolean(movimentacao?.id);

    const [contas, setContas] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [tipo, setTipo] = useState(
        movimentacao?.tipo || "receita"
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

    const [categoriaId, setCategoriaId] = useState(
        movimentacao?.categoria_id || ""
    );

    const [dataMovimento, setDataMovimento] = useState(
        movimentacao?.data_movimentacao || ""
    );

    const [observacao, setObservacao] = useState(
        movimentacao?.observacao || ""
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
        carregarCategorias();

    }, []);

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

        if (!contaId) {

            showToast(
                "Erro",
                "Selecione uma conta.",
                "danger"
            );

            return;
        }

        if (!categoriaId) {

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

        const dados = {

            tipo,

            descricao: descricao.trim(),

            valor: Number(valor),

            conta_id: contaId,

            categoria_id: categoriaId,

            data_movimentacao: dataMovimento,

            observacao: observacao.trim() || null

        };

        try {

            if (editando) {

                await editarMovimentacao(
                    movimentacao.id,
                    dados
                );

            } else {

                const { error } = await supabase
                    .schema("rumo")
                    .from("movimentacoes")
                    .insert({

                        usuario_id: user.id,

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
                                setTipo(e.target.value)
                            }
                        >

                            <option value="receita">
                                Receita
                            </option>

                            <option value="despesa">
                                Despesa
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
                                value={contaId}
                                onChange={(e) =>
                                    setContaId(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Selecione uma conta
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

                                {categorias
                                    .filter(
                                        (categoria) =>
                                            categoria.tipo === tipo
                                    )
                                    .map((categoria) => (

                                        <option
                                            key={categoria.id}
                                            value={categoria.id}
                                        >
                                            {categoria.nome}
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