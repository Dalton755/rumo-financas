import {
    supabase
} from "../../services/supabase";

import {
    useState
} from "react";

import {
    FileUp,
    LoaderCircle,
    Sparkles,
    X
} from "lucide-react";

import {
    parseComprovantePdf
} from "../../utils/parserComprovantePdf";

import {
    useToast
} from "../../context/ToastContext";

import "./ModalImportarComprovante.css";


function formatarMoeda(
    valor
) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            style:
                "currency",
            currency:
                "BRL"
        }
    );

}


function formatarData(
    data
) {

    if (!data) {
        return "Não identificada";
    }


    return new Date(
        `${data}T12:00:00`
    ).toLocaleDateString(
        "pt-BR"
    );

}


export default function ModalImportarComprovante({
    onFechar,
    onUsarDados
}) {

    const { showToast } =
        useToast();


    const [
        arquivo,
        setArquivo
    ] = useState(null);


    const [
        analisando,
        setAnalisando
    ] = useState(false);


    const [
        resultado,
        setResultado
    ] = useState(null);


    async function analisar() {

        if (!arquivo) {

            showToast(
                "Selecione um arquivo",
                "Escolha um comprovante PDF, JPG ou PNG.",
                "warning"
            );

            return;

        }


        const extensao =
            arquivo.name
                .split(".")
                .pop()
                ?.toLowerCase();


        const formatosPermitidos = [
            "pdf",
            "jpg",
            "jpeg",
            "png"
        ];


        if (
            !formatosPermitidos.includes(
                extensao
            )
        ) {

            showToast(
                "Formato não suportado",
                "Utilize um comprovante PDF, JPG ou PNG.",
                "warning"
            );

            return;
        }


        try {

            setAnalisando(true);

            const {
                data: { user },
                error: erroUsuario
            } =
                await supabase.auth.getUser();


            if (
                erroUsuario ||
                !user
            ) {

                throw new Error(
                    "Não foi possível identificar o usuário autenticado."
                );

            }


            let usuarioNome =
                user?.user_metadata?.nome ||
                user?.user_metadata?.full_name ||
                "";


            /*
             * Se o metadata não tiver nome,
             * tenta buscar no profile.
             */
            if (!usuarioNome) {

                const {
                    data: perfil,
                    error: erroPerfil
                } = await supabase
                    .from("profiles")
                    .select("nome")
                    .eq(
                        "id",
                        user.id
                    )
                    .maybeSingle();




                if (
                    !erroPerfil &&
                    perfil
                ) {

                    usuarioNome =
                        perfil.nome ||
                        "";

                }

            }


            console.log(
                "[IMPORTADOR] Nome do usuário:",
                usuarioNome
            );




            const dados =
                await parseComprovantePdf(
                    arquivo,
                    usuarioNome
                );


            setResultado(
                dados
            );


            showToast(
                "Comprovante analisado",
                "Confira os dados identificados.",
                "success"
            );

        } catch (error) {

            console.error(
                "Erro ao analisar comprovante:",
                error
            );


            showToast(
                "Erro",
                error.message ||
                "Não foi possível analisar o comprovante.",
                "danger"
            );

        } finally {

            setAnalisando(false);

        }

    }


    return (

        <div
            className="comprovante-overlay"
            onMouseDown={(e) => {

                if (
                    e.target ===
                    e.currentTarget
                ) {

                    onFechar();

                }

            }}
        >

            <div className="comprovante-modal">

                <div className="comprovante-header">

                    <div>

                        <span>
                            IMPORTAÇÃO INTELIGENTE
                        </span>

                        <h2>
                            Importar comprovante
                        </h2>

                        <p>
                            Envie um comprovante PDF,
                            JPG ou PNG para o Rumo
                            identificar os dados da movimentação.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            onFechar
                        }
                    >
                        <X size={19} />
                    </button>

                </div>


                <label className="comprovante-upload">

                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={(e) => {

                            setArquivo(
                                e.target
                                    .files?.[0] ||
                                null
                            );

                            setResultado(
                                null
                            );

                        }}
                    />

                    <FileUp size={25} />

                    <div>

                        <strong>
                            {
                                arquivo
                                    ? arquivo.name
                                    : "Selecionar comprovante"
                            }
                        </strong>

                        <span>
                            PDF, JPG ou PNG
                        </span>

                    </div>

                </label>


                {
                    !resultado && (

                        <button
                            type="button"
                            className="comprovante-analisar"
                            disabled={
                                analisando
                            }
                            onClick={
                                analisar
                            }
                        >

                            {
                                analisando
                                    ? (
                                        <>
                                            <LoaderCircle
                                                size={17}
                                                className="comprovante-spin"
                                            />

                                            Analisando...
                                        </>
                                    )
                                    : (
                                        <>
                                            <Sparkles size={17} />

                                            Analisar comprovante
                                        </>
                                    )
                            }

                        </button>

                    )
                }


                {
                    resultado && (

                        <div className="comprovante-resultado">

                            <div className="comprovante-identificado">

                                <Sparkles size={16} />

                                <span>
                                    Movimentação identificada
                                </span>

                            </div>


                            <div className="comprovante-tipo">

                                <span
                                    className={
                                        resultado.tipo
                                    }
                                >
                                    {
                                        resultado.tipo === "receita"
                                            ? "RECEITA"
                                            : resultado.tipo === "transferencia"
                                                ? "TRANSFERÊNCIA"
                                                : "DESPESA"
                                    }
                                </span>

                            </div>


                            <strong className="comprovante-valor">
                                {
                                    resultado.valor
                                        ? formatarMoeda(
                                            resultado.valor
                                        )
                                        : "Valor não identificado"
                                }
                            </strong>


                            <div className="comprovante-dados">

                                <div>

                                    <span>
                                        Data
                                    </span>

                                    <strong>
                                        {
                                            formatarData(
                                                resultado.data_movimentacao
                                            )
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Descrição
                                    </span>

                                    <strong>
                                        {
                                            resultado.descricao
                                        }
                                    </strong>

                                </div>

                            </div>


                            <button
                                type="button"
                                className="comprovante-usar"
                                onClick={() =>
                                    onUsarDados(
                                        resultado
                                    )
                                }
                            >
                                Usar estes dados
                            </button>

                        </div>

                    )
                }

                {
                    resultado?.confianca && (

                        <div
                            className={`comprovante-confianca ${resultado.confianca.nivel}`}
                        >

                            {
                                resultado.confianca.nivel === "alta"
                                    ? "Dados identificados com alta confiança."
                                    : resultado.confianca.nivel === "media"
                                        ? "Alguns dados precisam ser conferidos."
                                        : "Não foi possível confirmar todos os dados. Revise antes de continuar."
                            }

                        </div>

                    )
                }

            </div>

        </div>

    );

}