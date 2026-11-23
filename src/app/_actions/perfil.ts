"use server";

import { normalizarTelefone } from "@/lib/cadastro";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS, type Categoria } from "@/lib/categorias";

/**
 * `oficina` ausente = não alterar (no Meu perfil completo, a oficina tem seção própria, com CNPJ).
 * Região, especialidades e serviços ausentes = não alterar: no Meu perfil eles ficam em "Perfil público",
 * num formulário separado do de contato.
 */
type DadosDoPerfil = {
  nome: string;
  telefone: string;
  oficina?: string;
  bairro_regiao?: string;
  especialidades?: Categoria[];
  servicos?: string;
};

export type ResultadoDoPerfil =
  | { erros: Partial<Record<keyof DadosDoPerfil | "geral", string>> }
  | { ok: true };

/** Atualiza o perfil do usuário logado; o RLS e os grants limitam a escrita ao próprio perfil. */
export async function atualizarPerfil(dados: DadosDoPerfil): Promise<ResultadoDoPerfil> {
  const nome = (typeof dados?.nome === "string" ? dados.nome : "").trim().replace(/\s+/g, " ");
  const telefone = normalizarTelefone(typeof dados?.telefone === "string" ? dados.telefone : "");
  const oficina = (typeof dados?.oficina === "string" ? dados.oficina : "").trim();
  const bairroRegiao = (typeof dados?.bairro_regiao === "string" ? dados.bairro_regiao : "").trim().replace(/\s+/g, " ");
  const servicosValidos = typeof dados?.servicos === "string";
  const servicos = typeof dados?.servicos === "string"
    ? dados.servicos.split(/\r?\n/).map((servico) => servico.trim()).filter(Boolean)
    : [];
  const especialidadesValidas = new Set(CATEGORIAS.map((categoria) => categoria.id));
  const especialidadesInput = Array.isArray(dados?.especialidades) ? dados.especialidades : [];
  const especialidades = Array.isArray(dados?.especialidades)
    ? [...new Set(especialidadesInput)]
    : [];

  const comPublico = dados?.especialidades !== undefined || dados?.servicos !== undefined || dados?.bairro_regiao !== undefined;

  const erros: Partial<Record<keyof DadosDoPerfil, string>> = {};
  if (nome.length < 3) erros.nome = "Informe seu nome.";
  if (!telefone) erros.telefone = "Informe o WhatsApp com DDD.";
  if (comPublico) {
    if (bairroRegiao.length === 1 || bairroRegiao.length > 80) {
      erros.bairro_regiao = "Informe um bairro ou região com 2 a 80 caracteres.";
    }
    if (
      !Array.isArray(dados?.especialidades)
      || especialidades.length > CATEGORIAS.length
      || !especialidades.every((especialidade) => especialidadesValidas.has(especialidade))
    ) {
      erros.especialidades = "Selecione especialidades válidas.";
    }
    if (!servicosValidos || servicos.length > 8 || servicos.some((servico) => servico.length > 80) || servicos.join("").length > 640) {
      erros.servicos = "Informe até 8 serviços, com no máximo 80 caracteres cada.";
    }
  }
  if (Object.keys(erros).length > 0) return { erros };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { erros: { geral: "Sua sessão expirou. Entre de novo." } };

  const { data: atual, error: erroPerfil } = await supabase.from("perfis").select("tipo").eq("id", auth.user.id).single();
  if (erroPerfil || !atual) return { erros: { geral: "Não foi possível verificar seu perfil. Tente de novo." } };

  const { error } = await supabase
    .from("perfis")
    .update({
      nome,
      telefone,
      // Só o mecânico tem oficina; vazio = autônomo.
      ...(atual.tipo === "mecanico"
        ? {
            ...(dados.oficina !== undefined ? { oficina: oficina || null } : {}),
            ...(comPublico ? { bairro_regiao: bairroRegiao || null, especialidades, servicos } : {}),
          }
        : {}),
    })
    .eq("id", auth.user.id);

  if (error) return { erros: { geral: "Não foi possível salvar. Tente de novo." } };
  return { ok: true };
}
