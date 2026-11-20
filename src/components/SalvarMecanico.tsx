"use client";

import type { MecanicoParaSalvar } from "@/lib/favoritos";
import { useFavoritos } from "./FavoritosProvider";

export function SalvarMecanico({ mecanico }: { mecanico: MecanicoParaSalvar }) {
  const { favoritos, carregando, erro, pendentes, atualizar, alternar } = useFavoritos();
  const salvo = favoritos.some(f => f.id === mecanico.id);
  const ocupado = pendentes.includes(mecanico.id);
  if (erro) return <button type="button" onClick={() => void atualizar()} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-danger">Recarregar favoritos</button>;
  return (
    <button type="button" disabled={carregando || pendentes.length > 0} aria-pressed={salvo}
      aria-label={`${salvo ? "Remover" : "Salvar"} ${mecanico.nome}${salvo ? " dos favoritos" : " nos favoritos"}`}
      onClick={() => void alternar(mecanico)}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60 ${salvo ? "border-brand bg-brand-soft text-brand" : "border-field bg-white text-muted hover:bg-surface"}`}>
      <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill={salvo ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>
      {ocupado ? "Salvando…" : salvo ? "Salvo nos favoritos" : "Salvar mecânico"}
    </button>
  );
}
