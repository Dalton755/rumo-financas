import { useEffect, useMemo, useState } from "react";
import {
  Backspace,
  Calculator,
  Check,
  Delete
} from "lucide-react";

import "./MoneyCalculatorInput.css";

function normalizarNumero(valor) {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function formatarMoeda(valor) {
  if (
    valor === "" ||
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  return normalizarNumero(valor)
    .toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );
}

function resolverExpressao(expressao) {
  const limpa =
    String(expressao || "")
      .replace(/,/g, ".")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/[^0-9.+\-*/]/g, "");

  const tokens =
    limpa.match(
      /(?:\d+(?:\.\d+)?)|[+\-*/]/g
    );

  if (!tokens?.length) {
    return 0;
  }

  const valores = [];
  const operadores = [];

  let esperandoNumero = true;

  tokens.forEach((token) => {
    if (
      esperandoNumero &&
      /^\d/.test(token)
    ) {
      valores.push(Number(token));
      esperandoNumero = false;
      return;
    }

    if (
      !esperandoNumero &&
      /^[+\-*/]$/.test(token)
    ) {
      operadores.push(token);
      esperandoNumero = true;
    }
  });

  if (!valores.length) {
    return 0;
  }

  const valores2 = [valores[0]];
  const operadores2 = [];

  operadores.forEach(
    (operador, indice) => {
      const proximo =
        valores[indice + 1];

      if (
        operador === "*" ||
        operador === "/"
      ) {
        const anterior =
          valores2.pop();

        valores2.push(
          operador === "*"
            ? anterior * proximo
            : proximo === 0
              ? anterior
              : anterior / proximo
        );
      } else {
        operadores2.push(operador);
        valores2.push(proximo);
      }
    }
  );

  return operadores2.reduce(
    (total, operador, indice) =>
      operador === "+"
        ? total + valores2[indice + 1]
        : total - valores2[indice + 1],
    valores2[0]
  );
}

export default function MoneyCalculatorInput({
  value,
  onChange,
  placeholder = "R$ 0,00",
  disabled = false,
  className = "",
  ariaLabel = "Valor"
}) {
  const [aberta, setAberta] =
    useState(false);

  const [expressao, setExpressao] =
    useState("");

  const resultado =
    useMemo(
      () =>
        resolverExpressao(
          expressao
        ),
      [expressao]
    );

  useEffect(() => {
    if (!aberta) {
      return;
    }

    const atual =
      normalizarNumero(
        value
      );

    setExpressao(
      atual
        ? String(atual)
        : ""
    );
  }, [aberta]);

  function adicionar(valorBotao) {
    setExpressao((atual) => {
      const ultimo =
        atual.slice(-1);

      if (
        ["+", "-", "×", "÷"]
          .includes(valorBotao)
      ) {
        if (!atual) {
          return valorBotao === "-"
            ? "-"
            : "";
        }

        if (
          ["+", "-", "×", "÷"]
            .includes(ultimo)
        ) {
          return (
            atual.slice(0, -1) +
            valorBotao
          );
        }
      }

      const trechoAtual =
        atual
          .split(/[+\-×÷]/)
          .at(-1);

      if (
        valorBotao === "," &&
        trechoAtual.includes(",")
      ) {
        return atual;
      }

      return atual + valorBotao;
    });
  }

  function aplicar() {
    const valorFinal =
      Math.max(
        0,
        Number(
          resultado.toFixed(2)
        )
      );

    onChange?.(
      String(valorFinal)
    );

    setAberta(false);
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        className={
          [
            "money-calculator-field",
            className
          ]
            .filter(Boolean)
            .join(" ")
        }
        onClick={() =>
          setAberta(true)
        }
        aria-label={ariaLabel}
      >
        <span
          className={
            value !== "" &&
            value !== null &&
            value !== undefined
              ? "has-value"
              : ""
          }
        >
          {value !== "" &&
          value !== null &&
          value !== undefined
            ? formatarMoeda(value)
            : placeholder
          }
        </span>

        <Calculator size={17} />
      </button>

      {aberta && (
        <div
          className="money-calculator-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="money-calculator-sheet">
            <div className="money-calculator-display">
              <span>
                Calcule o valor
              </span>

              <div className="money-calculator-expression">
                {expressao || "0"}
              </div>

              <strong>
                {formatarMoeda(
                  resultado
                )}
              </strong>
            </div>

            <div className="money-calculator-grid">
              <button
                type="button"
                className="soft"
                onClick={() =>
                  setExpressao("")
                }
              >
                <Delete size={18} />
                AC
              </button>

              <button
                type="button"
                className="soft"
                onClick={() =>
                  setExpressao(
                    (atual) =>
                      atual.slice(0, -1)
                  )
                }
              >
                <Backspace size={19} />
              </button>

              <button
                type="button"
                className="operator"
                onClick={() =>
                  adicionar("÷")
                }
              >
                ÷
              </button>

              <button
                type="button"
                className="operator"
                onClick={() =>
                  adicionar("×")
                }
              >
                ×
              </button>

              {[
                "7","8","9","-",
                "4","5","6","+",
                "1","2","3",","
              ].map((tecla) => (
                <button
                  type="button"
                  key={tecla}
                  className={
                    ["+", "-"]
                      .includes(tecla)
                      ? "operator"
                      : ""
                  }
                  onClick={() =>
                    adicionar(tecla)
                  }
                >
                  {tecla}
                </button>
              ))}

              <button
                type="button"
                className="zero"
                onClick={() =>
                  adicionar("0")
                }
              >
                0
              </button>

              <button
                type="button"
                className="apply"
                onClick={aplicar}
              >
                <Check size={18} />
                Usar valor
              </button>
            </div>

            <button
              type="button"
              className="money-calculator-cancel"
              onClick={() =>
                setAberta(false)
              }
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
