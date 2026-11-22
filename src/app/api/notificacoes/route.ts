import { rotuloCategoria } from "@/lib/categorias";
import { formatBRL } from "@/lib/money";
import { primeiroNome } from "@/lib/pessoas";
import { enviarAviso, type Aviso } from "@/lib/push-servidor";
import { clienteDeServico } from "@/lib/supabase/servico";
import type { Chamado, Mensagem } from "@/lib/supabase/database.types";

/**
 * Recebe os Database Webhooks do Supabase (chamados: INSERT/UPDATE; mensagens: INSERT)
 * e manda o Web Push para quem precisa saber. Ver docs/web-push-mapeamento.md.
 */

type Webhook =
  | { type: "INSERT" | "UPDATE"; table: "chamados"; record: Chamado; old_record: Chamado | null }
  | { type: "INSERT"; table: "mensagens"; record: Mensagem; old_record: null };

const TAMANHO_DO_TEXTO = 120;

function resumir(texto: string) {
  return texto.length > TAMANHO_DO_TEXTO ? `${texto.slice(0, TAMANHO_DO_TEXTO - 1)}…` : texto;
}

async function nomes(ids: string[]) {
  const { data } = await clienteDeServico().from("perfis").select("id, nome, tipo").in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p]));
}

async function avisoDoChamado(evento: Webhook & { table: "chamados" }): Promise<Aviso | null> {
  const chamado = evento.record;
  const anterior = evento.old_record?.status;
  if (evento.type === "UPDATE" && anterior === chamado.status) return null;

  const pessoas = await nomes([chamado.ciclista_id, chamado.mecanico_id]);
  const ciclista = primeiroNome(pessoas.get(chamado.ciclista_id)?.nome ?? "O ciclista");
  const mecanico = primeiroNome(pessoas.get(chamado.mecanico_id)?.nome ?? "O mecânico");
  const tag = `chamado-${chamado.id}`;

  if (evento.type === "INSERT" && chamado.status === "aguardando") {
    return {
      para: chamado.mecanico_id,
      titulo: "Novo chamado",
      texto: `${rotuloCategoria(chamado.categoria)} · ${ciclista} · responda em 1 min`,
      url: "/mecanico",
      tag,
      insistente: true,
    };
  }
  if (chamado.status === "aceito") {
    return {
      para: chamado.ciclista_id,
      titulo: `${mecanico} aceitou seu chamado`,
      texto: `${formatBRL(chamado.estimativa ?? 0)} · chega em ${chamado.tempo_chegada_min} min. Confirme o atendimento.`,
      url: "/ciclista",
      tag,
    };
  }
  if (chamado.status === "em_atendimento") {
    return { para: chamado.ciclista_id, titulo: `${mecanico} chegou ao local`, texto: "O atendimento vai começar.", url: "/ciclista", tag };
  }
  if (chamado.status === "cancelado") {
    // Mesma tag: substitui o aviso de "Novo chamado" se o ciclista cancelou antes da resposta.
    return {
      para: chamado.mecanico_id,
      titulo: `${ciclista} cancelou o chamado`,
      texto: chamado.motivo_cancelamento ?? "O chamado foi encerrado.",
      url: "/mecanico",
      tag,
    };
  }
  return null;
}

async function avisoDaMensagem(mensagem: Mensagem): Promise<Aviso | null> {
  const { data: chamado, error } = await clienteDeServico()
    .from("chamados")
    .select("ciclista_id, mecanico_id")
    .eq("id", mensagem.chamado_id)
    .single();
  // Erro aqui costuma ser a SUPABASE_SERVICE_ROLE_KEY errada: precisa aparecer no log do webhook.
  if (error || !chamado) throw new Error(`Não foi possível ler o chamado da mensagem: ${error?.message ?? "não encontrado"}`);
  const para = mensagem.autor_id === chamado.ciclista_id ? chamado.mecanico_id : chamado.ciclista_id;
  const pessoas = await nomes([mensagem.autor_id, para]);
  const autor = primeiroNome(pessoas.get(mensagem.autor_id)?.nome ?? "Nova mensagem");
  const tipo = pessoas.get(para)?.tipo ?? "ciclista";
  return { para, titulo: autor, texto: resumir(mensagem.texto), url: `/${tipo}`, tag: `chat-${mensagem.chamado_id}` };
}

export async function POST(request: Request) {
  const segredo = process.env.NOTIFICACOES_SEGREDO;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return new Response("Não autorizado", { status: 401 });
  }
  const evento = (await request.json()) as Webhook;
  // Resumo do que chegou, para o log do webhook (net._http_response) explicar cada decisão.
  const recebido = {
    tabela: evento.table,
    tipo: evento.type,
    status: evento.table === "chamados" ? evento.record.status : undefined,
    anterior: evento.table === "chamados" ? evento.old_record?.status : undefined,
  };
  let aviso: Aviso | null;
  try {
    aviso =
      evento.table === "chamados" ? await avisoDoChamado(evento) : evento.table === "mensagens" ? await avisoDaMensagem(evento.record) : null;
  } catch (erro) {
    return Response.json({ recebido, erro: erro instanceof Error ? erro.message : String(erro) });
  }
  if (!aviso) return Response.json({ recebido, aviso: null, motivo: "Esta mudança não gera notificação." });
  // O resultado aparece em net._http_response no Supabase: ajuda a ver por que um aviso não chegou.
  return Response.json({ recebido, ...(await enviarAviso(aviso)) });
}
