import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { rotuloCategoria } from "@/lib/categorias";
import type { ChamadoCompleto } from "@/lib/chamados";
import { formatBRL } from "@/lib/money";
import { dataEHora } from "./datas";

type ItemDoChamadoProps = {
  chamado: ChamadoCompleto;
  visao: "ciclista" | "mecanico";
  href: string;
};

export function ItemDoChamado({ chamado, visao, href }: ItemDoChamadoProps) {
  const outra = visao === "ciclista" ? chamado.mecanico?.nome : chamado.ciclista?.nome;
  const valor =
    chamado.valor_final !== null
      ? visao === "mecanico"
        ? chamado.valor_final - (chamado.comissao ?? 0)
        : chamado.valor_final
      : null;

  return (
    <li>
      <Link
        href={href}
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-brand hover:bg-brand-soft/40 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <div className="min-w-0 flex-[1_1_200px]">
          <p className="font-semibold">{rotuloCategoria(chamado.categoria)}</p>
          <p className="truncate text-[13px] text-subtle">
            {outra ?? "—"} · {dataEHora.format(new Date(chamado.criado_em))}
          </p>
        </div>
        <StatusBadge status={chamado.status} />
        <span className="w-24 text-right font-semibold tabular-nums">
          {valor !== null ? formatBRL(valor) : <span className="text-sm font-normal text-subtle">—</span>}
        </span>
        <svg className="hidden text-subtle sm:block" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    </li>
  );
}
