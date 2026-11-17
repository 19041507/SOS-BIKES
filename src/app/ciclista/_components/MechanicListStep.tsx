import type { Mechanic } from "@/data/mechanics";
import { StepHeader } from "./StepHeader";

type MechanicListStepProps = {
  mechanics: Mechanic[];
  notice: string | null;
  onBack: () => void;
  onChoose: (mechanic: Mechanic) => void;
};

export function MechanicListStep({ mechanics, notice, onBack, onChoose }: MechanicListStepProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <StepHeader eyebrow="Etapa 3 de 3" title="Escolha um mecânico" onBack={onBack} />
      {notice && (
        <div role="status" className="rounded-xl bg-warn-soft px-3.5 py-3 text-sm leading-snug font-medium text-warn">
          {notice}
        </div>
      )}
      {mechanics.map((mechanic) => (
        <div key={mechanic.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand">
            {mechanic.initials}
          </span>
          <div className="min-w-0 flex-[1_1_140px]">
            <p className="font-semibold">{mechanic.name}</p>
            <p className="mt-0.5 text-[13px] text-subtle">
              {mechanic.kind} · {mechanic.distance} · <span className="text-star">★</span> {mechanic.rating} ({mechanic.reviews})
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChoose(mechanic)}
            className="h-11 rounded-xl bg-ok px-4.5 text-[15px] font-semibold text-white hover:bg-ok-dark"
          >
            Solicitar
          </button>
        </div>
      ))}
      {mechanics.length === 0 && (
        <p className="text-[15px] text-muted">Nenhum mecânico disponível no momento.</p>
      )}
      <p className="text-[13px] leading-normal text-subtle">
        O mecânico escolhido informa o preço estimado e o tempo de chegada. Você
        confirma antes do atendimento começar.
      </p>
    </div>
  );
}
