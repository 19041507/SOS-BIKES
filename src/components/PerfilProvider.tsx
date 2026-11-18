"use client";

import { createContext, use, type ReactNode } from "react";
import type { Perfil } from "@/lib/supabase/database.types";

const PerfilContext = createContext<Perfil | null>(null);

export function PerfilProvider({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  return <PerfilContext value={perfil}>{children}</PerfilContext>;
}

/** Perfil logado; só funciona dentro das áreas (AreaLogada). */
export function usePerfil() {
  const perfil = use(PerfilContext);
  if (!perfil) throw new Error("usePerfil precisa estar dentro de <PerfilProvider>.");
  return perfil;
}
