"use client";

import { createClient } from "@/lib/supabase/client";

/** Último atendimento concluído e os números do mês do ciclista. */
export async function resumoDoCiclista(ciclistaId: string) {
  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);
  const supabase = createClient();

  const [ultimo, mes] = await Promise.all([
    supabase
      .from("chamados")
      .select(
        "id, categoria, valor_final, concluido_em, mecanico:perfis!chamados_mecanico_id_fkey(nome, oficina), avaliacao:avaliacoes(nota)",
      )
      .eq("ciclista_id", ciclistaId)
      .eq("status", "concluido")
      .order("concluido_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("chamados")
      .select("valor_final")
      .eq("ciclista_id", ciclistaId)
      .eq("status", "concluido")
      .gte("concluido_em", inicioDoMes.toISOString()),
  ]);

  if (ultimo.error || mes.error) throw new Error("Não foi possível carregar seu resumo.");

  return {
    ultimo: ultimo.data,
    chamadosNoMes: mes.data.length,
    gastoNoMes: mes.data.reduce((total, c) => total + (c.valor_final ?? 0), 0),
  };
}
