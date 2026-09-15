import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import PageHeader from "../components/ui/PageHeader";

import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  List,
  SlidersHorizontal,
  ChevronRight,
  ArrowLeft,
  Search,
  X,
  PenLine,
  FileUp,
  Sparkles
} from "lucide-react";

import CardResumo from "../components/ui/CardResumo";
import ItemMovimentacao from "../components/ui/ItemMovimentacao";
import ModalNovaMovimentacao from "../components/ui/ModalNovaMovimentacao";
import ModalImportarComprovante from "../components/ui/ModalImportarComprovante";
import ModalConfirmacao from "../components/ui/ModalConfirmacao";

import { supabase } from "../services/supabase";

import {
  listarMovimentacoes,
  excluirMovimentacao
} from "../services/movimentacoes";

import { useToast } from "../context/ToastContext";

import "./Movimentacoes.css";


function Movimentacoes() {

  const { showToast } = useToast();

  const [modalAberto, setModalAberto] = useState(false);

  const [
    modalEscolhaAberto,
    setModalEscolhaAberto
  ] = useState(false);

  const [
    modalImportarComprovanteAberto,
    setModalImportarComprovanteAberto
  ] = useState(false);


  const [
    dadosImportados,
    setDadosImportados
  ] = useState(null);

  const [
    movimentacaoEditando,
    setMovimentacaoEditando
  ] = useState(null);

  const [
    movimentacaoExcluindo,
    setMovimentacaoExcluindo
  ] = useState(null);

  const [movimentacoes, setMovimentacoes] = useState([]);

  const [
    movimentacoesFiltradas,
    setMovimentacoesFiltradas
  ] = useState([]);

  const [pesquisa, setPesquisa] = useState("");

  const [
    mesSelecionado,
    setMesSelecionado
  ] = useState("");

  const [
    contaSelecionada,
    setContaSelecionada
  ] = useState("");

  const [
    categoriaSelecionada,
    setCategoriaSelecionada
  ] = useState("");

  const [
    tipoFiltro,
    setTipoFiltro
  ] = useState("");

  const [visaoAtiva, setVisaoAtiva] = useState("todas");

  const [
    painelFiltrosAberto,
    setPainelFiltrosAberto
  ] = useState(false);

  const [
    painelPeriodoAberto,
    setPainelPeriodoAberto
  ] = useState(false);

  const [
    dataInicial,
    setDataInicial
  ] = useState("");

  const [
    dataFinal,
    setDataFinal
  ] = useState("");


  // =====================================================
  // CONTAS DISPONÍVEIS
  // =====================================================

  const contas = [

    ...new Map(

      movimentacoes
        .filter((mov) => mov.conta?.nome)
        .map((mov) => [

          mov.conta.nome,

          {
            id:
              mov.conta_id ||
              mov.conta.nome,

            nome:
              mov.conta.nome
          }

        ])

    ).values()

  ];


  // =====================================================
  // CATEGORIAS DISPONÍVEIS
  // =====================================================

  const categorias = [

    ...new Map(

      movimentacoes
        .filter((mov) => mov.categoria?.nome)
        .map((mov) => [

          mov.categoria.nome,

          {
            id:
              mov.categoria_id ||
              mov.categoria.nome,

            nome:
              mov.categoria.nome
          }

        ])

    ).values()

  ];


  // =====================================================
  // MESES DISPONÍVEIS
  // =====================================================

  const meses = [

    ...new Set(

      movimentacoes
        .map(
          (mov) =>
            mov.data_movimentacao?.slice(0, 7)
        )
        .filter(Boolean)

    )

  ]
    .sort()
    .reverse();


  function formatarMes(valor) {

    const [ano, mes] =
      valor.split("-");

    const data =
      new Date(
        Number(ano),
        Number(mes) - 1,
        1
      );

    const texto =
      data.toLocaleDateString(
        "pt-BR",
        {
          month: "long",
          year: "numeric"
        }
      );

    return (
      texto.charAt(0).toUpperCase() +
      texto.slice(1)
    );

  }


  // =====================================================
  // TOTAIS REALIZADOS
  // Movimentações futuras permanecem na lista,
  // mas não entram nos indicadores atuais.
  // =====================================================

  const agora = new Date();

  const hojeTexto =
    `${agora.getFullYear()}-` +
    `${String(
      agora.getMonth() + 1
    ).padStart(2, "0")}-` +
    `${String(
      agora.getDate()
    ).padStart(2, "0")}`;


  const movimentacoesRealizadas =
    movimentacoesFiltradas.filter(
      (mov) =>
        mov.origem_exibicao !== "credito" &&
        mov.data_movimentacao &&
        mov.data_movimentacao <=
        hojeTexto
    );


  const totalReceitas =
    movimentacoesRealizadas

      .filter(
        (mov) =>
          mov.tipo === "receita"
      )

      .reduce(
        (total, mov) =>
          total + Number(mov.valor),
        0
      );


  const totalDespesas =
    movimentacoesRealizadas

      .filter(
        (mov) =>
          mov.tipo === "despesa"
      )

      .reduce(
        (total, mov) =>
          total + Number(mov.valor),
        0
      );


  const saldo =
    totalReceitas -
    totalDespesas;


  const quantidade =
    movimentacoesRealizadas.length;


  function formatarMoeda(valor) {

    return Number(
      valor || 0
    ).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );

  }


  // =====================================================
  // CARREGAR MOVIMENTAÇÕES
  // =====================================================

  useEffect(() => {

    carregarMovimentacoes();

  }, []);


  async function carregarMovimentacoes() {

    const {
      data: { user }
    } =
      await supabase.auth.getUser();


    if (!user) return;


    try {

      /*
       * 1. Movimentações reais:
       * dinheiro que entrou ou saiu de uma conta.
       */
      const movimentacoesNormais =
        await listarMovimentacoes(
          user.id
        );


      /*
       * 2. Compras realizadas no cartão.
       *
       * Entram nesta tela apenas como EVENTO
       * financeiro. Não são inseridas novamente
       * em rumo.movimentacoes.
       */
      const {
        data: comprasCartao,
        error: erroCompras
      } =
        await supabase
          .schema("rumo")
          .from("compras_cartao")
          .select(`
          id,
          cartao_id,
          categoria_id,
          descricao,
          valor_total,
          data_compra,
          parcelas_total,
          status,

          categoria:categorias(
            id,
            nome,
            icone,
            cor
          ),

          cartao:cartoes(
            id,
            nome,
            banco,
            final_cartao
          )
        `)
          .eq(
            "usuario_id",
            user.id
          )
          .eq(
            "status",
            "ativa"
          );


      if (erroCompras) {
        throw erroCompras;
      }


      /*
       * Normalizamos a compra para o mesmo formato
       * visual utilizado pela página Movimentações.
       */
      const eventosCredito =
        (
          comprasCartao || []
        ).map(
          (compra) => ({

            id:
              `credito-${compra.id}`,

            id_origem:
              compra.id,

            origem_exibicao:
              "credito",

            tipo:
              "despesa",

            descricao:
              compra.descricao,

            valor:
              Number(
                compra.valor_total || 0
              ),

            data_movimentacao:
              compra.data_compra,

            categoria_id:
              compra.categoria_id,

            categoria:
              compra.categoria,

            conta_id:
              compra.cartao_id,

            conta: {
              nome:
                compra.cartao?.nome ||
                "Cartão de crédito",

              banco:
                compra.cartao?.banco ||
                null
            },

            cartao:
              compra.cartao,

            parcelas_total:
              Number(
                compra.parcelas_total || 1
              )

          })
        );


      /*
       * Uma única linha do tempo.
       */
      const eventos = [

        ...(movimentacoesNormais || []).map(
          (mov) => ({
            ...mov,

            origem_exibicao:
              mov.origem_exibicao ||
              "movimentacao"
          })
        ),

        ...eventosCredito

      ].sort(
        (a, b) =>
          String(
            b.data_movimentacao || ""
          ).localeCompare(
            String(
              a.data_movimentacao || ""
            )
          )
      );


      setMovimentacoes(
        eventos
      );

      setMovimentacoesFiltradas(
        eventos
      );


    } catch (error) {

      console.error(
        "Erro ao carregar movimentações:",
        error
      );

      showToast(
        "Erro",
        error.message ||
        "Não foi possível carregar as movimentações.",
        "danger"
      );

    }

  }


  // =====================================================
  // FILTROS
  // =====================================================

  useEffect(() => {

    const texto =
      pesquisa
        .trim()
        .toLowerCase();


    const resultado =
      movimentacoes.filter(
        (mov) => {

          const descricaoOk =

            !texto ||

            (mov.descricao || "")
              .toLowerCase()
              .includes(texto);


          const tipoDaVisao =
            visaoAtiva === "receitas"
              ? "receita"
              : visaoAtiva === "despesas"
                ? "despesa"
                : "";

          const tipoAplicado =
            tipoFiltro ||
            tipoDaVisao;

          const tipoOk =
            !tipoAplicado ||
            mov.tipo === tipoAplicado;


          const contaOk =

            !contaSelecionada ||

            mov.conta?.nome ===
            contaSelecionada;


          const categoriaOk =

            !categoriaSelecionada ||

            mov.categoria?.nome ===
            categoriaSelecionada;


          const mesMovimentacao =

            mov.data_movimentacao
              ?.slice(0, 7);


          const mesOk =

            !mesSelecionado ||

            mesMovimentacao ===
            mesSelecionado;

          const dataOk =
            (!dataInicial ||
              mov.data_movimentacao >= dataInicial) &&
            (!dataFinal ||
              mov.data_movimentacao <= dataFinal);


          return (

            descricaoOk &&

            tipoOk &&

            contaOk &&

            categoriaOk &&

            mesOk &&

            dataOk

          );

        }

      );


    setMovimentacoesFiltradas(
      resultado
    );


  }, [

    pesquisa,

    mesSelecionado,

    contaSelecionada,

    categoriaSelecionada,

    tipoFiltro,

    visaoAtiva,

    movimentacoes,

    dataInicial,
    dataFinal,



  ]);


  // =====================================================
  // LIMPAR FILTROS
  // =====================================================

  function limparFiltros() {

    setPesquisa("");

    setMesSelecionado("");

    setContaSelecionada("");

    setCategoriaSelecionada("");

    setTipoFiltro("");

    setDataInicial("");
    setDataFinal("");

  }


  // =====================================================
  // EDITAR
  // =====================================================

  function abrirEdicao(mov) {

    setMovimentacaoEditando(
      mov
    );

  }


  function fecharEdicao() {

    setMovimentacaoEditando(
      null
    );

  }


  // =====================================================
  // EXCLUIR
  // =====================================================

  function solicitarExclusao(mov) {

    setMovimentacaoExcluindo(
      mov
    );

  }


  function cancelarExclusao() {

    setMovimentacaoExcluindo(
      null
    );

  }


  async function confirmarExclusao() {

    if (
      !movimentacaoExcluindo?.id
    ) {
      return;
    }


    try {

      await excluirMovimentacao(
        movimentacaoExcluindo.id
      );


      showToast(
        "Sucesso",
        "Movimentação excluída com sucesso!",
        "success"
      );


      setMovimentacaoExcluindo(
        null
      );


      await carregarMovimentacoes();


    } catch (error) {

      console.error(
        "Erro ao excluir movimentação:",
        error
      );


      showToast(
        "Erro",
        error.message ||
        "Não foi possível excluir a movimentação.",
        "danger"
      );

    }

  }

  function abrirEscolhaNovaMovimentacao() {

    setModalEscolhaAberto(true);

  }


  function abrirMovimentacaoManual() {

    setModalEscolhaAberto(false);

    setModalAberto(true);

  }


  function abrirImportacaoComprovante() {

    setModalEscolhaAberto(false);

    setModalImportarComprovanteAberto(
      true
    );

  }

  function normalizarTextoInstituicao(valor) {

    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  }


  function encontrarContaPorInstituicao(
    contas,
    instituicao
  ) {

    const texto =
      normalizarTextoInstituicao(
        instituicao
      );


    if (!texto) {
      return null;
    }


    /*
     * MAREE IP LTDA. é a instituição
     * utilizada pela conta Shopee.
     */
    if (
      texto.includes("maree") ||
      texto.includes("shopee")
    ) {

      return contas.find(
        (conta) =>
          normalizarTextoInstituicao(
            conta.banco
          ).includes("shopee") ||
          normalizarTextoInstituicao(
            conta.nome
          ).includes("shopee")
      ) || null;

    }


    /*
     * Nu Pagamentos / Nu Financeira /
     * Nubank.
     */
    if (
      texto.includes("nupagamentos") ||
      texto.includes("nubank") ||
      texto.includes("nufinanceira")
    ) {

      return contas.find(
        (conta) =>
          normalizarTextoInstituicao(
            conta.banco
          ).includes("nubank") ||
          normalizarTextoInstituicao(
            conta.nome
          ) === "nu" ||
          normalizarTextoInstituicao(
            conta.nome
          ).includes("nubank")
      ) || null;

    }


    /*
     * Mercado Pago.
     */
    if (
      texto.includes("mercadopago") ||
      texto.includes("mercadolivre")
    ) {

      return contas.find(
        (conta) =>
          normalizarTextoInstituicao(
            conta.banco
          ).includes("mercadopago") ||
          normalizarTextoInstituicao(
            conta.nome
          ).includes("mercadopago") ||
          normalizarTextoInstituicao(
            conta.nome
          ) === "mp"
      ) || null;

    }


    /*
     * Banco Inter.
     */
    if (
      texto.includes("bancointer") ||
      texto === "inter"
    ) {

      return contas.find(
        (conta) =>
          normalizarTextoInstituicao(
            conta.banco
          ).includes("inter") ||
          normalizarTextoInstituicao(
            conta.nome
          ).includes("inter")
      ) || null;

    }


    /*
     * Bradesco.
     */
    if (
      texto.includes("bradesco")
    ) {

      return contas.find(
        (conta) =>
          normalizarTextoInstituicao(
            conta.banco
          ).includes("bradesco") ||
          normalizarTextoInstituicao(
            conta.nome
          ).includes("bradesco")
      ) || null;

    }


    /*
     * Tentativa genérica para outras
     * instituições.
     */
    return contas.find(
      (conta) => {

        const banco =
          normalizarTextoInstituicao(
            conta.banco
          );

        const nome =
          normalizarTextoInstituicao(
            conta.nome
          );

        return (
          banco &&
          (
            texto.includes(banco) ||
            banco.includes(texto)
          )
        ) || (
            nome &&
            (
              texto.includes(nome) ||
              nome.includes(texto)
            )
          );

      }
    ) || null;

  }

  async function usarDadosComprovante(
    dados
  ) {

    try {

      let dadosPreparados = {
        ...dados
      };


      /*
       * Quando o parser identificou uma
       * transferência entre contas próprias,
       * tentamos localizar automaticamente
       * origem e destino nas contas do usuário.
       */
      const {
        data: { user }
      } =
        await supabase.auth.getUser();


      if (!user) {
        throw new Error(
          "Usuário não autenticado."
        );
      }


      const {
        data: contasUsuario,
        error
      } =
        await supabase
          .schema("rumo")
          .from("contas")
          .select(`
      id,
      nome,
      banco
    `)
          .eq(
            "usuario_id",
            user.id
          )
          .eq(
            "ativo",
            true
          );


      if (error) {
        throw error;
      }


      const contaOrigem =
        encontrarContaPorInstituicao(
          contasUsuario || [],
          dados?.origemInstituicao
        );


      const contaDestino =
        encontrarContaPorInstituicao(
          contasUsuario || [],
          dados?.destinoInstituicao
        );


      console.log(
        "[IMPORTADOR] Contas resolvidas:",
        {
          tipo:
            dados?.tipo,

          origemInstituicao:
            dados?.origemInstituicao,

          destinoInstituicao:
            dados?.destinoInstituicao,

          contaOrigem:
            contaOrigem?.nome || null,

          contaDestino:
            contaDestino?.nome || null
        }
      );


      /*
       * =====================================================
       * TRANSFERÊNCIA
       * =====================================================
       */
      if (
        dados?.tipo === "transferencia" ||
        dados?.transferenciaPropria
      ) {

        dadosPreparados = {

          ...dados,

          tipo:
            "transferencia",

          conta_id:
            contaOrigem?.id || "",

          conta_destino_id:
            contaDestino?.id || "",

          descricao:
            dados?.descricaoOriginal ||
            (
              contaOrigem?.nome &&
                contaDestino?.nome
                ? `Transferência ${contaOrigem.nome} → ${contaDestino.nome}`
                : dados?.descricao ||
                "Transferência entre contas"
            )

        };

      }


      /*
       * =====================================================
       * DESPESA
       * A conta movimentada é a ORIGEM.
       * =====================================================
       */
      else if (
        dados?.tipo === "despesa"
      ) {

        dadosPreparados = {

          ...dados,

          conta_id:
            contaOrigem?.id || "",

          conta_destino_id:
            null,

          descricao:
            dados?.descricaoOriginal ||
            dados?.descricao ||
            (
              dados?.destinoNome
                ? `Pix para ${dados.destinoNome}`
                : "Pagamento importado"
            )

        };

      }


      /*
       * =====================================================
       * RECEITA
       * A conta movimentada é o DESTINO.
       * =====================================================
       */
      else if (
        dados?.tipo === "receita"
      ) {

        dadosPreparados = {

          ...dados,

          conta_id:
            contaDestino?.id || "",

          conta_destino_id:
            null,

          descricao:
            dados?.descricaoOriginal ||
            dados?.descricao ||
            (
              dados?.origemNome
                ? `Pix recebido de ${dados.origemNome}`
                : "Recebimento importado"
            )

        };

      }


      setDadosImportados(
        dadosPreparados
      );


      setModalImportarComprovanteAberto(
        false
      );


      setModalAberto(
        true
      );

    } catch (error) {

      console.error(
        "[IMPORTADOR] Erro ao preparar comprovante:",
        error
      );


      showToast(
        "Erro",
        error.message ||
        "Não foi possível preparar os dados do comprovante.",
        "danger"
      );

    }

  }


  // =====================================================
  // TELA
  // =====================================================

  return (

    <MainLayout>

      <div className="movimentacoes-page">


        <PageHeader

          titulo="Movimentações"

          subtitulo="Gerencie todas as suas receitas e despesas."

        >

          <button

            className="btn-nova-movimentacao"

            onClick={
              abrirEscolhaNovaMovimentacao
            }

          >

            + Nova Movimentação

          </button>

        </PageHeader>


        <div className="dashboard-cards">

          <div
            className={`movimentacoes-card-navegavel ${visaoAtiva === "receitas"
              ? "selecionado"
              : ""
              }`}
            role="button"
            tabIndex={0}
            onClick={() =>
              setVisaoAtiva("receitas")
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === " "
              ) {
                setVisaoAtiva("receitas");
              }
            }}
          >
            <CardResumo
              titulo="Receitas"
              subtitulo="Entradas do período"
              valor={formatarMoeda(totalReceitas)}
              cor="green"
              icone={
                <ArrowUpRight size={30} />
              }
            />

            <ChevronRight
              className="movimentacoes-card-chevron"
              size={17}
            />
          </div>


          <div
            className={`movimentacoes-card-navegavel ${visaoAtiva === "despesas"
              ? "selecionado"
              : ""
              }`}
            role="button"
            tabIndex={0}
            onClick={() =>
              setVisaoAtiva("despesas")
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === " "
              ) {
                setVisaoAtiva("despesas");
              }
            }}
          >
            <CardResumo
              titulo="Despesas"
              subtitulo="Saídas do período"
              valor={formatarMoeda(totalDespesas)}
              cor="red"
              icone={
                <ArrowDownRight size={30} />
              }
            />

            <ChevronRight
              className="movimentacoes-card-chevron"
              size={17}
            />
          </div>


          <div className="movimentacoes-card-informativo">
            <CardResumo
              titulo="Saldo"
              subtitulo="Resultado"
              valor={formatarMoeda(saldo)}
              cor="blue"
              icone={
                <Wallet size={30} />
              }
            />
          </div>


          <div
            className={`movimentacoes-card-navegavel ${visaoAtiva === "todas"
              ? "selecionado"
              : ""
              }`}
            role="button"
            tabIndex={0}
            onClick={() =>
              setVisaoAtiva("todas")
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === " "
              ) {
                setVisaoAtiva("todas");
              }
            }}
          >
            <CardResumo
              titulo="Movimentações"
              subtitulo="Lançamentos"
              valor={quantidade}
              cor="purple"
              icone={
                <List size={30} />
              }
            />

            <ChevronRight
              className="movimentacoes-card-chevron"
              size={17}
            />
          </div>

        </div>

        <div className="movimentacoes-lista-cabecalho">

          <div className="movimentacoes-lista-contexto">

            {visaoAtiva !== "todas" && (
              <button
                type="button"
                className="movimentacoes-voltar"
                onClick={() =>
                  setVisaoAtiva("todas")
                }
                aria-label="Voltar para todas as movimentações"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div>
              <h2>
                {visaoAtiva === "receitas"
                  ? "Receitas"
                  : visaoAtiva === "despesas"
                    ? "Despesas"
                    : "Movimentações"}
              </h2>

              <span>
                {movimentacoesFiltradas.length}
                {" "}
                {movimentacoesFiltradas.length === 1
                  ? "lançamento"
                  : "lançamentos"}
              </span>
            </div>

          </div>

          <div className="movimentacoes-acoes-mobile">

            <button
              type="button"
              className={`movimentacoes-btn-periodo-mobile ${dataInicial || dataFinal
                ? "active"
                : ""
                }`}
              onClick={() =>
                setPainelPeriodoAberto(true)
              }
              aria-label="Pesquisar movimentações por período"
              title="Pesquisar por período"
            >
              <Search size={18} />
            </button>


            <button
              type="button"
              className="movimentacoes-btn-filtros-mobile"
              onClick={() =>
                setPainelFiltrosAberto(true)
              }
            >
              <SlidersHorizontal size={17} />

              <span>Filtros</span>
            </button>

          </div>

        </div>


        <div className="movimentacoes-filtros">


          <input

            type="text"

            placeholder="🔍 Pesquisar descrição..."

            className="filtro-pesquisa"

            value={
              pesquisa
            }

            onChange={
              (e) =>
                setPesquisa(
                  e.target.value
                )
            }

          />


          <select

            className="filtro-select"

            value={
              mesSelecionado
            }

            onChange={
              (e) =>
                setMesSelecionado(
                  e.target.value
                )
            }

          >

            <option value="">

              Todos os meses

            </option>


            {
              meses.map(
                (mes) => (

                  <option

                    key={mes}

                    value={mes}

                  >

                    {
                      formatarMes(
                        mes
                      )
                    }

                  </option>

                )
              )
            }

          </select>


          <select

            className="filtro-select"

            value={
              contaSelecionada
            }

            onChange={
              (e) =>
                setContaSelecionada(
                  e.target.value
                )
            }

          >

            <option value="">

              Todas as contas

            </option>


            {
              contas.map(
                (conta) => (

                  <option

                    key={
                      conta.id
                    }

                    value={
                      conta.nome
                    }

                  >

                    {
                      conta.nome
                    }

                  </option>

                )
              )
            }

          </select>


          <select

            className="filtro-select"

            value={
              categoriaSelecionada
            }

            onChange={
              (e) =>
                setCategoriaSelecionada(
                  e.target.value
                )
            }

          >

            <option value="">

              Todas categorias

            </option>


            {
              categorias.map(
                (categoria) => (

                  <option

                    key={
                      categoria.id
                    }

                    value={
                      categoria.nome
                    }

                  >

                    {
                      categoria.nome
                    }

                  </option>

                )
              )
            }

          </select>


          <select

            className="filtro-select"

            value={
              tipoFiltro
            }

            onChange={
              (e) =>
                setTipoFiltro(
                  e.target.value
                )
            }

          >

            <option value="">

              Receitas e Despesas

            </option>

            <option value="receita">

              Receitas

            </option>

            <option value="despesa">

              Despesas

            </option>

          </select>


          <button

            className="btn-limpar"

            onClick={
              limparFiltros
            }

          >

            Limpar

          </button>


        </div>

        {painelPeriodoAberto && (

          <div className="movimentacoes-filtro-overlay">

            <div className="movimentacoes-periodo-mobile">

              <div className="movimentacoes-filtro-header">

                <div>
                  <span>Movimentações</span>
                  <h2>Pesquisar por período</h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPainelPeriodoAberto(false)
                  }
                  aria-label="Fechar"
                >
                  <X size={22} />
                </button>

              </div>


              <div className="movimentacoes-periodo-conteudo">

                <label>
                  <span>De</span>

                  <input
                    type="date"
                    value={dataInicial}
                    onChange={(e) =>
                      setDataInicial(
                        e.target.value
                      )
                    }
                  />
                </label>


                <label>
                  <span>Até</span>

                  <input
                    type="date"
                    value={dataFinal}
                    min={dataInicial || undefined}
                    onChange={(e) =>
                      setDataFinal(
                        e.target.value
                      )
                    }
                  />
                </label>

              </div>


              <div className="movimentacoes-filtro-footer">

                <button
                  type="button"
                  className="movimentacoes-filtro-limpar"
                  onClick={() => {
                    setDataInicial("");
                    setDataFinal("");
                  }}
                >
                  Limpar
                </button>

                <button
                  type="button"
                  className="movimentacoes-filtro-aplicar"
                  onClick={() =>
                    setPainelPeriodoAberto(false)
                  }
                >
                  Ver movimentações
                </button>

              </div>

            </div>

          </div>

        )}

        {painelFiltrosAberto && (

          <div className="movimentacoes-filtro-overlay">

            <div className="movimentacoes-filtro-mobile">

              <div className="movimentacoes-filtro-header">

                <div>
                  <span>Refinar resultados</span>
                  <h2>Filtros</h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPainelFiltrosAberto(false)
                  }
                  aria-label="Fechar filtros"
                >
                  <X size={22} />
                </button>

              </div>


              <div className="movimentacoes-filtro-conteudo">

                <label className="movimentacoes-filtro-campo">

                  <span>Pesquisar</span>

                  <div className="movimentacoes-filtro-pesquisa">
                    <Search size={18} />

                    <input
                      type="text"
                      placeholder="Descrição da movimentação"
                      value={pesquisa}
                      onChange={(e) =>
                        setPesquisa(
                          e.target.value
                        )
                      }
                    />
                  </div>

                </label>


                <label className="movimentacoes-filtro-campo">

                  <span>Período</span>

                  <select
                    value={mesSelecionado}
                    onChange={(e) =>
                      setMesSelecionado(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Todos os meses
                    </option>

                    {meses.map((mes) => (
                      <option
                        key={mes}
                        value={mes}
                      >
                        {formatarMes(mes)}
                      </option>
                    ))}
                  </select>

                </label>


                <label className="movimentacoes-filtro-campo">

                  <span>Conta</span>

                  <select
                    value={contaSelecionada}
                    onChange={(e) =>
                      setContaSelecionada(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Todas as contas
                    </option>

                    {contas.map((conta) => (
                      <option
                        key={conta.id}
                        value={conta.nome}
                      >
                        {conta.nome}
                      </option>
                    ))}
                  </select>

                </label>


                <label className="movimentacoes-filtro-campo">

                  <span>Categoria</span>

                  <select
                    value={categoriaSelecionada}
                    onChange={(e) =>
                      setCategoriaSelecionada(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Todas as categorias
                    </option>

                    {categorias.map(
                      (categoria) => (
                        <option
                          key={categoria.id}
                          value={
                            categoria.nome
                          }
                        >
                          {
                            categoria.nome
                          }
                        </option>
                      )
                    )}
                  </select>

                </label>


                {visaoAtiva === "todas" && (

                  <label className="movimentacoes-filtro-campo">

                    <span>Tipo</span>

                    <div className="movimentacoes-tipo-filtro">

                      <button
                        type="button"
                        className={
                          tipoFiltro === ""
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setTipoFiltro("")
                        }
                      >
                        Todos
                      </button>

                      <button
                        type="button"
                        className={
                          tipoFiltro === "receita"
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setTipoFiltro(
                            "receita"
                          )
                        }
                      >
                        Receitas
                      </button>

                      <button
                        type="button"
                        className={
                          tipoFiltro === "despesa"
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setTipoFiltro(
                            "despesa"
                          )
                        }
                      >
                        Despesas
                      </button>

                    </div>

                  </label>

                )}

              </div>


              <div className="movimentacoes-filtro-footer">

                <button
                  type="button"
                  className="movimentacoes-filtro-limpar"
                  onClick={limparFiltros}
                >
                  Limpar
                </button>

                <button
                  type="button"
                  className="movimentacoes-filtro-aplicar"
                  onClick={() =>
                    setPainelFiltrosAberto(false)
                  }
                >
                  Aplicar filtros
                </button>

              </div>

            </div>

          </div>

        )}


        {
          movimentacoesFiltradas.map(
            (mov) => (

              <ItemMovimentacao

                key={
                  mov.id
                }

                movimentacao={{

                  tipo:
                    mov.tipo,

                  descricao:
                    mov.descricao,

                  categoria:
                    mov.categoria?.nome,

                  categoriaIcone:
                    mov.categoria?.icone,

                  categoriaCor:
                    mov.categoria?.cor,

                  conta:
                    mov.conta?.nome,

                  contaBanco:
                    mov.conta?.banco,

                  contaDestino:
                    mov.conta_destino?.nome,

                  contaDestinoBanco:
                    mov.conta_destino?.banco,

                  data:
                    new Date(
                      `${mov.data_movimentacao}T12:00:00`
                    ).toLocaleDateString(
                      "pt-BR"
                    ),

                  prevista:
                    mov.data_movimentacao >
                    hojeTexto,

                  valor:
                    mov.valor,

                  origem:
                    mov.origem_exibicao,

                  parcelasTotal:
                    mov.parcelas_total,

                  cartaoNome:
                    mov.cartao?.nome,

                  cartaoFinal:
                    mov.cartao?.final_cartao

                }}

                onEditar={
                  mov.origem_exibicao === "credito"
                    ? undefined
                    : () =>
                      abrirEdicao(
                        mov
                      )
                }

                onExcluir={
                  mov.origem_exibicao === "credito"
                    ? undefined
                    : () =>
                      solicitarExclusao(
                        mov
                      )
                }

              />

            )
          )
        }

        {
          modalEscolhaAberto && (

            <div
              className="movimentacao-escolha-overlay"
              onMouseDown={(e) => {

                if (
                  e.target ===
                  e.currentTarget
                ) {

                  setModalEscolhaAberto(
                    false
                  );

                }

              }}
            >

              <div className="movimentacao-escolha-modal">

                <div className="movimentacao-escolha-header">

                  <div>

                    <span className="movimentacao-escolha-kicker">
                      NOVA MOVIMENTAÇÃO
                    </span>

                    <h2>
                      Como deseja registrar?
                    </h2>

                    <p>
                      Escolha a forma mais rápida
                      para adicionar sua movimentação.
                    </p>

                  </div>


                  <button
                    type="button"
                    className="movimentacao-escolha-fechar"
                    onClick={() =>
                      setModalEscolhaAberto(
                        false
                      )
                    }
                    aria-label="Fechar"
                  >
                    <X size={19} />
                  </button>

                </div>


                <div className="movimentacao-escolha-opcoes">

                  <button
                    type="button"
                    className="movimentacao-escolha-card"
                    onClick={
                      abrirMovimentacaoManual
                    }
                  >

                    <div className="movimentacao-escolha-icone manual">
                      <PenLine size={23} />
                    </div>

                    <div className="movimentacao-escolha-conteudo">

                      <div className="movimentacao-escolha-titulo">
                        Manualmente
                      </div>

                      <div className="movimentacao-escolha-descricao">
                        Digite valor, conta,
                        categoria e demais dados.
                      </div>

                    </div>

                    <ChevronRight size={20} />

                  </button>


                  <button
                    type="button"
                    className="movimentacao-escolha-card importacao"
                    onClick={
                      abrirImportacaoComprovante
                    }
                  >

                    <div className="movimentacao-escolha-icone importar">
                      <FileUp size={23} />
                    </div>

                    <div className="movimentacao-escolha-conteudo">

                      <div className="movimentacao-escolha-titulo-linha">

                        <div className="movimentacao-escolha-titulo">
                          Importar comprovante
                        </div>

                        <span className="movimentacao-escolha-pro">
                          PRO
                        </span>

                      </div>

                      <div className="movimentacao-escolha-descricao">
                        Envie PDF, JPG ou PNG e
                        deixe o Rumo identificar
                        os dados.
                      </div>

                      <div className="movimentacao-escolha-inteligente">
                        <Sparkles size={12} />
                        Identificação automática
                      </div>

                    </div>

                    <ChevronRight size={20} />

                  </button>

                </div>

              </div>

            </div>

          )
        }

        {
          modalImportarComprovanteAberto && (

            <ModalImportarComprovante

              onFechar={() =>
                setModalImportarComprovanteAberto(
                  false
                )
              }

              onUsarDados={
                usarDadosComprovante
              }

            />

          )
        }


        {
          modalAberto && (

            <ModalNovaMovimentacao

              dadosIniciais={
                dadosImportados
              }

              onFechar={() =>
                setModalAberto(
                  false
                )
              }

              onSalvou={
                carregarMovimentacoes
              }

            />

          )
        }


        {
          movimentacaoEditando && (

            <ModalNovaMovimentacao

              movimentacao={
                movimentacaoEditando
              }

              onFechar={
                fecharEdicao
              }

              onSalvou={
                carregarMovimentacoes
              }

            />

          )
        }


        <ModalConfirmacao

          aberto={
            Boolean(
              movimentacaoExcluindo
            )
          }

          titulo="Excluir movimentação"

          mensagem={
            movimentacaoExcluindo
              ? `Deseja realmente excluir "${movimentacaoExcluindo.descricao}"? Esta ação não poderá ser desfeita.`
              : ""
          }

          onCancelar={
            cancelarExclusao
          }

          onConfirmar={
            confirmarExclusao
          }

        />

      </div>


    </MainLayout >

  );

}


export default Movimentacoes;