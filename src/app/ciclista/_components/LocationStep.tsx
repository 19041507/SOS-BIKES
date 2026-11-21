import { useState } from "react";
import { StepHeader } from "./StepHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { enderecoDaPosicao, obterPosicao, type Posicao } from "@/lib/localizacao";

type LocationStepProps = {
  categoryLabel: string;
  address: string;
  position: Posicao | null;
  onPositionChange: (value: Posicao | null) => void;
  authorized: boolean;
  onAuthorizationChange: (value: boolean) => void;
  onAddressChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function LocationStep({
  categoryLabel,
  address,
  position,
  onPositionChange,
  authorized,
  onAuthorizationChange,
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
      const posicao = await obterPosicao();
      onPositionChange(posicao);
      const endereco = await enderecoDaPosicao(posicao);
      if (endereco) onAddressChange(endereco);
      else setError("Achamos sua localização, mas não o nome da rua. Digite o endereço ou uma referência.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível obter sua localização. Digite o endereço.");
    } finally {
      setLocating(false);
    }
  }

  if (!authorized) return (
    <div className="flex flex-col gap-4">
      <StepHeader eyebrow="Etapa 2 de 3" title="Antes de informar o local" onBack={onBack} />
      <div className="rounded-2xl border border-brand/20 bg-brand-soft p-4 text-sm leading-relaxed text-brand-dark">
        <p className="font-semibold">Seu endereço ajuda o mecânico a chegar até você.</p>
        <p className="mt-2">Você pode usar a localização do celular ou digitar o endereço. A localização é lida uma vez, quando você toca no botão; não acompanhamos seus deslocamentos.</p>
        <p className="mt-2">O local informado será compartilhado com o mecânico escolhido quando você enviar o pedido. Você pode voltar sem informar, mas o atendimento precisa de um endereço.</p>
      </div>
      <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center text-sm font-semibold text-brand underline">Ler a política de privacidade (nova aba)</Link>
      <Button size="lg" onClick={() => onAuthorizationChange(true)}>Concordo em informar o local</Button>
      <Button variant="secondary" onClick={onBack}>Agora não</Button>
    </div>
  );

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
        {position ? "Atualizar minha localização" : "Usar minha localização"}
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
      <button
        type="button"
        onClick={() => {
          setError(null);
          onAuthorizationChange(false);
        }}
        className="min-h-11 rounded-lg text-left text-sm font-semibold text-brand underline"
      >
        Retirar autorização e apagar endereço
      </button>
      <Button
        size="lg"
        onClick={confirm}
      >
        Buscar mecânicos disponíveis
      </Button>
    </div>
  );
}
