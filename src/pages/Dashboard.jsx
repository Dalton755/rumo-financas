        import { useEffect, useState } from 'react'
        import { supabase } from '../services/supabase'
        import MainLayout from '../layouts/MainLayout'
        import CardResumo from '../components/CardResumo'

        function Dashboard() {

        const [usuario, setUsuario] = useState(null)
        const [dashboard, setDashboard] = useState(null)

        useEffect(() => {

            async function carregarUsuario() {

            const {
                data: { user }
            } = await supabase.auth.getUser()

            setUsuario(user)

            if (user) {
                carregarDashboard(user.id)
            }

            }

            carregarUsuario()

            async function carregarDashboard(userId) {

                const { data, error } = await supabase
                .from('vw_dashboard')
                .select('*')
                .eq('usuario_id', userId)
                .single()
            
                console.log('Dashboard:', data)
                console.log('Erro Dashboard:', error)
            
                if (!error) {
                setDashboard(data)
                }
            
            }

        }, [])

        async function sair() {

            await supabase.auth.signOut()

            window.location.href = '/'

        }

        return (
            <MainLayout>

            <h1>Rumo</h1>

            <p>
                Veja para onde seu dinheiro está levando você.
            </p>

            <hr />

            <h2>
                Olá,
                {' '}
                {usuario?.email}
            </h2>

            <br />

            <hr />

            <div className="row">

    <CardResumo
        titulo="Saldo Atual"
        valor={`R$ ${dashboard?.saldo_total ?? 0}`}
    />

    <CardResumo
        titulo="Receitas do Mês"
        valor={`R$ ${dashboard?.receitas_mes ?? 0}`}
    />

    <CardResumo
        titulo="Despesas do Mês"
        valor={`R$ ${dashboard?.despesas_mes ?? 0}`}
    />

    <CardResumo
        titulo="Índice de Rumo"
        valor={dashboard?.indice_rumo ?? 0}
    />

    </div>

        <hr />

            <button onClick={sair}>
                Sair
            </button>

            </MainLayout>
    )

        
        }

        export default Dashboard