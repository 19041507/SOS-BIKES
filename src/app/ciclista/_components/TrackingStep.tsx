import { useState } from "react";
import type { Mechanic } from "@/data/mechanics";
import { formatBRL } from "@/lib/money";

const STEPS = ["Confirmado", "A caminho", "Em atendimento", "Finalizado"];

const CANCEL_REASONS = [
  "O mecânico está demorando",
  "Resolvi o problema sozinho",
  "Consegui ajuda de outra forma",
  "Outro motivo",
];

type TrackingStepProps = {
  mechanic: Mechanic;
  /** 1 = a caminho, 2 = em atendimento */
  stage: 1 | 2;
  onCancel: () => void;
  /** Avisado ao abrir e fechar a confirmação, para pausar a simulação */
  onConfirmingCancelChange: (confirming: boolean) => void;
};

export function TrackingStep({ mechanic, stage, onCancel, onConfirmingCancelChange }: TrackingStepProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
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

      {confirmingCancel ? (
        <fieldset className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-red-50 p-4">
          <legend className="sr-only">Cancelar chamado</legend>
          <p className="font-semibold">Cancelar o chamado com {firstName}?</p>
          <p className="-mt-1.5 text-sm text-muted">Conte o motivo:</p>
          <div className="flex flex-col gap-1">
            {CANCEL_REASONS.map((reason) => (
              <label key={reason} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-[15px] hover:bg-white">
                <input
                  type="radio"
                  name="cancel-reason"
                  value={reason}
                  checked={cancelReason === reason}
                  onChange={() => setCancelReason(reason)}
                  className="size-4 accent-danger"
                />
                {reason}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setConfirmingCancel(false);
                setCancelReason(null);
                onConfirmingCancelChange(false);
              }}
              className="h-12 rounded-xl border border-field bg-white text-[15px] font-semibold hover:bg-surface"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={!cancelReason}
              onClick={onCancel}
              className="h-12 rounded-xl bg-danger text-[15px] font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              Cancelar chamado
            </button>
          </div>
        </fieldset>
      ) : (
        <button
          type="button"
          onClick={() => {
            setConfirmingCancel(true);
            onConfirmingCancelChange(true);
          }}
          className="h-11 text-[15px] font-semibold text-danger"
        >
          Cancelar chamado
        </button>
      )}
    </div>
  );
}
