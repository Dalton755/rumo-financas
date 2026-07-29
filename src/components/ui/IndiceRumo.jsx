import "./IndiceRumo.css";

export default function IndiceRumo({

    valor = 0

}) {

    const nota = Math.max(0, Math.min(100, valor));

    const raio = 52;

    const circunferencia = Math.PI * raio;

    const progresso = circunferencia - (nota / 100) * circunferencia;

    let titulo = "";
    let mensagem = "";
    let cor = "";

    if (nota >= 95) {

        titulo = "Excelente";
        mensagem = "Continue assim!";
        cor = "#35C8E8";

    } else if (nota >= 80) {

        titulo = "Muito Bom";
        mensagem = "Seu controle está excelente.";
        cor = "#22C55E";

    } else if (nota >= 60) {

        titulo = "Bom";
        mensagem = "Você está no caminho certo.";
        cor = "#F4B400";

    } else if (nota >= 40) {

        titulo = "Atenção";
        mensagem = "Alguns ajustes podem ajudar.";
        cor = "#FB8C00";

    } else {

        titulo = "Crítico";
        mensagem = "Hora de reorganizar suas finanças.";
        cor = "#EF4444";

    }

    return (

        <div className="indice-rumo">

            <svg
                className="indice-svg"
                viewBox="0 0 160 110"
            >

                <path

                    d="M25 90 A55 55 0 0 1 135 90"

                    className="indice-bg"

                />

                <path

                    d="M25 90 A55 55 0 0 1 135 90"

                    className="indice-progress"

                    style={{

                        stroke: cor,

                        strokeDasharray: circunferencia,

                        strokeDashoffset: progresso

                    }}

                />

            </svg>

            <div className="indice-centro">

                <h2>

                    {nota}

                </h2>

                <strong>

                    {titulo}

                </strong>

                <span>

                    {mensagem}

                </span>

            </div>

        </div>

    );

}