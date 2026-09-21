import { Children } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ReceiptText } from "lucide-react";

import Card from "./Card";
import "./CardMovimentacoes.css";

export default function CardMovimentacoes({
    children
}) {
    const temMovimentacoes =
        Children.count(children) > 0;

    return (
        <Card className="rumo-mov-card">
            <div className="rumo-mov-header">
                <div>
                    <span className="rumo-section-eyebrow">
                        Atividade recente
                    </span>

                    <h3>
                        Últimas movimentações
                    </h3>

                    <p>
                        Entradas e saídas mais recentes.
                    </p>
                </div>

                <Link
                    to="/movimentacoes"
                    className="rumo-mov-link"
                >
                    Ver todas
                    <ArrowRight size={16} />
                </Link>
            </div>

            <div className="rumo-mov-lista">
                {temMovimentacoes ? (
                    children
                ) : (
                    <div className="rumo-mov-vazio">
                        <ReceiptText size={23} />

                        <div>
                            <strong>
                                Nenhuma movimentação no período
                            </strong>

                            <span>
                                Seus lançamentos aparecerão aqui.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
