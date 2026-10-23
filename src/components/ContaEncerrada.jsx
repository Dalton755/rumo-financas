import { Link } from "react-router-dom";
import "../pages/Privacidade.css";

export default function ContaEncerrada({ concluida = false }) {
  return (
    <main className="rumo-privacidade">
      <div className="rumo-privacidade-container">
        <header className="rumo-privacidade-header">
          <Link to="/" className="rumo-privacidade-brand">↗ Rumo</Link>
          <Link to="/privacidade" className="rumo-privacidade-nav">Privacidade</Link>
        </header>
        <section className="rumo-privacidade-card" role="status">
          <span className="rumo-privacidade-eyebrow">Privacidade e controle</span>
          <h1>{concluida ? "Sua conta Rumo foi encerrada" : "Sua exclusão está sendo processada"}</h1>
          <p>
            {concluida
              ? "Os dados associados ao Rumo foram excluídos conforme a solicitação. Não vamos recriar seus registros financeiros ao entrar novamente com esta identidade."
              : "Recebemos sua solicitação e interrompemos o acesso às funções financeiras durante o processamento, para evitar novos registros."}
          </p>
          <div className="rumo-privacidade-alerta">
            <strong>Seus outros aplicativos Nethanel</strong>
            <p>A identidade de acesso compartilhada pode continuar válida em outros aplicativos. Esta medida se aplica somente ao Rumo.</p>
          </div>
          <Link className="rumo-privacidade-nav" to="/excluir-conta">
            {concluida ? "Consultar conclusão da solicitação" : "Acompanhar minha solicitação"}
          </Link>
          <p className="rumo-privacidade-muted">
            Precisa de ajuda? Utilize os canais oficiais em{" "}
            <a href="https://nethanel.com.br/" target="_blank" rel="noopener noreferrer">nethanel.com.br</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
