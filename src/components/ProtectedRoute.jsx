import {
    useEffect,
    useState
} from "react";

import {
    Navigate,
    useLocation
} from "react-router-dom";

import {
    supabase
} from "../services/supabase";


export default function ProtectedRoute({
    children
}) {

    const location =
        useLocation();


    const [
        carregando,
        setCarregando
    ] =
        useState(true);


    const [
        autenticado,
        setAutenticado
    ] =
        useState(false);


    const [
        cadastroCompleto,
        setCadastroCompleto
    ] =
        useState(false);


    useEffect(() => {

        let ativo = true;


        async function verificarSessao() {

            try {

                setCarregando(
                    true
                );


                const {
                    data: { session }
                } =
                    await supabase.auth.getSession();


                if (
                    !ativo
                ) {
                    return;
                }


                if (!session) {

                    setAutenticado(
                        false
                    );

                    setCadastroCompleto(
                        false
                    );

                    return;

                }


                /*
                 * Garante que todas as estruturas
                 * necessárias do usuário existam.
                 */
                const {
                    error: erroGarantir
                } =
                    await supabase
                        .schema("rumo")
                        .rpc(
                            "garantir_usuario_rumo"
                        );


                if (erroGarantir) {

                    console.error(
                        "Erro ao preparar usuário do Rumo:",
                        erroGarantir
                    );


                    setAutenticado(
                        false
                    );

                    setCadastroCompleto(
                        false
                    );

                    return;

                }


                /*
                 * Agora verificamos se o titular
                 * informou o nome completo.
                 */
                const {
                    data: perfil,
                    error: erroPerfil
                } =
                    await supabase
                        .from("profiles")
                        .select("nome")
                        .eq(
                            "id",
                            session.user.id
                        )
                        .maybeSingle();


                if (erroPerfil) {

                    console.error(
                        "Erro ao verificar perfil do usuário:",
                        erroPerfil
                    );


                    setAutenticado(
                        false
                    );

                    setCadastroCompleto(
                        false
                    );

                    return;

                }


                const nomeValido =
                    Boolean(
                        perfil?.nome
                            ?.trim()
                    );


                if (
                    !ativo
                ) {
                    return;
                }


                setAutenticado(
                    true
                );


                setCadastroCompleto(
                    nomeValido
                );

            } catch (error) {

                console.error(
                    "Erro ao verificar acesso:",
                    error
                );


                if (
                    ativo
                ) {

                    setAutenticado(
                        false
                    );

                    setCadastroCompleto(
                        false
                    );

                }

            } finally {

                if (
                    ativo
                ) {

                    setCarregando(
                        false
                    );

                }

            }

        }


        verificarSessao();


        const {
            data: {
                subscription
            }
        } =
            supabase.auth
                .onAuthStateChange(
                    () => {

                        verificarSessao();

                    }
                );


        return () => {

            ativo = false;

            subscription.unsubscribe();

        };

    }, []);


    if (carregando) {

        return null;

    }


    if (!autenticado) {

        return (
            <Navigate
                to="/"
                replace
            />
        );

    }


    /*
     * Usuário autenticado, mas ainda sem
     * nome completo no profile.
     *
     * Não redirecionamos se ele já estiver
     * justamente na tela de completar cadastro.
     */
    if (
        !cadastroCompleto &&
        location.pathname !==
        "/completar-cadastro"
    ) {

        return (
            <Navigate
                to="/completar-cadastro"
                replace
            />
        );

    }


    /*
     * Se já completou o cadastro e tentar
     * acessar a tela novamente, volta ao dashboard.
     */
    if (
        cadastroCompleto &&
        location.pathname ===
        "/completar-cadastro"
    ) {

        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );

    }


    return children;

}