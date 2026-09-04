import {
    Link,
} from "react-router-dom";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Building2,
    CheckCircle2,
    Landmark,
    Link2,
    LoaderCircle,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

import {
    PluggyConnect,
} from "react-pluggy-connect";

import MainLayout from "../layouts/MainLayout";
import PageContainer from "../components/ui/PageContainer";
import ModalConfirmacao from "../components/ui/ModalConfirmacao";
import {
    usePlano,
} from "../context/PlanoContext";



import {
    criarConnectToken,
    desconectarConexaoOpenFinance,
    listarConexoesOpenFinance,
    salvarConexaoOpenFinance,
    sincronizarConexaoOpenFinance,
} from "../services/openFinance";

import "./OpenFinance.css";

function formatarUltimaSincronizacao(
    valor
) {

    if (!valor) {
        return "Ainda não sincronizado";
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "Data indisponível";
    }

    return data.toLocaleString(
        "pt-BR",
        {
            timeZone:
                "America/Sao_Paulo",

            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit",
        }
    );

}


function OpenFinance() {

    const {
        temRecurso,
        carregandoPlano,
    } =
        usePlano();


    const possuiOpenFinance =
        temRecurso(
            "OPEN_FINANCE"
        );

    const pluggyRef =
        useRef(null);

    const [
        connectToken,
        setConnectToken
    ] = useState("");

    const [
        carregando,
        setCarregando
    ] = useState(false);

    const [
        erro,
        setErro
    ] = useState("");

    const [
        sucesso,
        setSucesso
    ] = useState("");

    const [
        sucessoDetalhe,
        setSucessoDetalhe
    ] = useState("");

    const [
        itemCriado,
        setItemCriado
    ] = useState(null);

    const [
        conexoes,
        setConexoes
    ] = useState([]);

    const [
        carregandoConexoes,
        setCarregandoConexoes
    ] = useState(true);

    const [
        sincronizandoId,
        setSincronizandoId
    ] = useState(null);

    const [
        conexaoDesconectar,
        setConexaoDesconectar
    ] = useState(null);

    const [
        desconectando,
        setDesconectando
    ] = useState(false);


    useEffect(() => {

        carregarConexoes();

    }, []);


    async function carregarConexoes() {

        try {

            setCarregandoConexoes(true);

            const lista =
                await listarConexoesOpenFinance();

            setConexoes(
                lista
            );

        } catch (error) {

            console.error(
                "[RUMO OPEN FINANCE] Erro ao carregar conexões:",
                error
            );

        } finally {

            setCarregandoConexoes(false);

        }

    }

    async function sincronizarAgora(
        conexao
    ) {

        if (
            !conexao?.id ||
            sincronizandoId
        ) {
            return;
        }


        try {

            setSincronizandoId(
                conexao.id
            );

            setErro("");
            setSucesso("");
            setSucessoDetalhe("");


            await sincronizarConexaoOpenFinance(
                conexao.id
            );


            /*
             * Recarrega as conexões para trazer do banco
             * a nova data de última sincronização.
             */

            const listaAtualizada =
                await listarConexoesOpenFinance();


            setConexoes(
                listaAtualizada
            );


            setSucesso(
                `${conexao.instituicao_nome || "Instituição"} sincronizada com sucesso.`
            );

            setSucessoDetalhe(
                "Contas e movimentações foram atualizadas no Rumo."
            );

        } catch (error) {

            console.error(
                "[RUMO OPEN FINANCE] Erro na sincronização:",
                error
            );


            setSucesso("");
            setSucessoDetalhe("");

            setErro(
                error?.message ??
                "Não foi possível sincronizar a instituição."
            );

        } finally {

            setSincronizandoId(
                null
            );

        }

    }

    function abrirConfirmacaoDesconexao(
        conexao
    ) {

        if (
            !conexao?.id ||
            desconectando
        ) {
            return;
        }

        setConexaoDesconectar(
            conexao
        );

    }


    function cancelarDesconexao() {

        if (desconectando) {
            return;
        }

        setConexaoDesconectar(
            null
        );

    }


    async function confirmarDesconexao() {

        if (
            !conexaoDesconectar?.id ||
            desconectando
        ) {
            return;
        }


        const conexao =
            conexaoDesconectar;


        try {

            setDesconectando(true);
            setErro("");
            setSucesso("");
            setSucessoDetalhe("");


            await desconectarConexaoOpenFinance(
                conexao.id
            );


            const listaAtualizada =
                await listarConexoesOpenFinance();


            setConexoes(
                listaAtualizada
            );


            setConexaoDesconectar(
                null
            );


            setSucesso(
                `${conexao.instituicao_nome || "Instituição"} desconectada com sucesso.`
            );

            setSucessoDetalhe(
                "O acesso Open Finance foi revogado e o histórico já importado foi preservado no Rumo."
            );

        } catch (error) {

            console.error(
                "[RUMO OPEN FINANCE] Erro ao desconectar:",
                error
            );


            setErro(
                error?.message ??
                "Não foi possível desconectar a instituição."
            );

        } finally {

            setDesconectando(false);

        }

    }


    async function iniciarConexao() {

        try {

            setCarregando(true);
            setErro("");
            setSucesso("");
            setSucessoDetalhe("");
            setItemCriado(null);

            // Sempre pedimos um token novo.
            const token =
                await criarConnectToken();

            setConnectToken(token);

        } catch (error) {

            console.error(
                "[RUMO OPEN FINANCE]",
                error
            );

            setErro(
                error?.message ??
                "Não foi possível iniciar a conexão."
            );

            setCarregando(false);

        }

    }


    function registrarInstancia(
        instancia
    ) {

        pluggyRef.current =
            instancia;

        if (
            instancia &&
            connectToken
        ) {

            setCarregando(false);

            instancia.show();

        }

    }


        async function conexaoConcluida(
        dados
    ) {

        const item =
            dados?.item ??
            null;

        const itemId =
            item?.id ??
            null;


        if (!itemId) {

            setItemCriado(null);
            setSucesso("");
            setSucessoDetalhe("");

            setErro(
                "A instituição foi autorizada, mas a Pluggy não retornou o identificador da conexão."
            );

            return;

        }


        try {

            setErro("");
            setSucesso("");
            setSucessoDetalhe("");


            // =====================================================
            // 1. REGISTRAR CONEXÃO NO BACKEND DO RUMO
            // =====================================================

            const conexao =
                await salvarConexaoOpenFinance(
                    itemId
                );


            if (!conexao?.id) {

                throw new Error(
                    "A conexão foi registrada, mas o Rumo não retornou seu identificador."
                );

            }


            setItemCriado({
                ...item,

                conexaoRumoId:
                    conexao.id,
            });


            setConexoes(
                (atuais) => {

                    const semDuplicidade =
                        atuais.filter(
                            (registro) =>
                                registro.id !==
                                conexao.id
                        );

                    return [
                        conexao,
                        ...semDuplicidade,
                    ];

                }
            );


            console.log(
                "[RUMO OPEN FINANCE] Conexão registrada:",
                {
                    conexaoId:
                        conexao.id,

                    instituicao:
                        conexao?.instituicao_nome ??
                        null,

                    status:
                        conexao?.status ??
                        null,
                }
            );


            // =====================================================
            // 2. SINCRONIZAÇÃO AUTOMÁTICA
            //
            // A conexão já está salva.
            //
            // Se esta etapa falhar, NÃO desfazemos a conexão.
            // O usuário poderá usar "Sincronizar agora".
            // =====================================================

            try {

                setSincronizandoId(
                    conexao.id
                );


                await sincronizarConexaoOpenFinance(
                    conexao.id
                );


                // =================================================
                // 3. RECARREGAR A CONEXÃO APÓS SINCRONIZAÇÃO
                //
                // Atualiza status, última sincronização etc.
                // =================================================

                const listaAtualizada =
                    await listarConexoesOpenFinance();


                setConexoes(
                    listaAtualizada
                );


                setSucesso(
                    "Instituição conectada e sincronizada com sucesso."
                );

                setSucessoDetalhe(
                    "Contas, saldos e movimentações já foram atualizados automaticamente no Rumo."
                );


                console.log(
                    "[RUMO OPEN FINANCE] Primeira sincronização concluída:",
                    {
                        conexaoId:
                            conexao.id,

                        instituicao:
                            conexao?.instituicao_nome ??
                            null,
                    }
                );

            } catch (sincronizacaoError) {

                /*
                 * IMPORTANTE:
                 *
                 * A autorização e a conexão já foram salvas.
                 * Portanto uma falha de sincronização não deve
                 * ser apresentada como falha de conexão.
                 */

                console.error(
                    "[RUMO OPEN FINANCE] Conexão salva, mas a sincronização automática falhou:",
                    sincronizacaoError
                );


                setSucesso(
                    "Instituição conectada com sucesso."
                );

                setSucessoDetalhe(
                    "Não foi possível concluir a primeira sincronização automaticamente. Use o botão “Sincronizar agora” para tentar novamente."
                );


                setErro("");

            } finally {

                setSincronizandoId(
                    null
                );

            }

        } catch (error) {

            console.error(
                "[RUMO OPEN FINANCE] Erro ao registrar conexão:",
                error
            );


            setItemCriado(null);
            setSucesso("");
            setSucessoDetalhe("");

            setErro(
                error?.message ??
                "A instituição foi autorizada, mas não foi possível registrar a conexão no Rumo."
            );

        }

    }


    async function erroConexao(
        error
    ) {

        console.error(
            "[RUMO OPEN FINANCE] Erro Pluggy:",
            error
        );

        setErro(
            error?.message ??
            "Não foi possível concluir a conexão com a instituição."
        );

        setSucesso("");
        setSucessoDetalhe("");

    }


    function erroCarregamento(
        error
    ) {

        console.error(
            "[RUMO OPEN FINANCE] Erro ao carregar Pluggy:",
            error
        );

        setCarregando(false);

        setErro(
            "Não foi possível carregar o ambiente seguro de conexão."
        );

    }


    function widgetFechado() {

        setCarregando(false);

        /*
         * Removemos o Connect Token da memória.
         * Na próxima tentativa será solicitado um token novo.
         */

        setConnectToken("");

        pluggyRef.current =
            null;

    }


    return (

        <MainLayout>

            <PageContainer>

                <div className="open-finance-page">

                    <header className="open-finance-header">

                        <div>

                            <div className="open-finance-premium">
                                <Sparkles size={15} />
                                Rumo Premium
                            </div>

                            <h1>
                                Open Finance
                            </h1>

                            <p>
                                Conecte suas instituições financeiras
                                para trazer seus dados ao Rumo de forma
                                segura e automatizada.
                            </p>

                        </div>

                    </header>

                    {!carregandoPlano &&
                        !possuiOpenFinance && (

                            <div className="open-finance-alert open-finance-alert-warning">

                                <LockKeyhole size={22} />

                                <div>
                                    <strong>
                                        Open Finance não está disponível no seu plano atual
                                    </strong>

                                    <span>
                                        Você não pode conectar novas instituições nem sincronizar dados,
                                        mas ainda pode visualizar suas conexões e desconectá-las quando quiser.
                                    </span>

                                    <Link
                                        to="/premium"
                                        className="open-finance-premium-button"
                                    >
                                        <Sparkles size={17} />
                                        Conhecer o Rumo Premium
                                    </Link>



                                </div>

                            </div>

                        )}


                    {erro && (

                        <div className="open-finance-alert open-finance-alert-error">

                            <strong>
                                Não foi possível conectar
                            </strong>

                            <span>
                                {erro}
                            </span>

                        </div>

                    )}


                    {sucesso && (

                        <div className="open-finance-alert open-finance-alert-success">

                            <CheckCircle2 size={22} />

                            <div>

                                <strong>
                                    {sucesso}
                                </strong>

                                {sucessoDetalhe && (
                                    <span>
                                        {sucessoDetalhe}
                                    </span>
                                )}

                            </div>

                        </div>

                    )}


                    <section className="open-finance-hero">

                        <div className="open-finance-hero-icon">
                            <Landmark size={38} />
                        </div>

                        <div className="open-finance-hero-content">

                            <span className="open-finance-label">
                                Conexão bancária
                            </span>

                            <h2>
                                Centralize sua vida financeira
                            </h2>

                            <p>
                                Autorize o Rumo a acessar as informações
                                financeiras que você escolher. Você poderá
                                acompanhar suas conexões e revogar o acesso
                                quando quiser.
                            </p>


                            <button
                                type="button"
                                className="open-finance-connect-button"
                                onClick={iniciarConexao}
                                disabled={
                                    carregando ||
                                    carregandoPlano ||
                                    !possuiOpenFinance
                                }
                            >

                                {carregando ? (
                                    <>
                                        <LoaderCircle
                                            size={19}
                                            className="open-finance-spinner"
                                        />

                                        Preparando conexão...
                                    </>
                                ) : !possuiOpenFinance ? (
                                    <>
                                        <LockKeyhole size={19} />
                                        Disponível no Rumo Premium
                                    </>
                                ) : (
                                    <>
                                        <Link2 size={19} />
                                        Conectar instituição financeira
                                    </>
                                )}
                            </button>

                        </div>

                    </section>

                    <section className="open-finance-conexoes">

                        <div className="open-finance-conexoes-header">

                            <div>

                                <span className="open-finance-label">
                                    Instituições conectadas
                                </span>

                                <h2>
                                    Suas conexões
                                </h2>

                                <p>
                                    Instituições financeiras autorizadas
                                    e vinculadas à sua conta do Rumo.
                                </p>

                            </div>

                            {!carregandoConexoes && (

                                <span className="open-finance-conexoes-total">
                                    {conexoes.length}
                                    {" "}
                                    {conexoes.length === 1
                                        ? "conexão"
                                        : "conexões"}
                                </span>

                            )}

                        </div>


                        {carregandoConexoes ? (

                            <div className="open-finance-conexoes-loading">

                                <LoaderCircle
                                    size={20}
                                    className="open-finance-spinner"
                                />

                                Carregando instituições...

                            </div>

                        ) : conexoes.length === 0 ? (

                            <div className="open-finance-conexoes-vazio">

                                <Building2 size={25} />

                                <div>

                                    <strong>
                                        Nenhuma instituição conectada
                                    </strong>

                                    <span>
                                        Use o botão acima para fazer sua
                                        primeira conexão.
                                    </span>

                                </div>

                            </div>

                        ) : (

                            <div className="open-finance-conexoes-lista">

                                {conexoes.map(
                                    (conexao) => (

                                        <article
                                            key={conexao.id}
                                            className="open-finance-conexao-card"
                                        >

                                            <div className="open-finance-conexao-icone">
                                                <Building2 size={25} />
                                            </div>

                                            <div className="open-finance-conexao-info">

                                                <strong>
                                                    {conexao.instituicao_nome ||
                                                        "Instituição financeira"}
                                                </strong>

                                                <span>
                                                    Open Finance
                                                </span>

                                                <small className="open-finance-conexao-ultima">
                                                    Última sincronização:{" "}
                                                    {formatarUltimaSincronizacao(
                                                        conexao.ultima_sincronizacao_em
                                                    )}
                                                </small>

                                            </div>

                                            <div className="open-finance-conexao-acoes">

                                                <div className="open-finance-conexao-status">

                                                    <CheckCircle2 size={17} />

                                                    {String(
                                                        conexao.status ?? ""
                                                    ).toUpperCase() === "UPDATED"
                                                        ? "Sincronizado"
                                                        : conexao.status ?? "Conectado"}

                                                </div>


                                                <button
                                                    type="button"
                                                    className="open-finance-sync-button"
                                                    onClick={() =>
                                                        sincronizarAgora(
                                                            conexao
                                                        )
                                                    }
                                                    disabled={
                                                        Boolean(
                                                            sincronizandoId
                                                        ) ||
                                                        carregandoPlano ||
                                                        !possuiOpenFinance
                                                    }
                                                >

                                                    {sincronizandoId ===
                                                        conexao.id ? (
                                                        <>
                                                            <LoaderCircle
                                                                size={16}
                                                                className="open-finance-spinner"
                                                            />

                                                            Sincronizando...
                                                        </>
                                                    ) : !possuiOpenFinance ? (
                                                        <>
                                                            <LockKeyhole size={16} />

                                                            Premium necessário
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw size={16} />

                                                            Sincronizar agora
                                                        </>
                                                    )}

                                                </button>

                                                <button
                                                    type="button"
                                                    className="open-finance-disconnect-button"
                                                    onClick={() =>
                                                        abrirConfirmacaoDesconexao(
                                                            conexao
                                                        )
                                                    }
                                                    disabled={
                                                        Boolean(
                                                            sincronizandoId
                                                        ) ||
                                                        desconectando
                                                    }
                                                >
                                                    Desconectar
                                                </button>

                                            </div>

                                        </article>

                                    )
                                )}

                            </div>

                        )}

                    </section>


                    <section className="open-finance-beneficios">

                        <article>

                            <div className="open-finance-beneficio-icon">
                                <ShieldCheck size={23} />
                            </div>

                            <div>
                                <strong>
                                    Ambiente seguro
                                </strong>

                                <p>
                                    A autorização acontece no ambiente
                                    de conexão da instituição financeira.
                                </p>
                            </div>

                        </article>


                        <article>

                            <div className="open-finance-beneficio-icon">
                                <RefreshCw size={23} />
                            </div>

                            <div>
                                <strong>
                                    Dados sincronizados
                                </strong>

                                <p>
                                    A estrutura permitirá atualizar saldos
                                    e movimentações sem lançamentos manuais.
                                </p>
                            </div>

                        </article>


                        <article>

                            <div className="open-finance-beneficio-icon">
                                <LockKeyhole size={23} />
                            </div>

                            <div>
                                <strong>
                                    Você mantém o controle
                                </strong>

                                <p>
                                    As conexões poderão ser gerenciadas
                                    e removidas pelo próprio usuário.
                                </p>
                            </div>

                        </article>

                    </section>


                    {itemCriado?.id && (

                        <section className="open-finance-conectado">

                            <Building2 size={24} />

                            <div>

                                <strong>
                                    Primeira conexão detectada
                                </strong>

                                <span>
                                    O próximo passo será registrar esta
                                    conexão no banco do Rumo e sincronizar
                                    contas e movimentações.
                                </span>

                            </div>

                        </section>

                    )}


                    {connectToken && (

                        <PluggyConnect
                            key={connectToken}
                            connectToken={connectToken}

                            includeSandbox={true}

                            language="pt"

                            countries={[
                                "BR"
                            ]}

                            theme="light"

                            allowConnectInBackground={false}

                            innerRef={
                                registrarInstancia
                            }

                            onSuccess={
                                conexaoConcluida
                            }

                            onError={
                                erroConexao
                            }

                            onLoadError={
                                erroCarregamento
                            }

                            onClose={
                                widgetFechado
                            }
                        />

                    )}

                </div>

                <ModalConfirmacao
                    aberto={
                        Boolean(
                            conexaoDesconectar
                        )
                    }

                    titulo="Desconectar instituição"

                    mensagem={
                        conexaoDesconectar
                            ? `Deseja desconectar ${conexaoDesconectar.instituicao_nome || "esta instituição"}? O acesso Open Finance será revogado e novas sincronizações serão interrompidas. As contas e movimentações já importadas permanecerão no Rumo.`
                            : ""
                    }

                    onCancelar={
                        cancelarDesconexao
                    }

                    onConfirmar={
                        confirmarDesconexao
                    }

                    textoConfirmar="Desconectar instituição"

                    confirmando={
                        desconectando
                    }
                />

            </PageContainer>

        </MainLayout>

    );

}


export default OpenFinance;