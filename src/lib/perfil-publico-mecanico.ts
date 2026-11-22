import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { BUCKET_FOTOS_MECANICOS } from "./perfil-mecanico";

type PerfilPublico = Database["public"]["Functions"]["perfil_publico_mecanico"]["Returns"][number];
type AvaliacaoPublica = Database["public"]["Functions"]["avaliacoes_publicas_do_mecanico"]["Returns"][number];
type FotoPublica = Database["public"]["Tables"]["perfil_mecanico_fotos"]["Row"];

export type FotoDoMecanico = Pick<FotoPublica, "id" | "tipo" | "descricao" | "criado_em"> & {
  url: string;
};

export type PerfilPublicoDoMecanico = PerfilPublico & {
  avaliacoesPublicas: AvaliacaoPublica[];
  fotos: FotoDoMecanico[];
};

export async function buscarPerfilPublicoDoMecanico(id: string): Promise<PerfilPublicoDoMecanico | null> {
  const supabase = await createClient();
  const { data: perfis, error: erroPerfil } = await supabase.rpc("perfil_publico_mecanico", { mecanico: id });
  if (erroPerfil) throw new Error("Não foi possível carregar o perfil do mecânico.");
  const perfil = perfis?.[0];
  if (!perfil) return null;

  const [avaliacoes, fotos] = await Promise.all([
    supabase.rpc("avaliacoes_publicas_do_mecanico", { mecanico: id }),
    supabase
      .from("perfil_mecanico_fotos")
      .select("id, caminho, tipo, descricao, criado_em")
      .eq("mecanico_id", id)
      .order("criado_em", { ascending: true }),
  ]);
  if (avaliacoes.error || fotos.error) throw new Error("Não foi possível carregar os detalhes do perfil.");

  return {
    ...perfil,
    avaliacoesPublicas: avaliacoes.data,
    fotos: fotos.data.map((foto) => ({
      id: foto.id,
      tipo: foto.tipo,
      descricao: foto.descricao,
      criado_em: foto.criado_em,
      url: supabase.storage.from(BUCKET_FOTOS_MECANICOS).getPublicUrl(foto.caminho).data.publicUrl,
    })),
  };
}
