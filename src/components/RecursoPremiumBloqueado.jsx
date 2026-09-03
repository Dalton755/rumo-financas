import MainLayout from "../layouts/MainLayout";
import PageContainer from "./ui/PageContainer";
import PremiumFeaturePreview from "./PremiumFeaturePreview";

const previews = {
  INTELIGENCIA_FINANCEIRA: {
    subtitulo:
      "Transforme seus números em informações que ajudam você a decidir melhor.",

    descricao:
      "O Rumo analisa receitas, despesas, comportamento de consumo e tendências para mostrar o que está acontecendo com sua vida financeira e o que merece sua atenção.",

    beneficios: [
      "Compare receitas e despesas com períodos anteriores.",
      "Descubra automaticamente onde seu dinheiro está sendo mais consumido.",
      "Acompanhe sua taxa de economia e a evolução financeira.",
      "Receba insights e alertas baseados nos seus próprios dados.",
      "Antecipe receitas e despesas previstas para os próximos dias.",
    ],

    previewTitulo:
      "Sua inteligência financeira",

    previewDescricao:
      "Uma leitura automática dos números mais importantes da sua vida financeira.",

    previewCards: [
      {
        titulo: "Taxa de economia",
        valor: "59,6%",
        descricao: "Quanto da renda permaneceu disponível.",
        progresso: 60,
        destaque: true,
      },
      {
        titulo: "Saldo real",
        valor: "R$ 5.598",
        descricao: "Saldo considerando somente movimentações realizadas.",
      },
      {
        titulo: "Maior gasto",
        valor: "Lazer",
        descricao: "R$ 800 no período analisado.",
        progresso: 72,
      },
      {
        titulo: "Despesas",
        valor: "↓ 24,8%",
        descricao: "Comparação com o mesmo período anterior.",
        destaque: true,
      },
    ],

    insightTitulo:
      "Insight do Rumo",

    insightTexto:
      "Seus gastos diminuíram, mas suas receitas também caíram. O Rumo ajuda você a entender se essa mudança representa economia real ou apenas menor entrada de dinheiro.",
  },


  METAS: {
    subtitulo:
      "Transforme planos financeiros em metas acompanháveis e saiba exatamente quanto falta para chegar lá.",

    descricao:
      "Defina quanto deseja economizar, acompanhe seu progresso e deixe o Rumo mostrar quanto você precisa reservar para alcançar sua meta dentro do prazo.",

    beneficios: [
      "Crie metas com valor e prazo definidos.",
      "Acompanhe visualmente o percentual já conquistado.",
      "Descubra quanto ainda falta para atingir cada meta.",
      "Receba uma sugestão de quanto guardar por mês.",
      "Acompanhe várias metas financeiras ao mesmo tempo.",
    ],

    previewTitulo:
      "Minhas metas financeiras",

    previewDescricao:
      "Transforme objetivos financeiros em um plano claro e mensurável.",

    previewCards: [
      {
        titulo: "Reserva de emergência",
        valor: "68%",
        descricao: "R$ 6.800 de R$ 10.000 acumulados.",
        progresso: 68,
        destaque: true,
      },
      {
        titulo: "Falta acumular",
        valor: "R$ 3.200",
        descricao: "Valor restante para concluir a meta.",
      },
      {
        titulo: "Sugestão mensal",
        valor: "R$ 800",
        descricao: "Valor recomendado para cumprir o prazo.",
        destaque: true,
      },
      {
        titulo: "Prazo estimado",
        valor: "4 meses",
        descricao: "Mantendo o ritmo atual de aportes.",
        progresso: 75,
      },
    ],

    insightTitulo:
      "Ritmo da meta",

    insightTexto:
      "Guardando R$ 800 por mês, sua reserva de emergência poderá atingir R$ 10.000 em aproximadamente 4 meses.",
  },


  OBJETIVOS: {
    subtitulo:
      "Dê um destino ao seu dinheiro e acompanhe a construção dos seus sonhos passo a passo.",

    descricao:
      "Cadastre objetivos como viagem, carro, casa ou qualquer projeto importante e acompanhe quanto já conquistou, quanto falta e o ritmo necessário para chegar lá.",

    beneficios: [
      "Crie objetivos personalizados para seus projetos de vida.",
      "Registre aportes e acompanhe a evolução do valor acumulado.",
      "Veja quanto já conquistou e quanto ainda falta.",
      "Defina uma data desejada para alcançar cada objetivo.",
      "Descubra o aporte necessário para cumprir o prazo.",
    ],

    previewTitulo:
      "Meus objetivos",

    previewDescricao:
      "Veja seus sonhos transformados em números, prazo e progresso.",

    previewCards: [
      {
        titulo: "Viagem para Europa",
        valor: "56%",
        descricao: "R$ 8.400 de R$ 15.000 acumulados.",
        progresso: 56,
        destaque: true,
      },
      {
        titulo: "Falta conquistar",
        valor: "R$ 6.600",
        descricao: "Valor restante para atingir o objetivo.",
      },
      {
        titulo: "Aporte sugerido",
        valor: "R$ 825",
        descricao: "Sugestão mensal para alcançar o prazo.",
        destaque: true,
      },
      {
        titulo: "Previsão",
        valor: "Mar/2027",
        descricao: "Data estimada mantendo o planejamento.",
        progresso: 62,
      },
    ],

    insightTitulo:
      "Seu objetivo está ao alcance",

    insightTexto:
      "Com aportes de aproximadamente R$ 825 por mês, você poderá completar os R$ 15.000 planejados dentro do prazo estimado.",
  },


  DIVIDAS: {
    subtitulo:
      "Organize suas dívidas e transforme o que parece interminável em um plano claro de quitação.",

    descricao:
      "Cadastre suas dívidas, acompanhe o saldo devedor e deixe o Rumo ajudar a identificar uma estratégia para reduzir juros e antecipar sua liberdade financeira.",

    beneficios: [
      "Centralize todas as suas dívidas em um único lugar.",
      "Acompanhe saldo devedor, parcelas e pagamentos.",
      "Veja uma previsão de quando cada dívida será quitada.",
      "Simule pagamentos extras e antecipações.",
      "Receba sugestões para acelerar sua quitação.",
    ],

    previewTitulo:
      "Meu plano de quitação",

    previewDescricao:
      "Veja quanto você deve, quanto está pagando e quando poderá ficar livre das dívidas.",

    previewCards: [
      {
        titulo: "Saldo devedor",
        valor: "R$ 12.480",
        descricao: "Valor total ainda pendente.",
        progresso: 58,
        destaque: true,
      },
      {
        titulo: "Pagamento mensal",
        valor: "R$ 1.250",
        descricao: "Valor destinado às dívidas todos os meses.",
      },
      {
        titulo: "Previsão de quitação",
        valor: "11 meses",
        descricao: "Mantendo o plano atual de pagamentos.",
        progresso: 64,
      },
      {
        titulo: "Economia estimada",
        valor: "R$ 1.840",
        descricao: "Potencial de economia com uma estratégia de antecipação.",
        destaque: true,
      },
    ],

    insightTitulo:
      "Acelere sua liberdade financeira",

    insightTexto:
      "Com R$ 250 extras por mês destinados à quitação, você poderá reduzir o prazo estimado e diminuir o custo total das dívidas.",
  },


  PROJECOES: {
    subtitulo:
      "Enxergue alguns passos à frente antes de tomar decisões financeiras importantes.",

    descricao:
      "O Rumo utiliza seu histórico, movimentações previstas e comportamento financeiro para projetar como seu saldo poderá evoluir nas próximas semanas e meses.",

    beneficios: [
      "Veja projeções financeiras para os próximos períodos.",
      "Antecipe possíveis meses de saldo apertado.",
      "Visualize o impacto de receitas e despesas futuras.",
      "Compare cenários antes de assumir novos compromissos.",
      "Acompanhe a tendência de evolução do seu patrimônio.",
    ],

    previewTitulo:
      "Meu futuro financeiro",

    previewDescricao:
      "Uma visão antecipada de como suas finanças podem evoluir mantendo o comportamento atual.",

    previewCards: [
      {
        titulo: "Saldo em 30 dias",
        valor: "R$ 6.420",
        descricao: "Projeção considerando entradas e saídas previstas.",
        progresso: 54,
      },
      {
        titulo: "Saldo em 90 dias",
        valor: "R$ 8.750",
        descricao: "Estimativa mantendo sua tendência atual.",
        progresso: 73,
        destaque: true,
      },
      {
        titulo: "Crescimento projetado",
        valor: "+ R$ 3.150",
        descricao: "Possível evolução do saldo no período.",
        destaque: true,
      },
      {
        titulo: "Tendência",
        valor: "Positiva ↗",
        descricao: "Seu cenário atual aponta crescimento.",
        progresso: 82,
      },
    ],

    insightTitulo:
      "Olhe além do mês atual",

    insightTexto:
      "Mantendo seu ritmo financeiro atual, seu saldo poderá crescer aproximadamente R$ 3.150 nos próximos 90 dias.",
  },


  ORCAMENTO: {
    subtitulo:
      "Defina limites antes de gastar e saiba exatamente quando uma categoria está saindo do controle.",

    descricao:
      "Crie orçamentos mensais por categoria e acompanhe em tempo real quanto já foi utilizado, quanto ainda está disponível e onde você precisa reduzir o ritmo.",

    beneficios: [
      "Defina limites mensais para suas principais categorias.",
      "Acompanhe o consumo do orçamento em tempo real.",
      "Veja quanto ainda pode gastar em cada categoria.",
      "Receba alertas quando estiver próximo do limite.",
      "Compare seu orçamento planejado com o gasto real.",
    ],

    previewTitulo:
      "Meu orçamento do mês",

    previewDescricao:
      "Controle seus gastos antes que eles ultrapassem o que você planejou.",

    previewCards: [
      {
        titulo: "Alimentação",
        valor: "R$ 720 / R$ 1.000",
        descricao: "R$ 280 ainda disponíveis.",
        progresso: 72,
        destaque: true,
      },
      {
        titulo: "Lazer",
        valor: "89%",
        descricao: "R$ 800 de R$ 900 já utilizados.",
        progresso: 89,
        destaque: true,
      },
      {
        titulo: "Transporte",
        valor: "R$ 420 / R$ 700",
        descricao: "60% do orçamento utilizado.",
        progresso: 60,
      },
      {
        titulo: "Disponível",
        valor: "R$ 730",
        descricao: "Total restante nos orçamentos ativos.",
      },
    ],

    insightTitulo:
      "Atenção ao orçamento",

    insightTexto:
      "Lazer já consumiu 89% do limite planejado. Reduzir novos gastos nessa categoria ajuda você a terminar o mês dentro do orçamento.",
  },


  ALERTAS_INTELIGENTES: {
    subtitulo:
      "Deixe o Rumo chamar sua atenção antes que pequenos sinais se transformem em problemas.",

    descricao:
      "Os Alertas Inteligentes acompanham sua movimentação financeira e destacam situações importantes para que você não precise descobrir tudo sozinho.",

    beneficios: [
      "Receba avisos sobre categorias próximas do limite.",
      "Identifique aumentos incomuns de despesas.",
      "Seja avisado sobre movimentações financeiras previstas.",
      "Acompanhe mudanças relevantes no seu comportamento.",
      "Receba alertas positivos quando estiver evoluindo bem.",
    ],

    previewTitulo:
      "Central de alertas",

    previewDescricao:
      "O Rumo acompanha seus números e destaca automaticamente o que merece sua atenção.",

    previewCards: [
      {
        titulo: "Atenção",
        valor: "Lazer 89%",
        descricao: "Categoria próxima do limite mensal.",
        progresso: 89,
        destaque: true,
      },
      {
        titulo: "Próximos dias",
        valor: "R$ 1.240",
        descricao: "Despesas previstas para os próximos 7 dias.",
      },
      {
        titulo: "Boa notícia",
        valor: "↓ 18%",
        descricao: "Gastos abaixo da sua média recente.",
        destaque: true,
      },
      {
        titulo: "Alertas ativos",
        valor: "3",
        descricao: "Situações importantes acompanhadas pelo Rumo.",
        progresso: 45,
      },
    ],

    insightTitulo:
      "O Rumo está de olho",

    insightTexto:
      "Seu gasto com Lazer está próximo do limite definido. Se mantiver o ritmo atual, o orçamento poderá ser ultrapassado antes do fim do mês.",
  },


  OPEN_FINANCE: {
    subtitulo:
      "Tenha uma visão mais completa da sua vida financeira sem precisar alimentar tudo manualmente.",

    descricao:
      "Com Open Finance, o Rumo poderá consolidar informações autorizadas de diferentes instituições financeiras para oferecer uma visão centralizada e atualizada das suas finanças.",

    beneficios: [
      "Conecte instituições financeiras autorizadas por você.",
      "Visualize contas e saldos em um único lugar.",
      "Reduza a necessidade de lançamentos manuais.",
      "Tenha informações mais completas para análises do Rumo.",
      "Gerencie e revogue seus consentimentos quando quiser.",
    ],

    previewTitulo:
      "Minha vida financeira conectada",

    previewDescricao:
      "Contas de diferentes instituições reunidas em uma visão consolidada.",

    previewCards: [
      {
        titulo: "Instituições conectadas",
        valor: "3",
        descricao: "Bancos autorizados pelo usuário.",
        progresso: 75,
      },
      {
        titulo: "Saldo consolidado",
        valor: "R$ 12.480",
        descricao: "Visão conjunta das contas conectadas.",
        destaque: true,
      },
      {
        titulo: "Cartões",
        valor: "R$ 2.340",
        descricao: "Valor consolidado apresentado na prévia.",
      },
      {
        titulo: "Sincronização",
        valor: "Automática",
        descricao: "Dados atualizados após sincronizações autorizadas.",
        destaque: true,
      },
    ],

    insightTitulo:
      "Uma visão financeira mais completa",

    insightTexto:
      "Com suas instituições conectadas e mediante sua autorização, o Rumo poderá analisar uma visão mais ampla das suas finanças sem depender apenas de lançamentos manuais.",
  },
};

export default function RecursoPremiumBloqueado({
  codigo,
  titulo = "Recurso Premium",
}) {
  const configuracao =
    previews[codigo] || {
      subtitulo:
        "Desbloqueie ferramentas avançadas para cuidar melhor das suas finanças.",

      descricao:
        "Este recurso faz parte do Rumo Premium e foi desenvolvido para ampliar seu controle, planejamento e visão financeira.",

      beneficios: [
        "Mais ferramentas para organizar sua vida financeira.",
        "Recursos avançados de planejamento.",
        "Informações adicionais para apoiar suas decisões.",
      ],

      previewTitulo:
        titulo,

      previewDescricao:
        "Conheça uma prévia do que estará disponível no Rumo Premium.",

      previewCards: [
        {
          titulo: "Recurso Premium",
          valor: "Mais controle",
          descricao: "Ferramentas exclusivas para assinantes.",
          destaque: true,
        },
        {
          titulo: "Planejamento",
          valor: "Mais clareza",
          descricao: "Entenda melhor sua situação financeira.",
        },
      ],

      insightTitulo:
        "Rumo Premium",

      insightTexto:
        "Use recursos avançados para transformar seus dados financeiros em decisões mais claras.",
    };

  return (
    <MainLayout>
      <PageContainer>
        <PremiumFeaturePreview
          titulo={titulo}
          subtitulo={configuracao.subtitulo}
          descricao={configuracao.descricao}
          beneficios={configuracao.beneficios}
          previewTitulo={configuracao.previewTitulo}
          previewDescricao={configuracao.previewDescricao}
          previewCards={configuracao.previewCards}
          insightTitulo={configuracao.insightTitulo}
          insightTexto={configuracao.insightTexto}
          ctaTexto="Conhecer o Rumo Premium"
        />
      </PageContainer>
    </MainLayout>
  );
}
