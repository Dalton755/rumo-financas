import { usePlano } from "../context/PlanoContext";
import RecursoPremiumBloqueado from "./RecursoPremiumBloqueado";

export default function RecursoRoute({
    codigo,
    titulo = "Recurso Premium",
    children,
}) {
    const {
        temRecurso,
        carregandoPlano,
    } = usePlano();

    if (carregandoPlano) {
        return null;
    }

    if (!temRecurso(codigo)) {
        return (
            <RecursoPremiumBloqueado
                codigo={codigo}
                titulo={titulo}
            />
        );
    }

    return children;
}
