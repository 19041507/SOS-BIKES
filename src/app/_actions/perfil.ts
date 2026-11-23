"use server";

import { normalizarTelefone } from "@/lib/cadastro";
import { createClient } from "@/lib/supabase/server";

/** `oficina` ausente = não alterar (no Meu perfil completo, a oficina tem seção própria, com CNPJ). */
type DadosDoPerfil = { nome: string; telefone: string; oficina?: string };

export type ResultadoDoPerfil = { erros: Partial<Record<keyof DadosDoPerfil | "geral", string>> } | { ok: true };

/** Atualiza nome, WhatsApp e oficina do usuário logado (o RLS só deixa mexer no próprio perfil). */
export async function atualizarPerfil(dados: DadosDoPerfil): Promise<ResultadoDoPerfil> {
  const nome = dados.nome.trim().replace(/\s+/g, " ");
  const telefone = normalizarTelefone(dados.telefone);

  const erros: Partial<Record<keyof DadosDoPerfil, string>> = {};
  if (nome.length < 3) erros.nome = "Informe seu nome.";
  if (!telefone) erros.telefone = "Informe o WhatsApp com DDD.";
  if (Object.keys(erros).length > 0) return { erros };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { erros: { geral: "Sua sessão expirou. Entre de novo." } };

  const { data: atual } = await supabase.from("perfis").select("tipo").eq("id", auth.user.id).single();
  const { error } = await supabase
    .from("perfis")
    .update({
      nome,
      telefone,
      // Só o mecânico tem oficina; vazio = autônomo.
      ...(atual?.tipo === "mecanico" && dados.oficina !== undefined ? { oficina: dados.oficina.trim() || null } : {}),
    })
    .eq("id", auth.user.id);

  if (error) return { erros: { geral: "Não foi possível salvar. Tente de novo." } };
  return { ok: true };
}
