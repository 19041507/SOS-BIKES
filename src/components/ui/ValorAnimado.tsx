"use client";

import { useEffect, useRef, useState } from "react";
import { formatBRL } from "@/lib/money";
import { useMenosMovimento } from "@/lib/movimento";

const DURACAO = 700;

/** Valor em reais que sobe (ou desce) contando até o novo total quando muda. */
export function ValorAnimado({ valor }: { valor: number }) {
  const menosMovimento = useMenosMovimento();
  const [exibido, setExibido] = useState(valor);
  const anterior = useRef(valor);

  useEffect(() => {
    const de = anterior.current;
    anterior.current = valor;
    if (menosMovimento || de === valor) {
      const quadro = requestAnimationFrame(() => setExibido(valor));
      return () => cancelAnimationFrame(quadro);
    }
    const inicio = performance.now();
    let quadro = 0;
    const passo = (agora: number) => {
      const t = Math.min((agora - inicio) / DURACAO, 1);
      const suave = 1 - (1 - t) ** 3;
      setExibido(de + (valor - de) * suave);
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, menosMovimento]);

  return (
    <>
      <span aria-hidden="true">{formatBRL(exibido)}</span>
      <span className="sr-only">{formatBRL(valor)}</span>
    </>
  );
}
