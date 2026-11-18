import { useEffect, useState } from "react";
import type { ChamadoCompleto } from "@/lib/chamados";
import { iniciais, primeiroNome } from "@/lib/pessoas";

type WaitingStepProps = {
  chamado: ChamadoCompleto;
  /** Tempo máximo de espera, em segundos, contado a partir da criação do chamado */
  limitSeconds: number;
  cancelling: boolean;
  onCancel: () => void;
};

function segundosDesde(data: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(data).getTime()) / 1000));
}

function formatElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function WaitingStep({ chamado, limitSeconds, cancelling, onCancel }: WaitingStepProps) {
  const [elapsed, setElapsed] = useState(() => segundosDesde(chamado.criado_em));
  const nome = chamado.mecanico?.nome ?? "o mecânico";

  useEffect(() => {
    const timer = setInterval(() => setElapsed(segundosDesde(chamado.criado_em)), 1000);
    return () => clearInterval(timer);
  }, [chamado.criado_em]);

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="relative flex size-20 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border-4 border-brand-muted border-t-brand motion-safe:animate-spin"
          aria-hidden="true"
        />
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-muted text-lg font-bold text-brand">
          {iniciais(nome)}
        </span>
      </div>
      <div role="status">
        <h2 className="font-display text-[22px] font-bold">Aguardando {primeiroNome(nome)}</h2>
        <p className="mt-1 text-sm font-semibold tabular-nums text-subtle">Aguardando há {formatElapsed(elapsed)}</p>
      </div>
      <p className="text-[15px] leading-normal text-muted">
        Seu chamado foi enviado. {primeiroNome(nome)} vai aceitar e informar o preço estimado e o tempo de chegada.
      </p>
      <p className="text-[13px] text-subtle">
        Se não houver resposta em {Math.round(limitSeconds / 60)} minuto{limitSeconds >= 120 ? "s" : ""}, você volta para a lista.
      </p>
      <button
        type="button"
        disabled={cancelling}
        onClick={onCancel}
        className="h-11 text-[15px] font-semibold text-danger disabled:opacity-60"
      >
        {cancelling ? "Cancelando…" : "Cancelar solicitação"}
      </button>
    </div>
  );
}
