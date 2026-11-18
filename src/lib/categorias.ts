import type { Enum } from "@/lib/supabase/database.types";

export type Categoria = Enum<"categoria_defeito">;

export const CATEGORIAS: { id: Categoria; label: string }[] = [
  { id: "pneu", label: "Pneu furado" },
  { id: "corrente", label: "Corrente partida" },
  { id: "freio", label: "Freios" },
  { id: "roda", label: "Rodas" },
  { id: "selim", label: "Selim" },
];

export function rotuloCategoria(id: Categoria) {
  return CATEGORIAS.find((categoria) => categoria.id === id)?.label ?? id;
}
