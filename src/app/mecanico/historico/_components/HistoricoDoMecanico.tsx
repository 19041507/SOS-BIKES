"use client";

import { useEffect, useState } from "react";
import { usePerfil } from "@/components/PerfilProvider";
import { ItemDoChamado } from "@/components/historico/ItemDoChamado";
import { Card } from "@/components/ui/Card";
import { listarChamados, type ChamadoCompleto } from "@/lib/chamados";
import { formatBRL } from "@/lib/money";

const PERIODOS = [
  { id: "7", rotulo: "7 dias", dias: 7 },
  { id: "30", rotulo: "30 dias", dias: 30 },
  { id: "tudo", rotulo: "Tudo", dias: null },
] as const;

export function HistoricoDoMecanico() {
  const perfil = usePerfil();
  const [chamados, setChamados] = useState<ChamadoCompleto[] | null>(null);
  const [erro, setErro] = useState(false);
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]["id"]>("30");
  const [soConcluidos, setSoConcluidos] = useState(false);

  useEffect(() => {
    listarChamados({ mecanicoId: perfil.id })
      .then(setChamados)
      .catch(() => setErro(true));
  }, [perfil.id]);

  const dias = PERIODOS.find((p) => p.id === periodo)?.dias ?? null;
  const [inicio] = useState(() => Date.now());
  const desde = dias === null ? null : inicio - dias * 24 * 60 * 60 * 1000;
  const doPeriodo = chamados?.filter((c) => desde === null || new Date(c.criado_em).getTime() >= desde) ?? null;
  const concluidos = doPeriodo?.filter((c) => c.status === "concluido") ?? [];
  const bruto = concluidos.reduce((t, c) => t + (c.valor_final ?? 0), 0);
  const comissao = concluidos.reduce((t, c) => t + (c.comissao ?? 0), 0);
  const visiveis = soConcluidos ? concluidos : doPeriodo;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-3 sm:p-4">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Histórico</h1>
        <p className="mt-1 text-[15px] text-muted">Seus atendimentos e quanto você recebeu.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Período" className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={periodo === p.id}
              onClick={() => setPeriodo(p.id)}
              className={`h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${
                periodo === p.id ? "bg-white text-brand shadow-sm" : "text-subtle hover:text-ink"
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={soConcluidos} onChange={(e) => setSoConcluidos(e.target.checked)} className="size-4 accent-brand" />
          Só concluídos
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { rotulo: "Atendimentos", valor: doPeriodo ? String(concluidos.length) : "–" },
          { rotulo: "Valor bruto", valor: doPeriodo ? formatBRL(bruto) : "–" },
          { rotulo: "Comissão (10%)", valor: doPeriodo ? `− ${formatBRL(comissao)}` : "–" },
          { rotulo: "Você recebeu", valor: doPeriodo ? formatBRL(bruto - comissao) : "–", destaque: true },
        ].map((item) => (
          <Card key={item.rotulo} className="!p-4">
            <p className="text-[13px] text-subtle">{item.rotulo}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${item.destaque ? "text-ok-dark" : ""}`}>{item.valor}</p>
          </Card>
        ))}
      </div>

      {erro && <p className="text-muted">Não foi possível carregar o histórico agora.</p>}
      {!erro && visiveis === null && (
        <ul className="flex flex-col gap-2.5" aria-label="Carregando">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-[74px] rounded-2xl bg-slate-100 motion-safe:animate-pulse" />
          ))}
        </ul>
      )}
      {visiveis?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-field px-4 py-10 text-center">
          <p className="font-semibold">Nenhum atendimento neste período</p>
          <p className="mt-1 text-sm text-muted">Fique disponível no painel para receber chamados.</p>
        </div>
      )}
      {visiveis && visiveis.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {visiveis.map((c) => (
            <ItemDoChamado key={c.id} chamado={c} visao="mecanico" href={`/mecanico/historico/${c.id}`} />
          ))}
        </ul>
      )}
    </main>
  );
}
