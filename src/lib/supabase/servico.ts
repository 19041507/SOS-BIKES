import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseCredenciais } from "./config";
import type { Database } from "./database.types";

/**
 * Cliente com a chave de serviço: ignora o RLS. Só para o servidor (envio de notificações),
 * nunca para dados de quem está logado.
 */
/** Variáveis coladas na Vercel às vezes levam espaço ou quebra de linha no fim. */
export function variavel(nome: string) {
  return process.env[nome]?.trim() || undefined;
}

/**
 * Descreve a chave sem revelar nada dela (tamanho e formato), para entender por que o Supabase
 * a recusou: a service_role começa com "eyJ" e a secret key com "sb_secret_".
 */
export function resumoDaChave() {
  const chave = variavel("SUPABASE_SERVICE_ROLE_KEY");
  if (!chave) return "não definida";
  const formato = chave.startsWith("eyJ") ? "service_role (eyJ…)" : chave.startsWith("sb_secret_") ? "secret key (sb_secret_…)" : "formato desconhecido";
  return `${chave.length} caracteres, ${formato}`;
}

export function clienteDeServico() {
  const chave = variavel("SUPABASE_SERVICE_ROLE_KEY");
  if (!chave) throw new Error("Defina SUPABASE_SERVICE_ROLE_KEY para enviar notificações.");
  const { url } = supabaseCredenciais();
  return createClient<Database>(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}
