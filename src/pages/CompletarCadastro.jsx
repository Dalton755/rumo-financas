import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    UserRound,
    LoaderCircle
} from "lucide-react";

import {
    supabase
} from "../services/supabase";

import {
    useToast
} from "../context/ToastContext";

import Logo from "../components/Logo";

import "./CompletarCadastro.css";


function normalizarNome(
    valor
) {

    return String(
        valor || ""
    )
        .replace(/\s+/g, " ")
        .trim();

}


export default function CompletarCadastro() {

    const navigate =
        useNavigate();


    const {
        showToast
    } =
        useToast();


    const [
        nome,
        setNome
    ] =
        useState("");


    const [
        carregando,
        setCarregando
    ] =
        useState(true);


    const [
        salvando,
        setSalvando
    ] =
        useState(false);


    useEffect(() => {

        carregar();

    }, []);


    async function carregar() {

        try {

            setCarregando(true);


            const {
                data: { user },
                error: erroUsuario
            } =
                await supabase.auth.getUser();


            if (
                erroUsuario ||
                !user
            ) {

                navigate(
                    "/",
                    {
                        replace: true
                    }
                );

                return;

            }


            const {
                data: perfil,
                error: erroPerfil
            } =
                await supabase
                    .from("profiles")
                    .select("nome")
                    .eq(
                        "id",
                        user.id
                    )
                    .maybeSingle();


            if (erroPerfil) {
                throw erroPerfil;
            }


            /*
             * Se já possui nome,
             * não precisa ficar nesta página.
             */
            if (
                perfil?.nome?.trim()
            ) {

                navigate(
                    "/dashboard",
                    {
                        replace: true
                    }
                );

                return;

            }


            /*
             * Google pode trazer um nome como sugestão,
             * mas ele NÃO é considerado definitivo.
             *
             * O usuário poderá revisar antes de salvar.
             */
            const sugestao =
                user?.user_metadata
                    ?.full_name ||
                user?.user_metadata
                    ?.name ||
                user?.user_metadata
                    ?.nome ||
                "";


            setNome(
                normalizarNome(
                    sugestao
                )
            );

        } catch (error) {

            console.error(
                "Erro ao carregar cadastro:",
                error
            );


            showToast(
                "Erro",
                "Não foi possível carregar seus dados.",
                "danger"
            );

        } finally {

            setCarregando(false);

        }

    }


    async function salvar() {

        const nomeLimpo =
            normalizarNome(
                nome
            );


        const partes =
            nomeLimpo
                .split(" ")
                .filter(Boolean);


        if (
            nomeLimpo.length < 5 ||
            partes.length < 2
        ) {

            showToast(
                "Nome completo",
                "Informe seu nome completo, como aparece em suas contas e comprovantes.",
                "warning"
            );

            return;

        }


        try {

            setSalvando(true);


            const {
                data: { user },
                error: erroUsuario
            } =
                await supabase.auth.getUser();


            if (
                erroUsuario ||
                !user
            ) {

                throw new Error(
                    "Usuário não autenticado."
                );

            }


            const {
                error
            } =
                await supabase
                    .from("profiles")
                    .update({
                        nome:
                            nomeLimpo,

                        updated_at:
                            new Date()
                                .toISOString()
                    })
                    .eq(
                        "id",
                        user.id
                    );


            if (error) {
                throw error;
            }


            showToast(
                "Cadastro concluído",
                "Seu nome foi salvo com sucesso.",
                "success"
            );


            navigate(
                "/dashboard",
                {
                    replace: true
                }
            );

        } catch (error) {

            console.error(
                "Erro ao salvar cadastro:",
                error
            );


            showToast(
                "Erro",
                error.message ||
                "Não foi possível salvar seus dados.",
                "danger"
            );

        } finally {

            setSalvando(false);

        }

    }


    if (carregando) {

        return (

            <div className="completar-cadastro-loading">

                <LoaderCircle
                    size={24}
                    className="completar-cadastro-spin"
                />

            </div>

        );

    }


    return (

        <div className="completar-cadastro-page">

            <div className="completar-cadastro-card">

                <Logo />


                <div className="completar-cadastro-icone">

                    <UserRound size={26} />

                </div>


                <h1>
                    Complete seu cadastro
                </h1>


                <p>
                    Precisamos do seu nome completo
                    para identificar corretamente
                    movimentações e comprovantes bancários.
                </p>


                <label>

                    <span>
                        Nome completo do titular
                    </span>


                    <input
                        type="text"
                        value={
                            nome
                        }
                        onChange={(e) =>
                            setNome(
                                e.target.value
                            )
                        }
                        placeholder="Ex.: Dalton Rocha da Silva"
                        autoComplete="name"
                        autoFocus
                    />


                    <small>
                        Use o mesmo nome que aparece
                        em suas contas e comprovantes bancários.
                    </small>

                </label>


                <button
                    type="button"
                    disabled={
                        salvando
                    }
                    onClick={
                        salvar
                    }
                >

                    {
                        salvando
                            ? (
                                <>
                                    <LoaderCircle
                                        size={17}
                                        className="completar-cadastro-spin"
                                    />

                                    Salvando...
                                </>
                            )
                            : "Continuar"
                    }

                </button>

            </div>

        </div>

    );

}