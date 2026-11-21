"use client";

import { useTransition } from "react";
import type { MecanicoParaSalvar } from "@/lib/favoritos";
import { useFavoritos } from "./FavoritosProvider";

export function SalvarMecanico({ mecanico }: { mecanico: MecanicoParaSalvar }) {
  const { favoritos, carregando, erro, alternar } = useFavoritos();
  const [ocupado, iniciar] = useTransition();
  const salvo = favoritos.some((favorito) => favorito.id === mecanico.id);
  const acao = salvo ? "Remover" : "Salvar";
  const destino = salvo ? "dos favoritos" : "nos favoritos";
  const texto = erro ? "Favoritos indisponíveis" : ocupado
    ? "Salvando…" : salvo ? "Salvo nos favoritos" : "Salvar mecânico";

  return (
    <button
      type="button"
      disabled={carregando || ocupado || !!erro}
      aria-pressed={salvo}
      aria-label={erro ? texto : `${acao} ${mecanico.nome} ${destino}`}
      title={erro ?? undefined}
      onClick={() => iniciar(() => alternar(mecanico))}
      className={
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 " +
        "text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 " +
        "focus-visible:outline-brand disabled:opacity-60 " +
        (salvo
          ? "border-brand bg-brand-soft text-brand"
          : "border-field bg-white text-muted hover:bg-surface")
      }
    >
      <svg
        className="size-4 shrink-0"
        viewBox="0 0 24 24"
        fill={salvo ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 3h12v18l-6-4-6 4V3Z" />
      </svg>
      {texto}
    </button>
  );
}
