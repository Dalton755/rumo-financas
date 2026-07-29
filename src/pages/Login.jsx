import { useState } from 'react'
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import { useToast } from "../context/ToastContext";
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import './Login.css'
import Logo from '../components/Logo'

function Login() {

  const { showToast } = useToast();

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  async function cadastrar() {

    const { error } = await supabase.auth.signUp({
      email,
      password: senha
    })

    if (error) {
      showToast("Erro", error.message, "danger");
      return
    }

    showToast(
      "Sucesso",
      "Usuário criado com sucesso!",
      "success"
    );
  }

  async function entrar() {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    if (error) {
      showToast("Erro", error.message, "danger");
      return
    }

    navigate('/dashboard')
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

            <FaEnvelope className="login-input-icon" />

            <input
              className="login-input"
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

          </div>

          <div className="login-input-group">

            <FaLock className="login-input-icon" />

            <input
              className="login-input"
              type={mostrarSenha ? 'text' : 'password'}
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  entrar()
                }
              }}
            />

            <div
              className="login-input-password"
              onClick={() => setMostrarSenha(!mostrarSenha)}
            >
              {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
            </div>

          </div>

          <button
            className="login-button"
            onClick={entrar}
          >
            Entrar
          </button>

          <div className="login-register">

            <span>
              Ainda não possui conta?
            </span>

            <button
              className="login-link"
              onClick={cadastrar}
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
  )
}

export default Login