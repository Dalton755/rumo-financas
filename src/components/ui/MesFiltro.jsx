import { Calendar, ChevronDown } from "lucide-react";
import "./MesFiltro.css";
import { useState } from "react";

export default function MesFiltro({

    periodos,

    periodoSelecionado,

    onSelecionar

}) {

    const [aberto, setAberto] = useState(false);

    return (

        <div className="rumo-mes-container">

            <button
                className="rumo-mes-filtro"
                onClick={() => setAberto(!aberto)}
            >

                <Calendar size={20} />

                <span>

                    {periodoSelecionado?.descricao}

                </span>

                <ChevronDown size={18} />

            </button>

            {

                aberto && (

                    <div className="rumo-mes-dropdown">

                        {
                            periodos.map((periodo) => (

                                <div
                                    key={`${periodo.ano}-${periodo.mes}`}
                                    className={
                                        periodoSelecionado?.mes === periodo.mes &&
                                            periodoSelecionado?.ano === periodo.ano
                                            ? "rumo-mes-item ativo"
                                            : "rumo-mes-item"
                                    }
                                    onClick={() => {

                                        onSelecionar(periodo);

                                        setAberto(false);

                                    }}
                                >

                                    {periodo.descricao}

                                </div>

                            ))
                        }

                    </div>

                )

            }

        </div>

    )

}