import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function ProtectedRoute({ children }) {

    const [carregando, setCarregando] = useState(true);
    const [autenticado, setAutenticado] = useState(false);

    useEffect(() => {

        async function verificarSessao() {

            const {
                data: { session }
            } = await supabase.auth.getSession();

            setAutenticado(!!session);
            setCarregando(false);

        }

        verificarSessao();

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((_event, session) => {

            setAutenticado(!!session);
            setCarregando(false);

        });

        return () => {

            subscription.unsubscribe();

        };

    }, []);

    if (carregando) {

        return null;

    }

    if (!autenticado) {

        return <Navigate to="/" replace />;

    }

    return children;

}