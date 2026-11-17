import { useEffect, useState } from "react";
import type { Mechanic } from "@/data/mechanics";

type WaitingStepProps = {
  mechanic: Mechanic;
  /** Tempo máximo de espera, em segundos */
  limitSeconds: number;
  onCancel: () => void;
};

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function WaitingStep({ mechanic, limitSeconds, onCancel }: WaitingStepProps) {
  const [elapsed, setElapsed] = useState(0);
  const firstName = mechanic.name.split(" ")[0];

  useEffect(() => {
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="relative flex size-20 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border-4 border-brand-muted border-t-brand motion-safe:animate-spin"
          aria-hidden="true"
        />
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-muted text-lg font-bold text-brand">
          {mechanic.initials}
        </span>
      </div>
      <div role="status">
        <h2 className="font-display text-[22px] font-bold">Aguardando {firstName}</h2>
        <p className="mt-1 text-sm font-semibold tabular-nums text-subtle">
          Aguardando há {formatElapsed(elapsed)}
        </p>
      </div>
      <p className="text-[15px] leading-normal text-muted">
        Seu chamado foi enviado. {firstName} vai aceitar e informar o preço estimado e o
        tempo de chegada.
      </p>
      <p className="text-[13px] text-subtle">
        Se não houver resposta em {Math.round(limitSeconds / 60)} minuto
        {limitSeconds >= 120 ? "s" : ""}, você volta para a lista.
      </p>
      <button type="button" onClick={onCancel} className="h-11 text-[15px] font-semibold text-danger">
        Cancelar solicitação
      </button>
    </div>
  );
}
