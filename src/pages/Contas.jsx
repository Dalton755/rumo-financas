import {
    useEffect,
    useState
} from "react";

import {
    Plus,
    WalletCards
} from "lucide-react";

import { supabase } from "../services/supabase";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import PageHeader from "../components/ui/PageHeader";
import CardConta from "../components/ui/CardConta";
import ModalConta from "../components/ui/ModalConta";
import ModalConfirmacao from "../components/ui/ModalConfirmacao";

import { useToast } from "../context/ToastContext";

import "./Contas.css";

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

function Contas() {
    const { showToast } =
        useToast();

    const [nome, setNome] =
        useState("");

    const [tipo, setTipo] =
        useState("corrente");

    const [
        saldoInicial,
        setSaldoInicial
    ] = useState("0");

    const [contas, setContas] =
        useState([]);

    const [
        modalAberto,
        setModalAberto
    ] = useState(false);

    const [
        contaEditando,
        setContaEditando
    ] = useState(null);

    const [
        contaExcluir,
        setContaExcluir
    ] = useState(null);

    const [banco, setBanco] =
        useState("nubank");

    const saldoConsolidado =
        contas.reduce(
            (total, conta) =>
                total +
                Number(
                    conta.saldo_atual ??
                    conta.saldo_inicial ??
                    0
                ),
            0
        );

    useEffect(() => {
        carregarContas();
    }, []);

    async function carregarContas() {
        const {
            data: { user }
        } =
            await supabase
                .auth
                .getUser();

        if (!user) {
            return;
        }

        const {
            data,
            error
        } =
            await supabase
                .schema("rumo")
                .from(
                    "vw_saldo_contas"
                )
                .select(`
                    id,
                    usuario_id,
                    nome,
                    banco,
                    tipo,
                    saldo_inicial,
                    saldo_atual
                `)
                .eq(
                    "usuario_id",
                    user.id
                )
                .order("nome");

        if (!error) {
            setContas(
                data || []
            );
        }
    }

    function abrirEditar(conta) {
        setContaEditando(conta);
        setNome(conta.nome);
        setBanco(conta.banco);
        setTipo(conta.tipo);
        setSaldoInicial(
            conta.saldo_inicial
        );
        setModalAberto(true);
    }

    function novaConta() {
        setContaEditando(null);
        setNome("");
        setBanco("nubank");
        setTipo("corrente");
        setSaldoInicial(0);
        setModalAberto(true);
    }

    async function excluirConta() {
        if (!contaExcluir) {
            return;
        }

        const { error } =
            await supabase
                .schema("rumo")
                .from("contas")
                .delete()
                .eq(
                    "id",
                    contaExcluir.id
                );

        if (error) {
            showToast(
                "Erro",
                error.message,
                "danger"
            );
            return;
        }

        showToast(
            "Conta excluída",
            "A conta foi removida com sucesso.",
            "success"
        );

        setContaExcluir(null);

        carregarContas();
    }

    async function salvarConta() {
        const {
            data: { user }
        } =
            await supabase
                .auth
                .getUser();

        let error;

        if (contaEditando) {
            ({ error } =
                await supabase
                    .schema("rumo")
                    .from("contas")
                    .update({
                        nome,
                        banco,
                        tipo,
                        saldo_inicial:
                            Number(
                                saldoInicial
                            )
                    })
                    .eq(
                        "id",
                        contaEditando.id
                    ));
        } else {
            ({ error } =
                await supabase
                    .schema("rumo")
                    .from("contas")
                    .insert([
                        {
                            usuario_id:
                                user.id,
                            nome,
                            banco,
                            tipo,
                            saldo_inicial:
                                Number(
                                    saldoInicial
                                )
                        }
                    ]));
        }

        if (error) {
            showToast(
                "Erro",
                error.message,
                "danger"
            );
            return;
        }

        showToast(
            contaEditando
                ? "Conta atualizada"
                : "Conta criada",
            contaEditando
                ? "As alterações foram salvas."
                : "Sua nova conta já está disponível.",
            "success"
        );

        setModalAberto(false);
        carregarContas();
    }

    return (
        <MainLayout>
            <PageContainer>
                <PageHeader
                    titulo="Contas"
                    subtitulo="Seu dinheiro organizado por conta, com saldo consolidado."
                >
                    <button
                        type="button"
                        className="btn-nova-conta"
                        onClick={novaConta}
                    >
                        <Plus
                            size={16}
                        />
                        Nova conta
                    </button>
                </PageHeader>

                <section className="contas-overview">
                    <div>
                        <span>
                            Saldo consolidado
                        </span>

                        <strong>
                            {formatarMoeda(
                                saldoConsolidado
                            )}
                        </strong>
                    </div>

                    <div className="contas-overview-count">
                        <span>
                            Contas ativas
                        </span>

                        <strong>
                            {contas.length}
                        </strong>
                    </div>
                </section>

                <div className="contas-section-header">
                    <div>
                        <span>
                            Carteira
                        </span>

                        <h2>
                            Minhas contas
                        </h2>
                    </div>
                </div>

                {contas.length > 0 ? (
                    <div className="contas-grid">
                        {contas.map(
                            (conta) => (
                                <CardConta
                                    key={
                                        conta.id
                                    }
                                    conta={
                                        conta
                                    }
                                    onEditar={
                                        abrirEditar
                                    }
                                    onExcluir={
                                        setContaExcluir
                                    }
                                />
                            )
                        )}
                    </div>
                ) : (
                    <div className="contas-vazio">
                        <div className="contas-vazio-icon">
                            <WalletCards
                                size={25}
                            />
                        </div>

                        <h3>
                            Sua carteira começa aqui
                        </h3>

                        <p>
                            Cadastre sua primeira conta para acompanhar saldos e movimentações no Rumo.
                        </p>

                        <button
                            type="button"
                            onClick={novaConta}
                        >
                            <Plus
                                size={16}
                            />
                            Adicionar conta
                        </button>
                    </div>
                )}

                <ModalConta
                    aberto={
                        modalAberto
                    }
                    titulo={
                        contaEditando
                            ? "Editar conta"
                            : "Nova conta"
                    }
                    nome={nome}
                    setNome={setNome}
                    banco={banco}
                    setBanco={setBanco}
                    tipo={tipo}
                    setTipo={setTipo}
                    saldoInicial={
                        saldoInicial
                    }
                    setSaldoInicial={
                        setSaldoInicial
                    }
                    onSalvar={
                        salvarConta
                    }
                    onFechar={() =>
                        setModalAberto(
                            false
                        )
                    }
                />

                <ModalConfirmacao
                    aberto={
                        Boolean(
                            contaExcluir
                        )
                    }
                    titulo="Excluir conta"
                    mensagem="Tem certeza que deseja excluir esta conta? Esta ação não poderá ser desfeita."
                    onCancelar={() =>
                        setContaExcluir(
                            null
                        )
                    }
                    onConfirmar={
                        excluirConta
                    }
                />
            </PageContainer>
        </MainLayout>
    );
}

export default Contas;
