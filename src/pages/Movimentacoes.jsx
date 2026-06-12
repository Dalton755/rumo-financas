import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import MainLayout from '../layouts/MainLayout'

function Movimentacoes() {

  const [contas, setContas] = useState([])
  const [categorias, setCategorias] = useState([])

  const [contaId, setContaId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataMovimentacao, setDataMovimentacao] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {

    const {
      data: { user }
    } = await supabase.auth.getUser()

    const { data: contasData } = await supabase
      .from('contas')
      .select('*')
      .eq('usuario_id', user.id)
      .order('nome')

    const { data: categoriasData } = await supabase
      .from('categorias')
      .select('*')
      .eq('usuario_id', user.id)
      .order('nome')

    setContas(contasData || [])
    setCategorias(categoriasData || [])

  }

  async function salvarMovimentacao() {

    const {
      data: { user }
    } = await supabase.auth.getUser()

    const categoriaSelecionada =
      categorias.find(
        c => c.id === categoriaId
      )

    const tipo = categoriaSelecionada?.tipo

    const { error } = await supabase
      .from('movimentacoes')
      .insert([
        {
          usuario_id: user.id,
          conta_id: contaId,
          categoria_id: categoriaId,
          descricao,
          valor: Number(valor),
          tipo,
          data_movimentacao: dataMovimentacao
        }
      ])

    if (error) {
      alert(error.message)
      return
    }

    alert('Movimentação salva com sucesso!')

    setDescricao('')
    setValor('')
    setDataMovimentacao('')

  }

  return (
    <MainLayout>

      <h1>Movimentações</h1>

      <br />

      <select
        value={contaId}
        onChange={(e) => setContaId(e.target.value)}
      >
        <option value="">
          Selecione uma conta
        </option>

        {contas.map(conta => (
          <option
            key={conta.id}
            value={conta.id}
          >
            {conta.nome}
          </option>
        ))}
      </select>

      <br />
      <br />

      <select
        value={categoriaId}
        onChange={(e) => setCategoriaId(e.target.value)}
      >
        <option value="">
          Selecione uma categoria
        </option>

        {categorias.map(categoria => (
          <option
            key={categoria.id}
            value={categoria.id}
          >
            {categoria.nome}
          </option>
        ))}
      </select>

      <br />
      <br />

      <input
        placeholder="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Valor"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />

      <br />
      <br />

      <input
        type="date"
        value={dataMovimentacao}
        onChange={(e) => setDataMovimentacao(e.target.value)}
      />

      <br />
      <br />

      <button onClick={salvarMovimentacao}>
        Salvar Movimentação
      </button>

      </MainLayout>
  )
}

export default Movimentacoes