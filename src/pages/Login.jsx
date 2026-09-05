import { useState } from "react";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGoogle
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { supabase } from "../services/supabase";

import Logo from "../components/Logo";
import "./Login.css";


function Login() {

  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);


  function obterEmail() {
    return email.trim().toLowerCase();
  }


  async function cadastrar() {

    const emailUsuario = obterEmail();

    if (!emailUsuario || !senha) {

      showToast(
        "Atenção",
        "Informe seu e-mail e uma senha.",
        "warning"
      );

      return;
    }


    if (senha.length < 8) {

      showToast(
        "Senha muito curta",
        "Utilize pelo menos 8 caracteres.",
        "warning"
      );

      return;
    }


    setCarregando(true);

    const { error } = await supabase.auth.signUp({
      email: emailUsuario,
      password: senha
    });

    setCarregando(false);


    if (error) {

      showToast(
        "Erro ao criar conta",
        error.message,
        "danger"
      );

      return;
    }


    showToast(
      "Conta criada",
      "Verifique seu e-mail para concluir o cadastro.",
      "success"
    );
  }


  async function entrar() {

    const emailUsuario = obterEmail();

    if (!emailUsuario || !senha) {

      showToast(
        "Atenção",
        "Informe seu e-mail e sua senha.",
        "warning"
      );

      return;
    }


    setCarregando(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email: emailUsuario,
        password: senha
      });

    setCarregando(false);


    if (error) {

      showToast(
        "Não foi possível entrar",
        "Confira seu e-mail e sua senha.",
        "danger"
      );

      return;
    }


    navigate("/dashboard");
  }


  async function recuperarSenha() {

    const emailUsuario = obterEmail();


    if (!emailUsuario) {

      showToast(
        "Informe seu e-mail",
        "Digite o e-mail da sua conta Rumo antes de solicitar a recuperação.",
        "warning"
      );

      return;
    }


    setCarregando(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        emailUsuario,
        {
          redirectTo:
            `${window.location.origin}/redefinir-senha`
        }
      );

    setCarregando(false);


    if (error) {

      showToast(
        "Não foi possível enviar",
        error.message,
        "danger"
      );

      return;
    }


    /*
     * A mensagem não confirma se o e-mail existe.
     * Isso evita que alguém use a tela para descobrir
     * quais endereços possuem conta.
     */
    showToast(
      "Verifique seu e-mail",
      "Se existir uma conta associada a esse endereço, você receberá um link seguro para criar uma nova senha.",
      "success"
    );
  }


  async function entrarComGoogle() {

    setCarregando(true);


    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",

        options: {
          redirectTo:
            `${window.location.origin}/dashboard`,

          queryParams: {
            prompt: "select_account"
          }
        }
      });


    if (error) {

      setCarregando(false);

      showToast(
        "Não foi possível entrar com Google",
        error.message,
        "danger"
      );
    }
  }


  return (

    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          <Logo width={180} />
        </div>


        <h1 className="login-title">
          Rumo
        </h1>


        <p className="login-subtitle">
          Seu dinheiro com direção
        </p>


        <div className="login-form">

          <div className="login-input-group">

            <FaEnvelope
              className="login-input-icon"
            />

            <input
              className="login-input"
              type="email"
              autoComplete="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>


          <div>

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
                autoComplete="current-password"
                placeholder="Senha"
                value={senha}
                onChange={(e) =>
                  setSenha(e.target.value)
                }
                onKeyDown={(e) => {

                  if (e.key === "Enter") {
                    entrar();
                  }

                }}
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


            <div className="login-forgot-row">

              <button
                type="button"
                className="login-forgot"
                onClick={recuperarSenha}
                disabled={carregando}
              >
                Esqueci minha senha
              </button>

            </div>

          </div>


          <button
            type="button"
            className="login-button"
            onClick={entrar}
            disabled={carregando}
          >
            {
              carregando
                ? "Aguarde..."
                : "Entrar"
            }
          </button>


          <div className="login-divider">

            <span>ou</span>

          </div>


          <button
            type="button"
            className="login-google-button"
            onClick={entrarComGoogle}
            disabled={carregando}
          >

            <FaGoogle />

            <span>
              Continuar com Google
            </span>

          </button>


          <p className="login-google-note">
            Já possui uma conta Rumo?
            Use no Google o mesmo e-mail para acessar seus dados existentes.
          </p>


          <div className="login-register">

            <span>
              Ainda não possui conta?
            </span>

            <button
              type="button"
              className="login-link"
              onClick={cadastrar}
              disabled={carregando}
            >
              Criar conta gratuitamente
            </button>

          </div>

        </div>


        <div className="login-footer">
          Planeje. Economize. Conquiste.
        </div>

      </div>

    </div>
  );
}


export default Login;