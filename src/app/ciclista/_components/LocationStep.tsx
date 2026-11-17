import { StepHeader } from "./StepHeader";

type LocationStepProps = {
  categoryLabel: string;
  onBack: () => void;
  onNext: () => void;
};

export function LocationStep({ categoryLabel, onBack, onNext }: LocationStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader eyebrow="Etapa 2 de 3" title="Confirme sua localização" onBack={onBack} />
      <div className="flex items-start gap-3 rounded-xl border border-line p-4">
        <svg className="shrink-0 text-ok" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <div>
          <p className="text-[13px] text-subtle">Localização pelo GPS</p>
          <p className="mt-0.5 font-semibold">R. da Aurora, Boa Vista — Recife</p>
        </div>
      </div>
      <p className="text-sm text-muted">
        Problema informado: <strong className="text-brand">{categoryLabel}</strong>
      </p>
      <button
        type="button"
        onClick={onNext}
        className="h-14 rounded-xl bg-brand text-base font-semibold text-white hover:bg-brand-dark"
      >
        Confirmar e buscar mecânicos
      </button>
    </div>
  );
}
