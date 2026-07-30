import { useState } from "react";
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
import { useEffect } from "react";
import { supabase } from "../services/supabase";
import { listarMovimentacoes } from "../services/movimentacoes";

import "./Movimentacoes.css";

function Movimentacoes() {

  const [modalAberto, setModalAberto] = useState(false);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [movimentacoesFiltradas, setMovimentacoesFiltradas] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [contaSelecionada, setContaSelecionada] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const contas = [
    ...new Map(
      movimentacoes.map((m) => [
        m.conta?.nome,
        {
          id: m.conta_id,
          nome: m.conta?.nome
        }
      ])
    ).values()
  ].filter(c => c.nome);

  const totalReceitas = movimentacoes
    .filter(m => m.tipo === "receita")
    .reduce((total, m) => total + Number(m.valor), 0);

  const totalDespesas = movimentacoes
    .filter(m => m.tipo === "despesa")
    .reduce((total, m) => total + Number(m.valor), 0);

  const saldo = totalReceitas - totalDespesas;

  const quantidade = movimentacoes.length;

  function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  }

  useEffect(() => {

    carregarMovimentacoes();

  }, []);

  async function carregarMovimentacoes() {

    const {
      data: { user }
    } = await supabase.auth.getUser();




    if (!user) return;

    try {

      const dados = await listarMovimentacoes(user.id);

      setMovimentacoes(dados);
      setMovimentacoesFiltradas(dados);

    } catch (error) {

      console.error("ERRO:", error);

    }

  }

  useEffect(() => {

    const texto = pesquisa.toLowerCase();

    const resultado = movimentacoes.filter((mov) => {

      const descricaoOk =
        mov.descricao
          .toLowerCase()
          .includes(texto);

      const tipoOk =
        !tipoFiltro ||
        mov.tipo === tipoFiltro;

      const contaOk =
        !contaSelecionada ||
        mov.conta?.nome === contaSelecionada;

      return (
        descricaoOk &&
        tipoOk &&
        contaOk
      );

    });

    setMovimentacoesFiltradas(resultado);

  }, [
    pesquisa,
    tipoFiltro,
    contaSelecionada,
    movimentacoes
  ]);

  return (

    <MainLayout>

      <PageHeader

        titulo="Movimentações"

        subtitulo="Gerencie todas as suas receitas e despesas."

      >

        <button
          className="btn-nova-movimentacao"
          onClick={() => setModalAberto(true)}
        >
          + Nova Movimentação
        </button>

      </PageHeader>

      <div className="dashboard-cards">


        <CardResumo
          titulo="Receitas"
          subtitulo="Entradas do período"
          valor={formatarMoeda(totalReceitas)}
          cor="green"
          icone={<ArrowUpRight size={30} />}
        />

        <CardResumo
          titulo="Despesas"
          subtitulo="Saídas do período"
          valor={formatarMoeda(totalDespesas)}
          cor="red"
          icone={<ArrowDownRight size={30} />}
        />

        <CardResumo
          titulo="Saldo"
          subtitulo="Resultado"
          valor={formatarMoeda(saldo)}
          cor="blue"
          icone={<Wallet size={30} />}
        />

        <CardResumo
          titulo="Movimentações"
          subtitulo="Lançamentos"
          valor={quantidade}
          cor="purple"
          icone={<List size={30} />}
        />

      </div>

      <div className="movimentacoes-filtros">

        <input
          type="text"
          placeholder="🔍 Pesquisar descrição..."
          className="filtro-pesquisa"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />

        <select className="filtro-select">

          <option>Todos os meses</option>

        </select>

        <select
          className="filtro-select"
          value={contaSelecionada}
          onChange={(e) => setContaSelecionada(e.target.value)}
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

        <select className="filtro-select">

          <option>Todas categorias</option>

        </select>

        <select
          className="filtro-select"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
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

        <button className="btn-limpar">

          Limpar

        </button>

      </div>



      {
        movimentacoesFiltradas.map((mov) => (

          <ItemMovimentacao

            key={mov.id}

            movimentacao={{

              tipo: mov.tipo,

              descricao: mov.descricao,

              categoria: mov.categoria?.nome,
              conta: mov.conta?.nome,

              data: new Date(

                mov.data_movimentacao

              ).toLocaleDateString("pt-BR"),

              valor: mov.valor

            }}

          />

        ))
      }


      {
        modalAberto && (
          <ModalNovaMovimentacao
            onFechar={() => setModalAberto(false)}
            onSalvou={carregarMovimentacoes}
          />
        )
      }

    </MainLayout>

  );

}

export default Movimentacoes;