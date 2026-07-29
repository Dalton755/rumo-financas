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

  useEffect(() => {

    carregarMovimentacoes();

  }, []);

  async function carregarMovimentacoes() {

    const {

      data: { user }

    } = await supabase.auth.getUser();

    if (!user) return;

    const dados = await listarMovimentacoes(

      user.id

    );

    setMovimentacoes(

      dados

    );

  }

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
          valor="R$ 0,00"
          cor="green"
          icone={<ArrowUpRight size={30} />}
        />

        <CardResumo
          titulo="Despesas"
          subtitulo="Saídas do período"
          valor="R$ 0,00"
          cor="red"
          icone={<ArrowDownRight size={30} />}
        />

        <CardResumo
          titulo="Saldo"
          subtitulo="Resultado"
          valor="R$ 0,00"
          cor="blue"
          icone={<Wallet size={30} />}
        />

        <CardResumo
          titulo="Movimentações"
          subtitulo="Lançamentos"
          valor="0"
          cor="purple"
          icone={<List size={30} />}
        />

      </div>

      <div className="movimentacoes-filtros">

        <input
          type="text"
          placeholder="🔍 Pesquisar descrição..."
          className="filtro-pesquisa"
        />

        <select className="filtro-select">

          <option>Todos os meses</option>

        </select>

        <select className="filtro-select">

          <option>Todas as contas</option>

        </select>

        <select className="filtro-select">

          <option>Todas categorias</option>

        </select>

        <select className="filtro-select">

          <option>Receitas e Despesas</option>
          <option>Receitas</option>
          <option>Despesas</option>

        </select>

        <button className="btn-limpar">

          Limpar

        </button>

      </div>

      {
        movimentacoes.map((mov) => (

          <ItemMovimentacao

            key={mov.id}

            movimentacao={{

              tipo: mov.tipo,

              descricao: mov.descricao,

              categoria: mov.categorias?.nome || "-",

              conta: mov.contas?.nome || "-",

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
          />
        )
      }

    </MainLayout>

  );

}

export default Movimentacoes;