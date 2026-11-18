"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Avaliacao, Chamado, Database, Perfil, StatusChamado } from "@/lib/supabase/database.types";
import type { Categoria } from "@/lib/categorias";

/** Prazo para o mecânico responder um chamado, em segundos (contado a partir da criação). */
export const PRAZO_RESPOSTA = 60;

export const STATUS_EM_ANDAMENTO: StatusChamado[] = ["aguardando", "aceito", "a_caminho", "em_atendimento"];

export type MecanicoDisponivel = Database["public"]["Functions"]["mecanicos_disponiveis"]["Returns"][number];

export type ChamadoCompleto = Chamado & {
  ciclista: Pick<Perfil, "id" | "nome" | "telefone"> | null;
  mecanico: Pick<Perfil, "id" | "nome" | "telefone" | "oficina"> | null;
  avaliacao: Avaliacao | null;
};

const COLUNAS =
  "*, ciclista:perfis!chamados_ciclista_id_fkey(id, nome, telefone), mecanico:perfis!chamados_mecanico_id_fkey(id, nome, telefone, oficina), avaliacao:avaliacoes(*)";

function supabase() {
  return createClient();
}

/** Mensagem legível para os erros do banco (as regras do trigger já vêm em português). */
function mensagemDeErro(error: { message: string; code?: string }) {
  if (error.code === "23505" && error.message.includes("chamados_um_ativo_por_ciclista")) {
    return "Você já tem um chamado em andamento.";
  }
  if (error.code === "P0001") return error.message;
  return "Não foi possível concluir a ação. Tente de novo.";
}

function resultado<T>(data: T | null, error: { message: string; code?: string } | null) {
  if (error || data === null) throw new Error(error ? mensagemDeErro(error) : "Registro não encontrado.");
  return data;
}

export async function listarMecanicosDisponiveis() {
  const { data, error } = await supabase().rpc("mecanicos_disponiveis");
  return resultado(data, error);
}

export async function buscarChamado(id: string) {
  const { data, error } = await supabase().from("chamados").select(COLUNAS).eq("id", id).single();
  return resultado(data, error) as ChamadoCompleto;
}

/**
 * Chamado que o ciclista deve ver ao abrir a tela: o que está em andamento ou,
 * se não houver, um concluído nas últimas 24 h que ainda não foi avaliado.
 */
export async function chamadoAtualDoCiclista(ciclistaId: string) {
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase()
    .from("chamados")
    .select(COLUNAS)
    .eq("ciclista_id", ciclistaId)
    .or(`status.in.(${STATUS_EM_ANDAMENTO.join(",")}),and(status.eq.concluido,concluido_em.gt.${ontem})`)
    .order("criado_em", { ascending: false })
    .limit(5);
  const chamados = resultado(data, error) as ChamadoCompleto[];
  return chamados.find((c) => STATUS_EM_ANDAMENTO.includes(c.status)) ?? chamados.find((c) => !c.avaliacao) ?? null;
}

/** Chamados em andamento do mecânico, do mais antigo para o mais novo. */
export async function chamadosEmAndamentoDoMecanico(mecanicoId: string) {
  const { data, error } = await supabase()
    .from("chamados")
    .select(COLUNAS)
    .eq("mecanico_id", mecanicoId)
    .in("status", STATUS_EM_ANDAMENTO)
    .order("criado_em", { ascending: true });
  return resultado(data, error) as ChamadoCompleto[];
}

export async function abrirChamado(dados: {
  ciclistaId: string;
  mecanicoId: string;
  categoria: Categoria;
  detalhes: string;
  endereco: string;
}) {
  const { data, error } = await supabase()
    .from("chamados")
    .insert({
      ciclista_id: dados.ciclistaId,
      mecanico_id: dados.mecanicoId,
      categoria: dados.categoria,
      detalhes: dados.detalhes.trim() || null,
      endereco: dados.endereco.trim(),
    })
    .select(COLUNAS)
    .single();
  return resultado(data, error) as ChamadoCompleto;
}

type MudancaDeChamado = Pick<
  Database["public"]["Tables"]["chamados"]["Update"],
  "status" | "estimativa" | "tempo_chegada_min" | "valor_final" | "motivo_variacao" | "motivo_cancelamento"
> & { status: StatusChamado };

/** Muda o status; o banco valida quem pode fazer cada mudança e preenche os horários. */
export async function mudarChamado(id: string, mudanca: MudancaDeChamado) {
  const { data, error } = await supabase().from("chamados").update(mudanca).eq("id", id).select(COLUNAS).single();
  return resultado(data, error) as ChamadoCompleto;
}

export async function avaliarChamado(dados: { chamadoId: string; nota: number; comentario: string; gorjeta: number | null }) {
  const { error } = await supabase().from("avaliacoes").insert({
    chamado_id: dados.chamadoId,
    nota: dados.nota,
    comentario: dados.comentario.trim() || null,
    gorjeta: dados.gorjeta,
  });
  if (error) throw new Error(mensagemDeErro(error));
}

export async function definirDisponibilidade(perfilId: string, disponivel: boolean) {
  const { error } = await supabase().from("perfis").update({ disponivel }).eq("id", perfilId);
  if (error) throw new Error(mensagemDeErro(error));
}

/** Atendimentos concluídos hoje e a nota média do mecânico. */
export async function resumoDoMecanico(mecanicoId: string) {
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);
  const cliente = supabase();
  const [hoje, avaliacoes] = await Promise.all([
    cliente
      .from("chamados")
      .select("valor_final, comissao")
      .eq("mecanico_id", mecanicoId)
      .eq("status", "concluido")
      .gte("concluido_em", inicioDoDia.toISOString()),
    cliente.from("avaliacoes").select("nota, chamado:chamados!inner(mecanico_id)").eq("chamado.mecanico_id", mecanicoId),
  ]);
  const concluidos = resultado(hoje.data, hoje.error);
  const notas = resultado(avaliacoes.data, avaliacoes.error).map((a) => a.nota);
  return {
    atendimentosHoje: concluidos.length,
    ganhosHoje: concluidos.reduce((total, c) => total + (c.valor_final ?? 0) - (c.comissao ?? 0), 0),
    media: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null,
  };
}

/**
 * Chama `aoMudar` a cada inserção ou atualização em `chamados` que o usuário pode ver
 * (o Realtime respeita o RLS). `filtro` no formato do Realtime, ex.: "mecanico_id=eq.<id>".
 */
export function useMudancasEmChamados(filtro: string | null, aoMudar: () => void) {
  const callback = useRef(aoMudar);
  useEffect(() => {
    callback.current = aoMudar;
  });

  useEffect(() => {
    if (!filtro) return;
    const cliente = supabase();
    const canal = cliente
      .channel(`chamados:${filtro}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chamados", filter: filtro }, () =>
        callback.current(),
      )
      .subscribe();
    return () => {
      cliente.removeChannel(canal);
    };
  }, [filtro]);
}
