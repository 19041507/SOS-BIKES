"use client";

import { createClient } from "@/lib/supabase/client";
import type { Categoria } from "@/lib/categorias";

const DIA = 24 * 60 * 60 * 1000;

function inicioDoDia(data: Date) {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

export type Atendimento = {
  id: string;
  categoria: Categoria;
  ciclista: string;
  liquido: number;
  concluidoEm: string;
};

export type AvaliacaoRecebida = {
  id: string;
  nota: number;
  comentario: string | null;
  ciclista: string;
};

export type DadosDoPainel = {
  hoje: { atendimentos: number; liquido: number };
  semana: number;
  mes: number;
  /** Líquido de cada um dos últimos 7 dias, do mais antigo para hoje. */
  grafico: { dia: Date; liquido: number }[];
  /** Aceitos ÷ respondidos ou expirados nos últimos 30 dias; null sem chamados. */
  taxaDeAceite: number | null;
  recentes: Atendimento[];
  avaliacoes: AvaliacaoRecebida[];
  media: number | null;
  totalDeAvaliacoes: number;
};

/** Tudo o que o painel do mecânico mostra, calculado a partir dos chamados e avaliações dele. */
export async function dadosDoPainel(mecanicoId: string): Promise<DadosDoPainel> {
  const agora = new Date();
  const hoje = inicioDoDia(agora);
  const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const trintaDias = new Date(hoje.getTime() - 29 * DIA);
  const desde = inicioDoMes < trintaDias ? inicioDoMes : trintaDias;
  const supabase = createClient();

  const [chamados, notas] = await Promise.all([
    supabase
      .from("chamados")
      .select(
        "id, status, categoria, valor_final, comissao, criado_em, aceito_em, concluido_em, ciclista:perfis!chamados_ciclista_id_fkey(nome), avaliacao:avaliacoes(nota, comentario, criado_em)",
      )
      .eq("mecanico_id", mecanicoId)
      .gte("criado_em", desde.toISOString())
      .order("criado_em", { ascending: false })
      .limit(500),
    supabase.from("avaliacoes").select("nota, chamado:chamados!inner(mecanico_id)").eq("chamado.mecanico_id", mecanicoId),
  ]);
  if (chamados.error || notas.error) throw new Error("Não foi possível carregar o painel.");

  const concluidos = chamados.data
    .filter((c) => c.status === "concluido" && c.concluido_em)
    .map((c) => ({ ...c, liquido: (c.valor_final ?? 0) - (c.comissao ?? 0), quando: new Date(c.concluido_em!) }));
  const somar = (lista: typeof concluidos) => lista.reduce((total, c) => total + c.liquido, 0);
  const desdeDia = (inicio: Date) => concluidos.filter((c) => c.quando >= inicio);

  const seteDias = new Date(hoje.getTime() - 6 * DIA);
  const grafico = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(seteDias.getTime() + i * DIA);
    const fim = new Date(dia.getTime() + DIA);
    return { dia, liquido: somar(concluidos.filter((c) => c.quando >= dia && c.quando < fim)) };
  });

  const ultimos30 = chamados.data.filter((c) => new Date(c.criado_em) >= trintaDias && c.status !== "aguardando");
  const aceitos = ultimos30.filter((c) => c.aceito_em).length;

  const avaliacoes = chamados.data
    .filter((c) => c.avaliacao)
    .sort((a, b) => (b.avaliacao!.criado_em > a.avaliacao!.criado_em ? 1 : -1))
    .slice(0, 3)
    .map((c) => ({ id: c.id, nota: c.avaliacao!.nota, comentario: c.avaliacao!.comentario, ciclista: c.ciclista?.nome ?? "Ciclista" }));

  const todasAsNotas = notas.data.map((n) => n.nota);

  return {
    hoje: { atendimentos: desdeDia(hoje).length, liquido: somar(desdeDia(hoje)) },
    semana: somar(desdeDia(seteDias)),
    mes: somar(desdeDia(inicioDoMes)),
    grafico,
    taxaDeAceite: ultimos30.length ? aceitos / ultimos30.length : null,
    recentes: concluidos.slice(0, 3).map((c) => ({
      id: c.id,
      categoria: c.categoria,
      ciclista: c.ciclista?.nome ?? "Ciclista",
      liquido: c.liquido,
      concluidoEm: c.concluido_em!,
    })),
    avaliacoes,
    media: todasAsNotas.length ? todasAsNotas.reduce((a, b) => a + b, 0) / todasAsNotas.length : null,
    totalDeAvaliacoes: todasAsNotas.length,
  };
}
