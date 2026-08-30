import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import MainLayout from '../layouts/MainLayout'
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Plus } from "lucide-react";
import { useToast } from "../context/ToastContext";
import CardConta from "../components/ui/CardConta";
import "./Contas.css";
import ModalConta from "../components/ui/ModalConta";
import ModalConfirmacao from "../components/ui/ModalConfirmacao";

function Contas() {

    const { showToast } = useToast();
    const [nome, setNome] = useState('')
    const [tipo, setTipo] = useState('corrente')
    const [saldoInicial, setSaldoInicial] = useState('0')
    const [contas, setContas] = useState([])
    const [modalAberto, setModalAberto] = useState(false)
    const [contaEditando, setContaEditando] = useState(null)
    const [contaExcluir, setContaExcluir] = useState(null)
    const [banco, setBanco] = useState("nubank")

    useEffect(() => {
        carregarContas()
    }, [])

    async function carregarContas() {

        const {
            data: { user }
        } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .schema("rumo")
            .from('contas')
            .select('*')
            .eq('usuario_id', user.id)
            .order('nome')

        if (!error) {
            setContas(data)
        }

    }

    function abrirEditar(conta) {

        setContaEditando(conta);

        setNome(conta.nome);

        setBanco(conta.banco);

        setTipo(conta.tipo);

        setSaldoInicial(conta.saldo_inicial);

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

        if (!contaExcluir) return;

        const { error } = await supabase

            .schema("rumo")
            .from("contas")

            .delete()

            .eq("id", contaExcluir.id);

        if (error) {

            showToast(

                "Erro",

                error.message,

                "danger"

            );

            return;

        }

        showToast(

            "Sucesso",

            "Conta excluída com sucesso.",

            "success"

        );

        setContaExcluir(null);

        carregarContas();

    }

    async function salvarConta() {

        const {
            data: { user }
        } = await supabase.auth.getUser();

        let error;

        if (contaEditando) {

            ({ error } = await supabase

                .schema("rumo")
                .from("contas")

                .update({

                    nome,

                    banco,

                    tipo,

                    saldo_inicial: Number(saldoInicial)

                })

                .eq("id", contaEditando.id));

        } else {

            ({ error } = await supabase

                .schema("rumo")
                .from("contas")

                .insert([

                    {

                        usuario_id: user.id,

                        nome,

                        banco,

                        tipo,

                        saldo_inicial: Number(saldoInicial)

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

            "Sucesso",

            contaEditando
                ? "Conta atualizada com sucesso!"
                : "Conta criada com sucesso!",

            "success"

        );

        setModalAberto(false);

        carregarContas();

    }

    return (

        <MainLayout>

            <PageHeader

                titulo="Contas"

                subtitulo="Gerencie todas as suas contas financeiras."

            >

                <button
                    className="btn-nova-conta"
                    onClick={novaConta}
                >

                    + Nova Conta

                </button>

            </PageHeader>

            <br />



            <div style={{ marginTop: "40px" }}>

                <h2 className="page-section-title">

                    Minhas Contas

                </h2>

            </div>

            <div className="contas-grid">

                {contas.map((conta) => (

                    <CardConta
                        key={conta.id}
                        conta={conta}
                        onEditar={abrirEditar}
                        onExcluir={(conta) => {

                            console.log("CONTA:", conta);

                            setContaExcluir(conta);

                        }}
                    />

                ))}

            </div>

            <ModalConta

                aberto={modalAberto}

                titulo={
                    contaEditando
                        ? "Editar Conta"
                        : "Nova Conta"
                }

                nome={nome}
                setNome={setNome}

                banco={banco}
                setBanco={setBanco}

                tipo={tipo}
                setTipo={setTipo}

                saldoInicial={saldoInicial}
                setSaldoInicial={setSaldoInicial}

                onSalvar={salvarConta}

                onFechar={() => setModalAberto(false)}

            />

            <ModalConfirmacao

                aberto={!!contaExcluir}

                titulo="Excluir Conta"

                mensagem="Tem certeza que deseja excluir esta conta? Esta ação não poderá ser desfeita."

                onCancelar={() => setContaExcluir(null)}

                onConfirmar={excluirConta}

            />

        </MainLayout >
    )
}

export default Contas