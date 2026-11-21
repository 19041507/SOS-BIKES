import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseCredenciais } from "./config";
import type { Database } from "./database.types";

/**
 * Cliente com a chave de serviço: ignora o RLS. Só para o servidor (envio de notificações),
 * nunca para dados de quem está logado.
 */
export function clienteDeServico() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error("Defina SUPABASE_SERVICE_ROLE_KEY para enviar notificações.");
  const { url } = supabaseCredenciais();
  return createClient<Database>(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}
