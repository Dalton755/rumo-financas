import SeletorBanco from "./SeletorBanco";
import "./ModalConta.css";

export default function ModalConta({

    aberto,

    titulo,

    nome,

    setNome,

    banco,

    setBanco,

    tipo,

    setTipo,

    saldoInicial,

    setSaldoInicial,

    onSalvar,

    onFechar

}) {

    if (!aberto) return null;

    return (

        <div className="modal-overlay">

            <div className="modal-conta">

                <div className="modal-header">

                    <h2>{titulo}</h2>

                    <button onClick={onFechar}>✕</button>

                </div>

                <div className="modal-body">

                    <input
                        placeholder="Nome da conta"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                    />

                    <SeletorBanco
                        banco={banco}
                        setBanco={setBanco}
                    />

                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                    >

                        <option value="corrente">Conta Corrente</option>
                        <option value="poupanca">Poupança</option>
                        <option value="carteira">Carteira</option>
                        <option value="investimento">Investimento</option>

                    </select>

                    <input
                        type="number"
                        placeholder="Saldo inicial"
                        value={saldoInicial}
                        onChange={(e) => setSaldoInicial(e.target.value)}
                    />

                </div>

                <div className="modal-footer">

                    <button
                        className="btn-cancelar"
                        onClick={onFechar}
                    >

                        Cancelar

                    </button>

                    <button
                        className="btn-salvar"
                        onClick={onSalvar}
                    >

                        Salvar

                    </button>

                </div>

            </div>

        </div>

    );

}