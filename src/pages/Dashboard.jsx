    import { useEffect, useState } from 'react'
    import { supabase } from '../services/supabase'
    import MainLayout from '../layouts/MainLayout'

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

    <h3>Saldo Atual</h3>
    <p>
    R$ {dashboard?.saldo_total ?? 0}
    </p>

    <h3>Receitas do Mês</h3>
    <p>
    R$ {dashboard?.receitas_mes ?? 0}
    </p>

    <h3>Despesas do Mês</h3>
    <p>
    R$ {dashboard?.despesas_mes ?? 0}
    </p>

    <h3>Índice de Rumo</h3>
    <p>
    {dashboard?.indice_rumo ?? 0}
    </p>

    <hr />

        <button onClick={sair}>
            Sair
        </button>

        </MainLayout>
)

    
    }

    export default Dashboard