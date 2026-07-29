import "./ModalConfirmacao.css";

function ModalConfirmacao({

    aberto,

    titulo,

    mensagem,

    onCancelar,

    onConfirmar

}) {

    if (!aberto) return null;

    return (

        <div className="modal-overlay">

            <div className="modal-confirmacao">

                <h2>{titulo}</h2>

                <p>{mensagem}</p>

                <div className="modal-footer">

                    <button
                        className="btn-cancelar"
                        onClick={onCancelar}
                    >
                        Cancelar
                    </button>

                    <button
                        className="btn-excluir"
                        onClick={onConfirmar}
                    >
                        Excluir
                    </button>

                </div>

            </div>

        </div>

    );

}

export default ModalConfirmacao;