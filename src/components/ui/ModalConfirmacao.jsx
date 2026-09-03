import "./ModalConfirmacao.css";

function ModalConfirmacao({
    aberto,
    titulo,
    mensagem,
    onCancelar,
    onConfirmar,
    textoConfirmar = "Excluir",
    confirmando = false
}) {
    if (!aberto) return null;

    return (
        <div className="modal-confirmacao-overlay">
            <div className="modal-confirmacao-box">
                <h2>{titulo}</h2>

                <p>{mensagem}</p>

                <div className="modal-confirmacao-footer">
                    <button
                        className="btn-confirmacao-cancelar"
                        onClick={onCancelar}
                        disabled={confirmando}
                    >
                        Cancelar
                    </button>

                    <button
                        className="btn-confirmacao-excluir"
                        onClick={onConfirmar}
                        disabled={confirmando}
                    >
                        {confirmando
                            ? "Aguarde..."
                            : textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalConfirmacao;