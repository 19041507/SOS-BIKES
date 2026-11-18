import { useState } from "react";
import { Confetes } from "@/components/ui/Confetes";
import type { ChamadoCompleto } from "@/lib/chamados";
import { formatBRL, parseBRL } from "@/lib/money";
import { primeiroNome } from "@/lib/pessoas";

const TIPS = [5, 10, 20];

type FinishedStepProps = {
  chamado: ChamadoCompleto;
  busy: boolean;
  error: string | null;
  onConfirm: (avaliacao: { nota: number; comentario: string; gorjeta: number | null }) => void;
};

export function FinishedStep({ chamado, busy, error, onConfirm }: FinishedStepProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tip, setTip] = useState<number | "outro" | null>(null);
  const [otherTip, setOtherTip] = useState("");
  const priceChanged = chamado.valor_final !== chamado.estimativa;
  const gorjeta = tip === "outro" ? parseBRL(otherTip) || null : tip;

  const pill = (selected: boolean) =>
    selected
      ? "min-h-12 rounded-xl border border-brand bg-brand-soft text-[15px] font-semibold text-brand ring-1 ring-brand"
      : "min-h-12 rounded-xl border border-field bg-white text-[15px] font-semibold hover:bg-surface";

  return (
    <div className="relative flex flex-col items-center gap-4 text-center">
      <Confetes />
      <span className="flex size-16 items-center justify-center rounded-full bg-ok text-white motion-safe:animate-[chamado-entrada_300ms_ease-out]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" className="check-desenho" />
        </svg>
      </span>
      <div>
        <h2 className="font-display text-[22px] font-bold">Assistência finalizada</h2>
        <p className="mt-1.5 text-[15px] text-muted">
          {primeiroNome(chamado.mecanico?.nome ?? "O mecânico")} ajudou você a consertar sua bike!
        </p>
      </div>

      <dl className="self-stretch rounded-2xl border border-line px-4 text-left">
        {priceChanged && (
          <div className="flex justify-between border-b border-line py-3 text-[15px] text-muted">
            <dt>Preço estimado</dt>
            <dd>{formatBRL(chamado.estimativa ?? 0)}</dd>
          </div>
        )}
        <div className="flex justify-between py-3 font-bold">
          <dt>Valor final</dt>
          <dd>{formatBRL(chamado.valor_final ?? 0)}</dd>
        </div>
        {priceChanged && chamado.motivo_variacao && (
          <p className="mb-3 rounded-lg bg-warn-soft px-3 py-2.5 text-sm leading-snug text-warn">
            Motivo informado pelo mecânico: {chamado.motivo_variacao}
          </p>
        )}
      </dl>

      <div className="flex gap-1" role="group" aria-label="Avaliação">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
            aria-pressed={value <= rating}
            className="flex size-11 items-center justify-center"
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill={value <= rating ? "var(--color-star)" : "none"} stroke="var(--color-star)" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>

      <label htmlFor="comment" className="self-stretch text-left text-sm font-semibold">
        Deixe um comentário <span className="font-normal text-subtle">(opcional)</span>
      </label>
      <textarea
        id="comment"
        rows={2}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        className="-mt-2.5 self-stretch resize-none rounded-xl border border-field p-3 text-[15px]"
      />

      <p className="self-stretch text-left text-sm font-semibold">
        Gorjeta <span className="font-normal text-subtle">(opcional, paga diretamente ao mecânico)</span>
      </p>
      <div className="-mt-1.5 grid grid-cols-4 gap-2 self-stretch">
        {TIPS.map((value) => (
          <button key={value} type="button" aria-pressed={tip === value} onClick={() => setTip(tip === value ? null : value)} className={pill(tip === value)}>
            R$ {value}
          </button>
        ))}
        <button type="button" aria-pressed={tip === "outro"} onClick={() => setTip(tip === "outro" ? null : "outro")} className={pill(tip === "outro")}>
          Outro
        </button>
      </div>
      {tip === "outro" && (
        <div className="flex flex-col gap-1.5 self-stretch text-left">
          <label htmlFor="other-tip" className="text-sm font-semibold">Valor da gorjeta (R$)</label>
          <input
            id="other-tip"
            inputMode="decimal"
            placeholder="Ex.: 15,00"
            value={otherTip}
            onChange={(event) => setOtherTip(event.target.value)}
            className="h-12 rounded-xl border border-field px-3 text-[15px]"
          />
        </div>
      )}

      {error && (
        <p role="alert" className="self-stretch rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={rating === 0 || busy}
        onClick={() => onConfirm({ nota: rating, comentario: comment, gorjeta })}
        className="h-14 self-stretch rounded-xl bg-brand text-base font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-[#a9bcd8]"
      >
        {busy ? "Enviando…" : "Enviar avaliação"}
      </button>
    </div>
  );
}
