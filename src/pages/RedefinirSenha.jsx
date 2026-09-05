import {
  useEffect,
  useState
} from "react";

import {
  FaLock,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import { useToast } from "../context/ToastContext";
import { supabase } from "../services/supabase";

import Logo from "../components/Logo";
import "./Login.css";


function RedefinirSenha() {

  const navigate = useNavigate();
  const { showToast } = useToast();

  const [novaSenha, setNovaSenha] =
    useState("");

  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [verificando, setVerificando] =
    useState(true);

  const [sessaoValida, setSessaoValida] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);


  useEffect(() => {

    let ativo = true;


    async function verificar() {

      const {
        data: { session }
      } =
        await supabase.auth.getSession();


      if (!ativo) {
        return;
      }


      if (session) {

        setSessaoValida(true);
        setVerificando(false);

      } else {

        /*
         * O token de recuperação pode ainda
         * estar sendo processado pelo Supabase.
         */
        setTimeout(() => {

          if (ativo) {
            setVerificando(false);
          }

        }, 1500);
      }
    }


    verificar();


    const {
      data: { subscription }
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {

          if (!ativo) {
            return;
          }


          if (
            event === "PASSWORD_RECOVERY" ||
            event === "SIGNED_IN" ||
            event === "INITIAL_SESSION"
          ) {

            if (session) {

              setSessaoValida(true);
              setVerificando(false);

            }
          }
        }
      );


    return () => {

      ativo = false;
      subscription.unsubscribe();

    };

  }, []);


  async function salvarNovaSenha() {

    if (novaSenha.length < 8) {

      showToast(
        "Senha muito curta",
        "Utilize pelo menos 8 caracteres.",
        "warning"
      );

      return;
    }


    if (novaSenha !== confirmarSenha) {

      showToast(
        "Senhas diferentes",
        "As duas senhas precisam ser iguais.",
        "warning"
      );

      return;
    }


    setSalvando(true);


    const { error } =
      await supabase.auth.updateUser({
        password: novaSenha
      });


    if (error) {

      setSalvando(false);

      showToast(
        "Não foi possível alterar a senha",
        error.message,
        "danger"
      );

      return;
    }


    /*
     * Após uma recuperação de senha,
     * encerramos a sessão e exigimos
     * autenticação novamente.
     */
    await supabase.auth.signOut({
      scope: "global"
    });


    showToast(
      "Senha atualizada",
      "Sua senha foi alterada. Entre novamente no Rumo.",
      "success"
    );


    navigate("/", {
      replace: true
    });
  }


  if (verificando) {

    return (

      <div className="login-page">

        <div className="login-card">

          <div className="login-logo">
            <Logo width={180} />
          </div>

          <p className="login-subtitle">
            Validando seu link de recuperação...
          </p>

        </div>

      </div>
    );
  }


  if (!sessaoValida) {

    return (

      <div className="login-page">

        <div className="login-card">

          <div className="login-logo">
            <Logo width={180} />
          </div>


          <h1 className="login-title">
            Link inválido ou expirado
          </h1>


          <p className="login-subtitle">
            Volte à tela de login e solicite um novo link para redefinir sua senha.
          </p>


          <button
            type="button"
            className="login-button"
            onClick={() =>
              navigate("/", {
                replace: true
              })
            }
          >
            Voltar ao login
          </button>

        </div>

      </div>
    );
  }


  return (

    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          <Logo width={180} />
        </div>


        <h1 className="login-title">
          Criar nova senha
        </h1>


        <p className="login-subtitle">
          Escolha uma nova senha para sua conta.
        </p>


        <div className="login-form">

          <div className="login-input-group">

            <FaLock
              className="login-input-icon"
            />

            <input
              className="login-input"
              type={
                mostrarSenha
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              placeholder="Nova senha"
              value={novaSenha}
              onChange={(e) =>
                setNovaSenha(e.target.value)
              }
            />


            <button
              type="button"
              className="login-input-password"
              onClick={() =>
                setMostrarSenha(
                  !mostrarSenha
                )
              }
              aria-label={
                mostrarSenha
                  ? "Ocultar senha"
                  : "Mostrar senha"
              }
            >

              {
                mostrarSenha
                  ? <FaEyeSlash />
                  : <FaEye />
              }

            </button>

          </div>


          <div className="login-input-group">

            <FaLock
              className="login-input-icon"
            />

            <input
              className="login-input"
              type={
                mostrarSenha
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChange={(e) =>
                setConfirmarSenha(
                  e.target.value
                )
              }
              onKeyDown={(e) => {

                if (e.key === "Enter") {
                  salvarNovaSenha();
                }

              }}
            />

          </div>


          <button
            type="button"
            className="login-button"
            onClick={salvarNovaSenha}
            disabled={salvando}
          >
            {
              salvando
                ? "Salvando..."
                : "Salvar nova senha"
            }
          </button>

        </div>

      </div>

    </div>
  );
}


export default RedefinirSenha;