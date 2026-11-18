import { useEffect, useState } from "react";
import { rotuloCategoria } from "@/lib/categorias";
import type { ChamadoCompleto } from "@/lib/chamados";
import { parseBRL } from "@/lib/money";
import { primeiroNome } from "@/lib/pessoas";

type IncomingCallProps = {
  chamado: ChamadoCompleto;
  /** Prazo para responder, em segundos, contado desde a criação do chamado */
  totalSeconds: number;
  /** Outros chamados aguardando resposta depois deste */
  queued: number;
  estimate: string;
  eta: string;
  busy: boolean;
  onEstimateChange: (value: string) => void;
  onEtaChange: (value: string) => void;
  onDecline: () => void;
  onAccept: () => void;
};

function segundosRestantes(criadoEm: string, total: number) {
  return Math.max(0, total - Math.floor((Date.now() - new Date(criadoEm).getTime()) / 1000));
}

export function IncomingCall({
  chamado,
  totalSeconds,
  queued,
  estimate,
  eta,
  busy,
  onEstimateChange,
  onEtaChange,
  onDecline,
  onAccept,
}: IncomingCallProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => segundosRestantes(chamado.criado_em, totalSeconds));
  const canAccept = parseBRL(estimate) > 0 && Number.isInteger(Number(eta)) && Number(eta) > 0 && !busy;
  const urgent = secondsLeft <= 15;
  const nome = chamado.ciclista?.nome ?? "Um ciclista";

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(segundosRestantes(chamado.criado_em, totalSeconds)), 1000);
    return () => clearInterval(timer);
  }, [chamado.criado_em, totalSeconds]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13px] font-semibold text-warn">Novo chamado</p>
          <h2 className="mt-0.5 font-display text-[22px] font-bold">{primeiroNome(nome)} escolheu você</h2>
        </div>
        {queued > 0 && (
          <span className="rounded-full bg-warn-soft px-3 py-1.5 text-[13px] font-semibold text-warn">
            +{queued} {queued === 1 ? "chamado aguardando" : "chamados aguardando"}
          </span>
        )}
      </div>

      <div>
        <p className={`text-sm font-semibold tabular-nums ${urgent ? "text-danger" : "text-muted"}`}>
          Responda em {secondsLeft} s
        </p>
        <div
          role="progressbar"
          aria-label="Tempo para responder o chamado"
          aria-valuemin={0}
          aria-valuemax={totalSeconds}
          aria-valuenow={secondsLeft}
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line"
        >
          <div
            style={{ width: `${(secondsLeft / totalSeconds) * 100}%` }}
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${urgent ? "bg-danger" : "bg-ok"}`}
          />
        </div>
      </div>

      <dl className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2">
        <div>
          <dt className="text-[13px] text-subtle">Problema</dt>
          <dd className="text-lg font-bold">{rotuloCategoria(chamado.categoria)}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-subtle">Ciclista</dt>
          <dd className="font-semibold">{nome}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[13px] text-subtle">Onde</dt>
          <dd className="font-semibold">{chamado.endereco}</dd>
        </div>
        {chamado.detalhes && (
          <div className="sm:col-span-2">
            <dt className="sr-only">Detalhes</dt>
            <dd className="rounded-lg bg-slate-100 p-2.5 text-sm leading-snug text-slate-700">“{chamado.detalhes}”</dd>
          </div>
        )}
      </dl>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="estimate" className="text-sm font-semibold">Preço estimado (R$)</label>
          <input
            id="estimate"
            inputMode="decimal"
            placeholder="Ex.: 25,00"
            value={estimate}
            onChange={(event) => onEstimateChange(event.target.value)}
            className="h-12 rounded-xl border border-field px-3 text-[17px] font-semibold placeholder:font-normal placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="eta" className="text-sm font-semibold">Tempo até chegar (min)</label>
          <input
            id="eta"
            inputMode="numeric"
            placeholder="Ex.: 10"
            value={eta}
            onChange={(event) => onEtaChange(event.target.value)}
            className="h-12 rounded-xl border border-field px-3 text-[17px] font-semibold placeholder:font-normal placeholder:text-slate-400"
          />
        </div>
      </div>
      <p className="text-sm text-muted">O ciclista é avisado de que o valor final pode variar conforme o serviço realizado.</p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onDecline}
          className="h-14 rounded-xl border border-field bg-white text-base font-semibold hover:bg-surface disabled:opacity-60"
        >
          Recusar
        </button>
        <button
          type="button"
          disabled={!canAccept}
          onClick={onAccept}
          className="h-14 rounded-xl bg-ok text-base font-semibold text-white hover:bg-ok-dark disabled:cursor-not-allowed disabled:bg-[#a9bcd8]"
        >
          {busy ? "Enviando…" : "Aceitar e enviar"}
        </button>
      </div>
    </div>
  );
}
