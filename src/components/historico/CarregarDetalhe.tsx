"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { buscarChamado, type ChamadoCompleto } from "@/lib/chamados";
import { DetalheDoChamado } from "./DetalheDoChamado";

type CarregarDetalheProps = {
  params: Promise<{ id: string }>;
  visao: "ciclista" | "mecanico";
  voltarPara: { href: string; rotulo: string };
};

/** Busca o chamado pelo id da rota. O RLS só devolve chamados de quem participa. */
export function CarregarDetalhe({ params, visao, voltarPara }: CarregarDetalheProps) {
  const { id } = use(params);
  const [chamado, setChamado] = useState<ChamadoCompleto | null | undefined>(undefined);

  useEffect(() => {
    buscarChamado(id)
      .then(setChamado)
      .catch(() => setChamado(null));
  }, [id]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-3 sm:p-4">
      <Link href={voltarPara.href} className="flex w-fit items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
        {voltarPara.rotulo}
      </Link>
      {chamado === undefined && <div className="h-64 rounded-2xl bg-slate-100 motion-safe:animate-pulse" aria-label="Carregando" />}
      {chamado === null && (
        <Card className="text-center">
          <h1 className="font-display text-xl font-bold">Chamado não encontrado</h1>
          <p className="mt-2 text-muted">Ele não existe ou não pertence à sua conta.</p>
        </Card>
      )}
      {chamado && <DetalheDoChamado chamado={chamado} visao={visao} />}
    </main>
  );
}
