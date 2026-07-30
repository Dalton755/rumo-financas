import "./ModalNovaMovimentacao.css";
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { useToast } from "../../context/ToastContext";

export default function ModalNovaMovimentacao({ onFechar, onSalvou }) {

    const { showToast } = useToast();

    const [contas, setContas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [tipo, setTipo] = useState("receita");
    const [descricao, setDescricao] = useState("");
    const [valor, setValor] = useState("");
    const [contaId, setContaId] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [dataMovimento, setDataMovimento] = useState("");
    const [observacao, setObservacao] = useState("");

    useEffect(() => {

        carregarContas();
        carregarCategorias();

    }, []);

    async function salvarMovimentacao() {

        const {
            data: { user }
        } = await supabase.auth.getUser();

        if (!user) {

            showToast("Erro", "Usuário não autenticado.", "danger");
            return;

        }

        if (!descricao.trim()) {

            showToast("Erro", "Informe a descrição.", "danger");
            return;

        }

        if (!valor || Number(valor) <= 0) {

            showToast("Erro", "Informe um valor válido.", "danger");
            return;

        }

        if (!contaId) {

            showToast("Erro", "Selecione uma conta.", "danger");
            return;

        }

        if (!categoriaId) {

            showToast("Erro", "Selecione uma categoria.", "danger");
            return;

        }

        if (!dataMovimento) {

            showToast("Erro", "Informe a data.", "danger");
            return;

        }

        const { error } = await supabase
            .from("movimentacoes")
            .insert({

                usuario_id: user.id,

                tipo,

                descricao,

                valor: Number(valor),

                conta_id: contaId,

                categoria_id: categoriaId,

                data_movimentacao: dataMovimento,

                observacao


            });

        if (error) {

            showToast("Erro", error.message, "danger");
            return;

        }

        showToast(
            "Sucesso",
            "Movimentação cadastrada com sucesso!",
            "success"
        );

        if (onSalvou) {

            await onSalvou();

        }

        onFechar();

    }

    async function carregarContas() {

        const { data, error } = await supabase
            .from("contas")
            .select("id,nome")
            .order("nome");

        if (!error) {

            setContas(data);

        }

    }

    async function carregarCategorias() {

        const { data, error } = await supabase
            .from("categorias")
            .select("id,nome")
            .order("nome");

        if (!error) {

            setCategorias(data);

        }

    }

    return (

        <div className="modal-overlay">

            <div className="modal-conta">

                <div className="modal-header">

                    <h2>Nova Movimentação</h2>

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
                        onChange={(e) => setTipo(e.target.value)}
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
                        onChange={(e) => setDescricao(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Valor"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                    />

                    <select
                        value={contaId}
                        onChange={(e) => setContaId(e.target.value)}
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
                        onChange={(e) => setCategoriaId(e.target.value)}
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
                        onChange={(e) => setDataMovimento(e.target.value)}
                    />

                    <textarea
                        placeholder="Observações (opcional)"
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
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
                        Salvar
                    </button>

                </div>

            </div>

        </div>

    );

}