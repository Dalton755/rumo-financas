import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import GraficoCategorias from '../components/GraficoCategorias'

function Relatorios() {

  const [dados, setDados] = useState([])

  useEffect(() => {

    carregarDados()

  }, [])

  async function carregarDados() {

    const {
      data,
      error
    } = await supabase
      .from('vw_gastos_categoria')
      .select('*')
      .order('total', {
        ascending: false
      })

    console.log(data)
    console.log(error)

    if (!error) {
      setDados(data)
    }

  }

  return (

    <div>

      <h1 className="fw-bold">
        Relatórios
      </h1>

      <p className="text-muted mb-4">
        Analise para onde seu dinheiro está indo.
      </p>

      <GraficoCategorias
        dados={dados}
      />

    </div>

  )

}

export default Relatorios