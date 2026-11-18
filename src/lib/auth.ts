import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import type { Perfil } from "@/lib/supabase/database.types";

/** Perfil do usuário logado, ou null. Memorizado durante a requisição. */
export const perfilAtual = cache(async (): Promise<Perfil | null> => {
  if (!supabaseConfigurado) return null;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: perfil } = await supabase.from("perfis").select("*").eq("id", auth.user.id).single();
  return perfil;
});
