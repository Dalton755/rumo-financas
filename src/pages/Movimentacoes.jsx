import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import PageHeader from "../components/ui/PageHeader";

import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  List
} from "lucide-react";

import CardResumo from "../components/ui/CardResumo";
import ItemMovimentacao from "../components/ui/ItemMovimentacao";
import ModalNovaMovimentacao from "../components/ui/ModalNovaMovimentacao";
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

      const dados =
        await listarMovimentacoes(
          user.id
        );

      setMovimentacoes(
        dados || []
      );

      setMovimentacoesFiltradas(
        dados || []
      );

    } catch (error) {

      console.error(
        "Erro ao carregar movimentações:",
        error
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


          const tipoOk =

            !tipoFiltro ||

            mov.tipo ===
            tipoFiltro;


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


          return (

            descricaoOk &&

            tipoOk &&

            contaOk &&

            categoriaOk &&

            mesOk

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

    movimentacoes

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


  // =====================================================
  // TELA
  // =====================================================

  return (

    <MainLayout>


      <PageHeader

        titulo="Movimentações"

        subtitulo="Gerencie todas as suas receitas e despesas."

      >

        <button

          className="btn-nova-movimentacao"

          onClick={() =>
            setModalAberto(true)
          }

        >

          + Nova Movimentação

        </button>

      </PageHeader>


      <div className="dashboard-cards">


        <CardResumo

          titulo="Receitas"

          subtitulo="Entradas do período"

          valor={
            formatarMoeda(
              totalReceitas
            )
          }

          cor="green"

          icone={
            <ArrowUpRight
              size={30}
            />
          }

        />


        <CardResumo

          titulo="Despesas"

          subtitulo="Saídas do período"

          valor={
            formatarMoeda(
              totalDespesas
            )
          }

          cor="red"

          icone={
            <ArrowDownRight
              size={30}
            />
          }

        />


        <CardResumo

          titulo="Saldo"

          subtitulo="Resultado"

          valor={
            formatarMoeda(
              saldo
            )
          }

          cor="blue"

          icone={
            <Wallet
              size={30}
            />
          }

        />


        <CardResumo

          titulo="Movimentações"

          subtitulo="Lançamentos"

          valor={
            quantidade
          }

          cor="purple"

          icone={
            <List
              size={30}
            />
          }

        />


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
                  mov.valor

              }}

              onEditar={() =>
                abrirEdicao(
                  mov
                )
              }

              onExcluir={() =>
                solicitarExclusao(
                  mov
                )
              }

            />

          )
        )
      }


      {
        modalAberto && (

          <ModalNovaMovimentacao

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


    </MainLayout>

  );

}


export default Movimentacoes;