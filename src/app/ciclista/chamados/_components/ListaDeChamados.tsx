"use client";

import { useEffect, useState } from "react";
import { usePerfil } from "@/components/PerfilProvider";
import { ItemDoChamado } from "@/components/historico/ItemDoChamado";
import { ButtonLink } from "@/components/ui/Button";
import { STATUS_EM_ANDAMENTO, listarChamados, type ChamadoCompleto } from "@/lib/chamados";
import type { StatusChamado } from "@/lib/supabase/database.types";

const ABAS: { id: string; rotulo: string; status: StatusChamado[] | null }[] = [
  { id: "todos", rotulo: "Todos", status: null },
  { id: "andamento", rotulo: "Em andamento", status: STATUS_EM_ANDAMENTO },
  { id: "concluidos", rotulo: "Concluídos", status: ["concluido"] },
  { id: "encerrados", rotulo: "Cancelados", status: ["cancelado", "recusado", "expirado"] },
];

export function ListaDeChamados() {
  const perfil = usePerfil();
  const [chamados, setChamados] = useState<ChamadoCompleto[] | null>(null);
  const [erro, setErro] = useState(false);
  const [aba, setAba] = useState("todos");

  useEffect(() => {
    listarChamados({ ciclistaId: perfil.id })
      .then(setChamados)
      .catch(() => setErro(true));
  }, [perfil.id]);

  const filtro = ABAS.find((a) => a.id === aba)?.status;
  const visiveis = chamados?.filter((c) => !filtro || filtro.includes(c.status)) ?? null;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Meus chamados</h1>
          <p className="mt-1 text-[15px] text-muted">Todos os pedidos de socorro que você fez.</p>
        </div>
        <ButtonLink href="/ciclista">Pedir socorro</ButtonLink>
      </div>

      <div role="tablist" aria-label="Filtrar chamados" className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {ABAS.map((a) => {
          const quantidade = chamados?.filter((c) => !a.status || a.status.includes(c.status)).length;
          const ativa = aba === a.id;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => setAba(a.id)}
              className={`flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                ativa ? "bg-white text-brand shadow-sm" : "text-subtle hover:text-ink"
              }`}
            >
              {a.rotulo}
              {quantidade !== undefined && <span className="text-xs tabular-nums opacity-70">{quantidade}</span>}
            </button>
          );
        })}
      </div>

      {erro && <p className="text-muted">Não foi possível carregar seus chamados agora.</p>}
      {!erro && visiveis === null && (
        <ul className="flex flex-col gap-2.5" aria-label="Carregando">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-[74px] rounded-2xl bg-slate-100 motion-safe:animate-pulse" />
          ))}
        </ul>
      )}
      {visiveis?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-field px-4 py-10 text-center">
          <p className="font-semibold">{aba === "todos" ? "Você ainda não fez nenhum pedido" : "Nenhum chamado aqui"}</p>
          <p className="mt-1 text-sm text-muted">Quando sua bike der problema, é só pedir socorro.</p>
        </div>
      )}
      {visiveis && visiveis.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {visiveis.map((c) => (
            <ItemDoChamado key={c.id} chamado={c} visao="ciclista" href={`/ciclista/chamados/${c.id}`} />
          ))}
        </ul>
      )}
    </main>
  );
}
