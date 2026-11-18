"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** Hora atual, atualizada a cada `intervalo` ms. */
export function useAgora(intervalo = 1000) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(timer);
  }, [intervalo]);
  return agora;
}

const CONSULTA = "(prefers-reduced-motion: reduce)";

/** true quando o sistema pede menos movimento. */
export function useMenosMovimento() {
  return useSyncExternalStore(
    (avisar) => {
      const media = window.matchMedia(CONSULTA);
      media.addEventListener("change", avisar);
      return () => media.removeEventListener("change", avisar);
    },
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  );
}

/**
 * Quanto do trajeto o mecânico já percorreu (0 a 1) e quantos minutos faltam,
 * a partir da confirmação do ciclista e do tempo estimado pelo mecânico.
 */
export function progressoDaChegada(confirmadoEm: string | null, minutos: number | null, agora: number) {
  if (!confirmadoEm || !minutos) return { progresso: 0, minutosRestantes: minutos };
  const total = minutos * 60_000;
  const decorrido = Math.max(0, agora - new Date(confirmadoEm).getTime());
  return {
    progresso: Math.min(decorrido / total, 1),
    minutosRestantes: Math.max(0, Math.ceil((total - decorrido) / 60_000)),
  };
}

/** Enquanto `ativo`, alterna o título da aba com `alerta`, para chamar atenção com a aba em segundo plano. */
export function useTituloDeAlerta(ativo: boolean, alerta: string) {
  useEffect(() => {
    if (!ativo) return;
    const original = document.title;
    let mostrandoAlerta = false;
    const timer = setInterval(() => {
      mostrandoAlerta = !mostrandoAlerta;
      document.title = mostrandoAlerta ? alerta : original;
    }, 1000);
    return () => {
      clearInterval(timer);
      document.title = original;
    };
  }, [ativo, alerta]);
}
