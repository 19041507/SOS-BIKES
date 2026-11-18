import { useState } from "react";
import type { ChamadoCompleto } from "@/lib/chamados";
import { formatBRL } from "@/lib/money";
import { progressoDaChegada, useAgora } from "@/lib/movimento";
import { iniciais, linksDeContato, primeiroNome } from "@/lib/pessoas";

const STEPS = ["Confirmado", "A caminho", "Em atendimento", "Finalizado"];

const CANCEL_REASONS = [
  "O mecânico está demorando",
  "Resolvi o problema sozinho",
  "Consegui ajuda de outra forma",
  "Outro motivo",
];

type TrackingStepProps = {
  chamado: ChamadoCompleto;
  busy: boolean;
  onCancel: (reason: string) => void;
};

export function TrackingStep({ chamado, busy, onCancel }: TrackingStepProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const mecanico = chamado.mecanico;
  const nome = mecanico?.nome ?? "Mecânico";
  const stage = chamado.status === "em_atendimento" ? 2 : 1;
  const contato = linksDeContato(mecanico?.telefone ?? null);
  const agora = useAgora();
  const { minutosRestantes } = progressoDaChegada(chamado.confirmado_em, chamado.tempo_chegada_min, agora);

  return (
    <div className="flex flex-col gap-4.5">
      <div>
        <p className="text-[13px] font-semibold text-subtle">Chamado em andamento</p>
        <h2 className="mt-0.5 font-display text-[22px] font-bold">
          {stage === 1 ? `${primeiroNome(nome)} está a caminho` : "Atendimento em andamento"}
        </h2>
        {stage === 1 && chamado.tempo_chegada_min && (
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {minutosRestantes ? `Chegada estimada em ~${minutosRestantes} min.` : "Deve chegar a qualquer momento."}
          </p>
        )}
      </div>

      <ol className="flex gap-1" aria-label="Etapas do atendimento">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5" aria-current={index === stage ? "step" : undefined}>
            <span className="h-1.5 overflow-hidden rounded-full bg-line">
              <span
                className={`block h-full rounded-full bg-ok transition-[width] duration-700 ease-out motion-reduce:transition-none ${index <= stage ? "w-full" : "w-0"}`}
              />
            </span>
            <span className={`text-xs ${index === stage ? "font-bold" : "font-medium"} ${index <= stage ? "text-ok-dark" : "text-subtle"}`}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3 rounded-2xl border border-line p-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-muted font-bold text-brand">
          {iniciais(nome)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{nome}</p>
          <p className="mt-0.5 text-[13px] text-subtle">{mecanico?.oficina ?? "Mecânico autônomo"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-subtle">estimado</p>
          <p className="font-bold">{formatBRL(chamado.estimativa ?? 0)}</p>
        </div>
      </div>

      {contato ? (
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={contato.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ok text-[15px] font-semibold text-white hover:bg-ok-dark"
          >
            Enviar mensagem
          </a>
          <a
            href={contato.ligacao}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-field text-[15px] font-semibold hover:bg-surface"
          >
            Ligar
          </a>
        </div>
      ) : (
        <p className="text-sm text-muted">Este mecânico não cadastrou telefone.</p>
      )}

      {confirmingCancel ? (
        <fieldset className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-red-50 p-4">
          <legend className="sr-only">Cancelar chamado</legend>
          <p className="font-semibold">Cancelar o chamado com {primeiroNome(nome)}?</p>
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
              }}
              className="h-12 rounded-xl border border-field bg-white text-[15px] font-semibold hover:bg-surface"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={!cancelReason || busy}
              onClick={() => cancelReason && onCancel(cancelReason)}
              className="h-12 rounded-xl bg-danger text-[15px] font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {busy ? "Cancelando…" : "Cancelar chamado"}
            </button>
          </div>
        </fieldset>
      ) : (
        <button type="button" onClick={() => setConfirmingCancel(true)} className="h-11 text-[15px] font-semibold text-danger">
          Cancelar chamado
        </button>
      )}
    </div>
  );
}
