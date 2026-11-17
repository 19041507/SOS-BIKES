import { useState } from "react";
import type { Mechanic } from "@/data/mechanics";
import { formatBRL } from "@/lib/money";

const TIPS = ["R$ 5", "R$ 10", "R$ 20", "Outro"];

type FinishedStepProps = {
  mechanic: Mechanic;
  onConfirm: () => void;
};

export function FinishedStep({ mechanic, onConfirm }: FinishedStepProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tip, setTip] = useState<string | null>(null);
  const priceChanged = mechanic.finalPrice !== mechanic.estimate;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-ok text-white">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <div>
        <h2 className="font-display text-[22px] font-bold">Assistência finalizada</h2>
        <p className="mt-1.5 text-[15px] text-muted">
          {mechanic.name.split(" ")[0]} ajudou você a consertar sua bike!
        </p>
      </div>

      <dl className="self-stretch rounded-2xl border border-line px-4 text-left">
        {priceChanged && (
          <div className="flex justify-between border-b border-line py-3 text-[15px] text-muted">
            <dt>Preço estimado</dt>
            <dd>{formatBRL(mechanic.estimate)}</dd>
          </div>
        )}
        <div className="flex justify-between py-3 font-bold">
          <dt>Valor final</dt>
          <dd>{formatBRL(mechanic.finalPrice)}</dd>
        </div>
        {priceChanged && (
          <p className="mb-3 rounded-lg bg-warn-soft px-3 py-2.5 text-sm leading-snug text-warn">
            Motivo informado pelo mecânico: {mechanic.priceChangeReason}
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
        Deixe um comentário
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
        {TIPS.map((label) => {
          const isSelected = tip === label;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setTip(isSelected ? null : label)}
              className={
                isSelected
                  ? "min-h-12 rounded-xl border border-brand bg-brand-soft text-[15px] font-semibold text-brand ring-1 ring-brand"
                  : "min-h-12 rounded-xl border border-field bg-white text-[15px] font-semibold hover:bg-surface"
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={rating === 0}
        onClick={onConfirm}
        className="h-14 self-stretch rounded-xl bg-brand text-base font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-[#a9bcd8]"
      >
        Confirmar
      </button>
    </div>
  );
}
