import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "../pages/Login.css";

export default function ProtectedRoute({ children }) {
    const [estado, setEstado] = useState("CARREGANDO");
    const [tentativa, setTentativa] = useState(0);

    useEffect(() => {
        let ativo = true;

        async function verificarSessao() {
            setEstado("CARREGANDO");

            try {
                const { data: { session }, error: erroSessao } =
                    await supabase.auth.getSession();

                if (!ativo) return;

                if (erroSessao) throw erroSessao;

                if (!session) {
                    setEstado("SEM_SESSAO");
                    return;
                }

                const { error } = await supabase
                    .schema("rumo")
                    .rpc("garantir_usuario_rumo");

                if (!ativo) return;

                if (error) {
                    console.error("Erro ao preparar usuário do Rumo:", error);

                    // A exclusão concluída é um bloqueio intencional no banco.
                    // Não redirecionar silenciosamente para o login.
                    setEstado(
                        error.message?.includes("RUMO_CONTA_ENCERRADA")
                            ? "CONTA_ENCERRADA"
                            : "ERRO"
                    );
                    return;
                }

                setEstado("AUTENTICADO");
            } catch (error) {
                console.error("Erro ao verificar acesso ao Rumo:", error);
                if (ativo) setEstado("ERRO");
            }
        }

        verificarSessao();

        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((evento) => {
                if (ativo && evento === "SIGNED_OUT") {
                    setEstado("SEM_SESSAO");
                }
                // SIGNED_IN/INITIAL_SESSION não dispensam a verificação
                // do acesso: o RPC pode negar contas encerradas.
            });

        return () => {
            ativo = false;
            subscription.unsubscribe();
        };
    }, [tentativa]);

    async function trocarConta() {
        try {
            await supabase.auth.signOut({ scope: "local" });
        } catch (error) {
            console.error("Erro ao encerrar sessão do Rumo:", error);
        } finally {
            window.location.replace("/");
        }
    }

    if (estado === "CARREGANDO") {
        return (
            <div className="login-page" role="status">
                <div className="login-card">
                    <p className="login-subtitle">Validando seu acesso ao Rumo...</p>
                </div>
            </div>
        );
    }

    if (estado === "SEM_SESSAO") {
        return <Navigate to="/" replace />;
    }

    if (estado === "CONTA_ENCERRADA" || estado === "ERRO") {
        const contaEncerrada = estado === "CONTA_ENCERRADA";

        return (
            <div className="login-page">
                <div className="login-card">
                    <h1 className="login-title">
                        {contaEncerrada
                            ? "Esta conta foi encerrada"
                            : "Não foi possível concluir seu acesso"}
                    </h1>
                    <p className="login-subtitle">
                        {contaEncerrada
                            ? "A exclusão desta conta foi concluída. Para acessar o Rumo, entre com outra conta."
                            : "Não conseguimos preparar sua conta neste momento. Tente novamente. Seus dados não foram alterados."}
                    </p>
                    {!contaEncerrada && (
                        <button
                            type="button"
                            className="login-button"
                            onClick={() => setTentativa((valor) => valor + 1)}
                        >
                            Tentar novamente
                        </button>
                    )}
                    <button
                        type="button"
                        className="login-google-button"
                        onClick={trocarConta}
                    >
                        Entrar com outra conta
                    </button>
                </div>
            </div>
        );
    }

    return children;
}
