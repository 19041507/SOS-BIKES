"use server";

import { createClient } from "@/lib/supabase/server";
import { enviarAviso, type ResultadoDoEnvio } from "@/lib/push-servidor";

/** Manda um aviso de teste para os aparelhos de quem está logado (logo depois de ativar). */
export async function enviarNotificacaoDeTeste(): Promise<ResultadoDoEnvio | { erro: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { erro: "Entre de novo para testar as notificações." };
  const { data: perfil } = await supabase.from("perfis").select("tipo").eq("id", data.user.id).single();

  return enviarAviso({
    para: data.user.id,
    titulo: "Notificações ativadas",
    texto: "É assim que os avisos do SOS Bikes vão chegar.",
    url: `/${perfil?.tipo ?? "ciclista"}`,
    tag: "teste",
  });
}
