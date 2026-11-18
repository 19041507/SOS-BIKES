import type { StatusChamado } from "@/lib/supabase/database.types";

const STATUS: Record<StatusChamado, { label: string; className: string }> = {
  aguardando: { label: "Aguardando resposta", className: "bg-warn-soft text-warn" },
  aceito: { label: "Aguardando confirmação", className: "bg-warn-soft text-warn" },
  a_caminho: { label: "A caminho", className: "bg-brand-soft text-brand" },
  em_atendimento: { label: "Em atendimento", className: "bg-brand-soft text-brand" },
  concluido: { label: "Concluído", className: "bg-ok-soft text-ok-dark" },
  recusado: { label: "Recusado", className: "bg-slate-100 text-slate-700" },
  cancelado: { label: "Cancelado", className: "bg-red-50 text-danger" },
  expirado: { label: "Expirado", className: "bg-slate-100 text-slate-700" },
};

export function rotuloStatus(status: StatusChamado) {
  return STATUS[status].label;
}

export function StatusBadge({ status }: { status: StatusChamado }) {
  const { label, className } = STATUS[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}
