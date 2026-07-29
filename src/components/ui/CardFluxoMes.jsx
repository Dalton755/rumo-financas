import Card from "./Card";
import "./CardFluxoMes.css";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import { ChevronDown } from "lucide-react";

export default function CardFluxoMes({

    receitas = 0,
    despesas = 0

}) {

    const resultado = receitas - despesas;

    const dados = [

        {
            nome: "Receitas",
            valor: receitas
        },

        {
            nome: "Despesas",
            valor: despesas
        },

        {
            nome: "Resultado",
            valor: resultado
        }

    ];

    return (

        <Card className="rumo-fluxo-card">

            <div className="rumo-fluxo-header">

                <div>

                    <h3>

                        Fluxo do Mês

                    </h3>

                    <p>

                        Visão geral do período

                    </p>

                </div>

                <button>

                    Mensal

                    <ChevronDown size={18}/>

                </button>

            </div>

            <div className="rumo-fluxo-chart">

                <ResponsiveContainer
                    width="100%"
                    height={260}
                >

                    <LineChart data={dados}>

                        <CartesianGrid strokeDasharray="4 4"/>

                        <XAxis dataKey="nome"/>

                        <YAxis/>

                        <Tooltip/>

                        <Line

                            type="monotone"

                            dataKey="valor"

                            stroke="#35C8E8"

                            strokeWidth={4}

                            dot={{
                                r:6
                            }}

                        />

                    </LineChart>

                </ResponsiveContainer>

            </div>

            <div className="rumo-fluxo-resumo">

                <div>

                    <small>

                        Receitas

                    </small>

                    <strong>

                        {receitas.toLocaleString(
                            "pt-BR",
                            {
                                style:"currency",
                                currency:"BRL"
                            }
                        )}

                    </strong>

                </div>

                <div>

                    <small>

                        Despesas

                    </small>

                    <strong>

                        {despesas.toLocaleString(
                            "pt-BR",
                            {
                                style:"currency",
                                currency:"BRL"
                            }
                        )}

                    </strong>

                </div>

                <div>

                    <small>

                        Resultado

                    </small>

                    <strong>

                        {resultado.toLocaleString(
                            "pt-BR",
                            {
                                style:"currency",
                                currency:"BRL"
                            }
                        )}

                    </strong>

                </div>

            </div>

        </Card>

    );

}