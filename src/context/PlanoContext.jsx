import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { supabase } from "../services/supabase";

const PlanoContext = createContext(null);

const PLANO_GRATUITO = {
    codigo: "GRATUITO",
    nome: "Gratuito",
    premium: false,
    status: "ATIVA",
    vence_em: null,
};

export function PlanoProvider({ children }) {
    const [plano, setPlano] = useState(PLANO_GRATUITO);
    const [recursos, setRecursos] = useState([]);
    const [carregandoPlano, setCarregandoPlano] = useState(true);

    const carregarPlano = useCallback(async () => {
        try {
            setCarregandoPlano(true);

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.user) {
                setPlano(PLANO_GRATUITO);
                setRecursos([]);
                return;
            }

            const {
                data: dadosPlano,
                error: erroPlano,
            } = await supabase
                .schema("rumo")
                .rpc("obter_plano_usuario");

            if (erroPlano) {
                throw erroPlano;
            }

            const planoAtual =
                dadosPlano?.[0] ?? PLANO_GRATUITO;

            setPlano(planoAtual);

            const {
                data: registroPlano,
                error: erroRegistroPlano,
            } = await supabase
                .schema("rumo")
                .from("planos")
                .select("id")
                .eq("codigo", planoAtual.codigo)
                .eq("ativo", true)
                .maybeSingle();

            if (erroRegistroPlano) {
                throw erroRegistroPlano;
            }

            if (!registroPlano?.id) {
                setRecursos([]);
                return;
            }

            const {
                data: recursosPlano,
                error: erroRecursos,
            } = await supabase
                .schema("rumo")
                .from("plano_recursos")
                .select(`
                    recurso:recursos (
                        codigo
                    )
                `)
                .eq("plano_id", registroPlano.id)
                .eq("ativo", true);

            if (erroRecursos) {
                throw erroRecursos;
            }

            const codigos = (recursosPlano ?? [])
                .map((item) => item.recurso?.codigo)
                .filter(Boolean);

            setRecursos(codigos);
        } catch (error) {
            console.error(
                "Erro ao carregar plano do usuário:",
                error
            );

            setPlano(PLANO_GRATUITO);
            setRecursos([]);
        } finally {
            setCarregandoPlano(false);
        }
    }, []);

    useEffect(() => {
        carregarPlano();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            carregarPlano();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [carregarPlano]);

    function temRecurso(codigo) {
        return recursos.includes(codigo);
    }

    const premium = plano?.premium === true;

    return (
        <PlanoContext.Provider
            value={{
                plano,
                premium,
                recursos,
                temRecurso,
                carregandoPlano,
                recarregarPlano: carregarPlano,
            }}
        >
            {children}
        </PlanoContext.Provider>
    );
}

export function usePlano() {
    const context = useContext(PlanoContext);

    if (!context) {
        throw new Error(
            "usePlano deve ser usado dentro de PlanoProvider"
        );
    }

    return context;
}
