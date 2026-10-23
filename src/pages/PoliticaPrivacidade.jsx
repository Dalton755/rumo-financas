import { Link } from "react-router-dom";
import "./Privacidade.css";

export default function PoliticaPrivacidade() {
  return (
    <main className="rumo-privacidade">
      <div className="rumo-privacidade-container">
        <header className="rumo-privacidade-header">
          <Link to="/" className="rumo-privacidade-brand">↗ Rumo</Link>
          <Link to="/excluir-conta" className="rumo-privacidade-nav">Solicitar exclusão de conta</Link>
        </header>

        <article className="rumo-privacidade-card">
          <span className="rumo-privacidade-eyebrow">Seus dados, suas escolhas</span>
          <h1>Política de Privacidade do Rumo</h1>
          <p className="rumo-privacidade-muted">
            Atualização: 22 de outubro de 2026 · Operador do aplicativo: Nethanel
          </p>
          <p>
            O Rumo é um aplicativo de organização financeira. Esta página
            explica quais tipos de dados são utilizados, para quais finalidades
            e como o usuário pode solicitar a exclusão de sua conta no Rumo.
          </p>

          <h2>1. Dados tratados</h2>
          <p>
            Ao criar uma conta, são tratados dados de cadastro e autenticação,
            como e-mail e identificador do usuário. Se você registrar
            informações financeiras, o Rumo armazena receitas, despesas,
            contas, cartões, dívidas, compromissos, metas, importações e
            outras informações que você decidir fornecer.
          </p>
          <p>
            Se a integração bancária estiver disponível e for autorizada,
            também poderão ser processados dados de instituições,
            contas e transações para exibi-los e organizá-los no Rumo.
            Serviços de autenticação e infraestrutura podem registrar dados
            técnicos de acesso para segurança e funcionamento.
          </p>

          <h2>2. Para que utilizamos os dados</h2>
          <p>
            Os dados são usados para autenticar sua conta, armazenar seus
            registros financeiros, calcular saldos e projeções, oferecer
            alertas e análises financeiras, processar pagamentos quando
            contratados e proteger o funcionamento do serviço.
          </p>

          <h2>3. Serviços envolvidos</h2>
          <p>
            O Rumo utiliza Supabase para autenticação e banco de dados,
            Vercel para a aplicação web e Google para login quando escolhido.
            Assinaturas realizadas no site utilizam Mercado Pago.
            Integrações financeiras, quando ativadas, podem utilizar Pluggy.
            Dados compartilhados com prestadores devem se limitar ao
            necessário para o serviço escolhido.
          </p>

          <h2>4. Compartilhamento entre aplicativos</h2>
          <p>
            A autenticação pode ser compartilhada entre aplicativos da
            Nethanel. A exclusão de seus dados de finanças no Rumo não
            exige automaticamente o encerramento das suas contas em
            outros aplicativos: tratamos essa situação separadamente
            para evitar perda de acesso aos demais serviços.
          </p>

          <h2>5. Proteção e retenção</h2>
          <p>
            Empregamos controles de acesso para separar os dados de cada
            usuário. Mantemos dados enquanto necessários para operar o
            serviço e, quando aplicável, pelo período necessário para
            obrigações legais, prevenção de fraude ou resolução de disputas.
            Registros necessários a obrigações legais poderão ser retidos
            de forma limitada, mesmo após a solicitação de exclusão.
          </p>

          <h2>6. Seus direitos</h2>
          <p>
            Você pode solicitar informações, correção ou exclusão de dados
            associados à sua conta no Rumo. Para iniciar uma solicitação
            de exclusão e acompanhar seu status, utilize o recurso abaixo.
          </p>
          <Link to="/excluir-conta" className="rumo-privacidade-cta">
            Solicitar exclusão de conta e dados
          </Link>

          <h2>7. Contato</h2>
          <p>
            Você pode acessar os canais oficiais da Nethanel em{" "}
            <a href="https://nethanel.com.br/" target="_blank" rel="noopener noreferrer">
              nethanel.com.br
            </a>.
            Esta política será revisada quando forem adicionadas integrações
            ou funcionalidades que mudem o tratamento dos dados.
          </p>
          <p className="rumo-privacidade-muted">
            Aviso de homologação: conteúdo sujeito à revisão final de
            fornecedores, prazos de retenção e canais de atendimento
            antes da publicação na Google Play.
          </p>
        </article>
        <footer className="rumo-privacidade-footer">
          <Link to="/">Voltar ao Rumo</Link>
        </footer>
      </div>
    </main>
  );
}
