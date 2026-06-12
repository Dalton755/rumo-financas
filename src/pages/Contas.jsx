            import { useState, useEffect } from 'react'
            import { supabase } from '../services/supabase'
            import MainLayout from '../layouts/MainLayout'

            function Contas() {

            const [nome, setNome] = useState('')
            const [tipo, setTipo] = useState('corrente')
            const [saldoInicial, setSaldoInicial] = useState('0')
            const [contas, setContas] = useState([])

            useEffect(() => {
                carregarContas()
            }, [])

            async function carregarContas() {

                const {
                data: { user }
                } = await supabase.auth.getUser()
            
                const { data, error } = await supabase
                .from('contas')
                .select('*')
                .eq('usuario_id', user.id)
                .order('nome')
            
                if (!error) {
                setContas(data)
                }
            
            }

            async function salvarConta() {

                const {
                data: { user }
                } = await supabase.auth.getUser()

                const { error } = await supabase
                .from('contas')
                .insert([
                    {
                    usuario_id: user.id,
                    nome: nome,
                    tipo: tipo,
                    saldo_inicial: Number(saldoInicial)
                    }
                ])

                if (error) {
                alert(error.message)
                return
                }

                alert('Conta criada com sucesso!')

                carregarContas()

                setNome('')
                setTipo('corrente')
                setSaldoInicial('0')

            }

            return (
                <MainLayout>

                <h1>Contas</h1>

                <p>
                    Cadastre suas contas financeiras.
                </p>

                <br />

                <input
                    placeholder="Nome da Conta"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                />

                <br />
                <br />

                <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                >
                    <option value="corrente">
                    Conta Corrente
                    </option>

                    <option value="poupanca">
                    Poupança
                    </option>

                    <option value="carteira">
                    Carteira
                    </option>

                    <option value="investimento">
                    Investimento
                    </option>
                </select>

                <br />
                <br />

                <input
                    type="number"
                    placeholder="Saldo Inicial"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(e.target.value)}
                />

                <br />
                <br />

                <button onClick={salvarConta}>
                    Salvar Conta
                </button>

                <hr />

        <h2>Minhas Contas</h2>

        {contas.map((conta) => (

        <div
            key={conta.id}
            style={{
            border: '1px solid #ccc',
            padding: '10px',
            marginBottom: '10px'
            }}
        >

            <strong>{conta.nome}</strong>

            <br />

            Tipo: {conta.tipo}

            <br />

            Saldo Inicial:
            {' '}
            R$ {conta.saldo_inicial}

        </div>

        ))}

    </MainLayout>
            )
            }

            export default Contas