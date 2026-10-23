import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import "./Privacidade.css";
import { getAppRedirectUrl } from "../utils/isPlayStoreMode";

export default function ExcluirConta() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [trabalhando, setTrabalhando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [aceitou, setAceitou] = useState(false);
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      const { data, error } = await supabase.auth.getUser();
      if (!vivo) return;
      setUsuario(error ? null : (data?.user ?? null));
      setCarregando(false);
    }
    carregar();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      carregar();
    });
    return () => {
      vivo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let vivo = true;
    if (!usuario) {
      setPedido(null);
      return;
    }
    supabase.schema("rumo").from("solicitacoes_exclusao")
      .select("id, status, solicitada_em")
      .eq("usuario_id", usuario.id)
      .in("status", ["PENDENTE", "EM_ANALISE"])
      .maybeSingle()
      .then(({ data, error }) => {
        if (!vivo) return;
        if (!error) setPedido(data);
      });
    return () => { vivo = false; };
  }, [usuario]);

  async function entrar(evento) {
    evento.preventDefault();
    setErro("");
    setTrabalhando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password: senha
    });
    setTrabalhando(false);
    if (error) setErro("Não foi possível entrar. Confira seus dados.");
  }

  async function entrarGoogle() {
    setErro("");
    setTrabalhando(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAppRedirectUrl("/excluir-conta"),
        queryParams: { prompt: "select_account" }
      }
    });
    if (error) {
      setTrabalhando(false);
      setErro("Não foi possível iniciar o acesso com Google.");
    }
  }

  async function solicitar(evento) {
    evento.preventDefault();
    setErro("");
    if (!usuario || pedido || confirmacao.trim().toUpperCase() !== "EXCLUIR" || !aceitou) {
      setErro("Confirme que entende a solicitação e digite EXCLUIR.");
      return;
    }
    setTrabalhando(true);
    // A identidade é a sessão validada, não um ID informado pelo usuário.
    const { data: { user }, error: erroUsuario } = await supabase.auth.getUser();
    if (erroUsuario || !user?.id || user.id !== usuario.id) {
      setErro("Sua sessão expirou. Entre novamente para continuar.");
      setTrabalhando(false);
      return;
    }
    const { error } = await supabase.schema("rumo")
      .from("solicitacoes_exclusao")
      .insert({ usuario_id: user.id });
    if (error) {
      // Uma requisição concorrente ou sessão antiga pode disparar conflito de unique.
      const { data: existente } = await supabase.schema("rumo")
        .from("solicitacoes_exclusao")
        .select("id, status, solicitada_em")
        .eq("usuario_id", user.id)
        .in("status", ["PENDENTE", "EM_ANALISE"])
        .maybeSingle();
      if (existente) setPedido(existente);
      else setErro("Não foi possível registrar a solicitação. Tente novamente ou utilize o canal de contato da Nethanel.");
    } else {
      setSucesso("Solicitação registrada. Nossa equipe precisa validar os vínculos e concluir a exclusão dos dados do Rumo.");
      setPedido({ status: "PENDENTE", solicitada_em: new Date().toISOString() });
      setConfirmacao("");
      setAceitou(false);
    }
    setTrabalhando(false);
  }

  return (
    <main className="rumo-privacidade">
      <div className="rumo-privacidade-container">
        <header className="rumo-privacidade-header">
          <Link to="/" className="rumo-privacidade-brand">↗ Rumo</Link>
          <Link to="/privacidade" className="rumo-privacidade-nav">Política de privacidade</Link>
        </header>
        <section className="rumo-privacidade-card">
          <span className="rumo-privacidade-eyebrow">Controle da sua conta</span>
          <h1>Solicitar exclusão da conta Rumo</h1>
          <p>
            Esta página funciona também pelo navegador, sem instalar o aplicativo.
            Você pode solicitar a exclusão de seus dados e acompanhar o andamento.
          </p>
          <div className="rumo-privacidade-alerta">
            <strong>O que será removido?</strong>
            <p>
              Após validação, os registros financeiros e informações vinculadas
              ao Rumo serão excluídos conforme a legislação aplicável. Assinaturas
              ativas e integrações externas precisam ser verificadas e encerradas.
              A autenticação compartilhada com outros aplicativos Nethanel
              será preservada quando necessária para manter seu acesso a eles.
            </p>
            <p>
              Dados que devam ser mantidos por obrigação legal poderão ser
              conservados pelo período legalmente exigido. A solicitação não
              cancela automaticamente uma assinatura junto ao provedor de pagamento.
            </p>
          </div>

          {carregando ? (
            <p>Verificando sua sessão...</p>
          ) : !usuario ? (
            <div>
              <h2>Entre na conta que deseja excluir</h2>
              <p>
                Para proteger suas informações, confirme sua identidade entrando
                com seu e-mail e senha ou sua conta Google.
              </p>
              <form onSubmit={entrar} className="rumo-privacidade-form">
                <label>E-mail<input required type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} /></label>
                <label>Senha<input required type="password" autoComplete="current-password"
                  value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
                <button type="submit" disabled={trabalhando}>Entrar para solicitar</button>
              </form>
              <button className="rumo-privacidade-secundario" type="button"
                onClick={entrarGoogle} disabled={trabalhando}>Entrar com Google</button>
              <p className="rumo-privacidade-muted">
                Se esqueceu a senha, solicite a recuperação na <Link to="/">tela de entrada do Rumo</Link>.
              </p>
            </div>
          ) : (
            <div>
              <h2>Conta identificada</h2>
              <p>Você está autenticado como <strong>{usuario.email}</strong>.</p>
              {pedido ? (
                <div className="rumo-privacidade-sucesso">
                  Já existe uma solicitação em andamento.
                  <br /><strong>Status: {pedido.status === "EM_ANALISE" ? "Em análise" : "Pendente"}</strong>
                  {pedido.solicitada_em && (
                    <><br />Solicitada em {new Date(pedido.solicitada_em).toLocaleDateString("pt-BR")}</>
                  )}
                </div>
              ) : (
                <form onSubmit={solicitar} className="rumo-privacidade-form">
                  <p>
                    Digite <strong>EXCLUIR</strong> para confirmar que pretende solicitar
                    a exclusão permanente de seus dados do Rumo.
                  </p>
                  <label>Confirmação<input required value={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.value)}
                    autoComplete="off" placeholder="EXCLUIR" /></label>
                  <label className="rumo-privacidade-check">
                    <input type="checkbox" checked={aceitou}
                      onChange={(e) => setAceitou(e.target.checked)} />
                    Entendo que meus dados financeiros do Rumo não poderão ser
                    recuperados depois da exclusão.
                  </label>
                  <button type="submit" disabled={trabalhando || !aceitou ||
                    confirmacao.trim().toUpperCase() !== "EXCLUIR"}>
                    {trabalhando ? "Registrando..." : "Solicitar exclusão de meus dados"}
                  </button>
                </form>
              )}
            </div>
          )}
          {erro && <p role="alert" className="rumo-privacidade-erro">{erro}</p>}
          {sucesso && <p role="status" className="rumo-privacidade-sucesso">{sucesso}</p>}
          <p className="rumo-privacidade-muted">
            Para outras questões de privacidade, utilize os canais oficiais
            disponíveis em{" "}
            <a href="https://nethanel.com.br/" target="_blank" rel="noopener noreferrer">
              nethanel.com.br
            </a>.
          </p>
        </section>
        <footer className="rumo-privacidade-footer">
          <Link to="/">Voltar ao Rumo</Link>
        </footer>
      </div>
    </main>
  );
}
