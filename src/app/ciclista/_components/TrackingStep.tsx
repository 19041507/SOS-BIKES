import type { Mechanic } from "@/data/mechanics";
import { formatBRL } from "@/lib/money";

const STEPS = ["Confirmado", "A caminho", "Em atendimento", "Finalizado"];

type TrackingStepProps = {
  mechanic: Mechanic;
  /** 1 = a caminho, 2 = em atendimento */
  stage: 1 | 2;
  onCancel: () => void;
};

export function TrackingStep({ mechanic, stage, onCancel }: TrackingStepProps) {
  const firstName = mechanic.name.split(" ")[0];
  return (
    <div className="flex flex-col gap-4.5">
      <div>
        <p className="text-[13px] font-semibold text-subtle">Chamado em andamento</p>
        <h2 className="mt-0.5 font-display text-[22px] font-bold">
          {stage === 1 ? `${firstName} está a caminho` : "Atendimento em andamento"}
        </h2>
      </div>

      <ol className="flex gap-1">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span className={`h-1.5 rounded-full ${index <= stage ? "bg-ok" : "bg-line"}`} />
            <span
              className={`text-xs ${index === stage ? "font-bold" : "font-medium"} ${index <= stage ? "text-ok-dark" : "text-subtle"}`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3 rounded-2xl border border-line p-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-muted font-bold text-brand">
          {mechanic.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{mechanic.name}</p>
          <p className="mt-0.5 text-[13px] text-subtle">
            {mechanic.kind} · ★ {mechanic.rating} ({mechanic.reviews})
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-subtle">estimado</p>
          <p className="font-bold">{formatBRL(mechanic.estimate)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <a
          href="https://wa.me/"
          target="_blank"
          rel="noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ok text-[15px] font-semibold text-white hover:bg-ok-dark"
        >
          Enviar mensagem
        </a>
        <a
          href="tel:"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-field text-[15px] font-semibold hover:bg-surface"
        >
          Ligar
        </a>
      </div>

      <button type="button" onClick={onCancel} className="h-11 text-[15px] font-semibold text-danger">
        Cancelar chamado
      </button>
    </div>
  );
}
