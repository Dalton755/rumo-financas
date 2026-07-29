import Card from "./Card";
import "./CardMovimentacoes.css";
import { ArrowRight } from "lucide-react";

export default function CardMovimentacoes({

    children

}){

    return(

        <Card className="rumo-mov-card">

            <div className="rumo-mov-header">

                <div>

                    <h3>

                        Últimas Movimentações

                    </h3>

                    <p>

                        Seus últimos lançamentos

                    </p>

                </div>

                <button>

                    Ver todas

                    <ArrowRight size={18}/>

                </button>

            </div>

            <div className="rumo-mov-lista">

                {children}

            </div>

        </Card>

    )

}