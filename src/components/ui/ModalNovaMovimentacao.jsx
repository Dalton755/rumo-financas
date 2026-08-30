import "./ModalNovaMovimentacao.css";
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { editarMovimentacao } from "../../services/movimentacoes";
import { useToast } from "../../context/ToastContext";

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
            .order("nome");

        if (!error) {

            setContas(data || []);

        }

    }

    async function carregarCategorias() {

        const { data, error } = await supabase
            .schema("rumo")
            .from("categorias")
            .select("id,nome")
            .order("nome");

        if (!error) {

            setCategorias(data || []);

        }

    }

    return (

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

                    <select
                        value={contaId}
                        onChange={(e) =>
                            setContaId(e.target.value)
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

                    <select
                        value={categoriaId}
                        onChange={(e) =>
                            setCategoriaId(e.target.value)
                        }
                    >

                        <option value="">
                            Selecione uma categoria
                        </option>

                        {categorias.map((categoria) => (

                            <option
                                key={categoria.id}
                                value={categoria.id}
                            >
                                {categoria.nome}
                            </option>

                        ))}

                    </select>

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

    );

}