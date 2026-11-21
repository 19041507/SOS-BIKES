"use client";

import { createClient } from "./supabase/client";
import type { Database } from "./supabase/database.types";

export type MecanicoFavorito = Database["public"]["Functions"]["meus_mecanicos_favoritos"]["Returns"][number];
export type MecanicoParaSalvar = Pick<MecanicoFavorito, "id" | "nome" | "oficina"> & Partial<MecanicoFavorito>;

export async function listarFavoritos(): Promise<MecanicoFavorito[]> {
  const { data, error } = await createClient().rpc("meus_mecanicos_favoritos");
  if (error || !data) throw new Error("Não foi possível carregar seus favoritos.");
  return data;
}

export async function salvarFavorito(ciclistaId: string, mecanicoId: string) {
  const { error } = await createClient().from("mecanicos_favoritos").upsert(
    { ciclista_id: ciclistaId, mecanico_id: mecanicoId },
    { onConflict: "ciclista_id,mecanico_id", ignoreDuplicates: true },
  );
  if (error) throw new Error("Não foi possível salvar o mecânico. Tente novamente.");
}

export async function removerFavorito(ciclistaId: string, mecanicoId: string) {
  const { error } = await createClient().from("mecanicos_favoritos").delete()
    .eq("ciclista_id", ciclistaId).eq("mecanico_id", mecanicoId);
  if (error) throw new Error("Não foi possível remover o favorito. Tente novamente.");
}
