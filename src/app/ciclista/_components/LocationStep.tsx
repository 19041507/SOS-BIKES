import { useState } from "react";
import { StepHeader } from "./StepHeader";
import { Button } from "@/components/ui/Button";

type LocationStepProps = {
  categoryLabel: string;
  address: string;
  hasPosition: boolean;
  /** Lê o GPS e preenche o endereço; lança o erro para mostrar no campo. */
  onLocate: () => Promise<void>;
  onAddressChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function LocationStep({
  categoryLabel,
  address,
  hasPosition,
  onLocate,
  onAddressChange,
  onBack,
  onNext,
}: LocationStepProps) {
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  async function locate() {
    setLocating(true);
    setError(null);
    try {
      await onLocate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível obter sua localização. Digite o endereço.");
    } finally {
      setLocating(false);
    }
  }

  function confirm() {
    if (address.trim().length < 5) {
      setError("Informe a rua e o bairro onde você está.");
      return;
    }
    onNext();
  }

  return (
    <div className="flex flex-col gap-4">
      <StepHeader eyebrow="Etapa 2 de 3" title="Onde você está?" onBack={onBack} />
      <Button variant="secondary" loading={locating} loadingText="Localizando…" onClick={() => void locate()}>
        {hasPosition ? "Atualizar minha localização" : "Usar minha localização"}
      </Button>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="address" className="text-sm font-semibold">Endereço ou ponto de referência</label>
        <div className="relative">
          <svg className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ok" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <input
            id="address"
            autoComplete="street-address"
            placeholder="Ex.: R. da Aurora, 300 — Boa Vista"
            value={address}
            onChange={(event) => {
              onAddressChange(event.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "address-error" : "address-hint"}
            className="h-12 w-full rounded-xl border border-field bg-white pr-3.5 pl-11 text-[15px] outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger"
          />
        </div>
        {error ? (
          <p id="address-error" className="text-[13px] text-danger">{error}</p>
        ) : (
          <p id="address-hint" className="text-[13px] text-subtle">O mecânico usa esse endereço para chegar até você.</p>
        )}
      </div>
      <p className="text-sm text-muted">
        Problema informado: <strong className="text-brand">{categoryLabel}</strong>
      </p>
      <Button
        size="lg"
        onClick={confirm}
      >
        Buscar mecânicos disponíveis
      </Button>
    </div>
  );
}
