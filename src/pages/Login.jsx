import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

function Login() {

  const navigate = useNavigate()  

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  async function cadastrar() {

    const { error } = await supabase.auth.signUp({
      email,
      password: senha
    })

    if (error) {
      alert(error.message)
      return
    }

    alert('Usuário criado com sucesso!')
  }

  async function entrar() {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    if (error) {
      alert(error.message)
      return
    }

    navigate('/dashboard')
  } 

  return (
    <div style={{ padding: '40px' }}>

      <h1>Rumo</h1>

      <p>
        Veja para onde seu dinheiro está levando você.
      </p>

      <br />

      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      <br />
      <br />

      <button onClick={cadastrar}>
        Criar Conta
      </button>

      <button
        onClick={entrar}
        style={{ marginLeft: '10px' }}
      >
        Entrar
      </button>

    </div>
  )
}

export default Login