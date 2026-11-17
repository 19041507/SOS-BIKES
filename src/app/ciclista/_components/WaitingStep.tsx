import type { Mechanic } from "@/data/mechanics";

type WaitingStepProps = {
  mechanic: Mechanic;
  onCancel: () => void;
};

export function WaitingStep({ mechanic, onCancel }: WaitingStepProps) {
  const firstName = mechanic.name.split(" ")[0];
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand-muted text-xl font-bold text-brand">
        {mechanic.initials}
      </span>
      <h2 className="font-display text-[22px] font-bold">Aguardando {firstName}</h2>
      <p className="text-[15px] leading-normal text-muted">
        Seu chamado foi enviado. {firstName} vai aceitar e informar o preço
        estimado e o tempo de chegada.
      </p>
      <button type="button" onClick={onCancel} className="h-11 text-[15px] font-semibold text-danger">
        Cancelar solicitação
      </button>
    </div>
  );
}
