import { formatBRL } from "@/lib/money";

type CloseJobProps = {
  estimate: number;
  finalPrice: string;
  reason: string;
  priceChanged: boolean;
  canFinish: boolean;
  busy: boolean;
  onFinalPriceChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onFinish: () => void;
};

export function CloseJob({
  estimate,
  finalPrice,
  reason,
  priceChanged,
  canFinish,
  busy,
  onFinalPriceChange,
  onReasonChange,
  onFinish,
}: CloseJobProps) {
  return (
    <div className="flex w-full max-w-[520px] flex-col gap-4">
      <div>
        <p className="text-[13px] font-semibold text-subtle">Concluir atendimento</p>
        <h2 className="mt-0.5 font-display text-[22px] font-bold">Registre o valor final</h2>
      </div>
      <p className="text-[15px] text-muted">
        Estimativa enviada à ciclista: <strong className="text-ink">{formatBRL(estimate)}</strong>
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="final-price" className="text-sm font-semibold">Valor final do serviço (R$)</label>
        <input
          id="final-price"
          inputMode="decimal"
          value={finalPrice}
          onChange={(event) => onFinalPriceChange(event.target.value)}
          className="h-12 rounded-xl border border-field px-3 text-[17px] font-semibold"
        />
      </div>
      {priceChanged && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reason" className="text-sm font-semibold">Motivo da variação</label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Ex.: foi preciso trocar a câmara de ar."
            className="resize-none rounded-xl border border-field p-3 text-[15px]"
          />
          <p className="text-[13px] text-subtle">A ciclista verá o valor final e o motivo informado.</p>
        </div>
      )}
      <button
        type="button"
        disabled={!canFinish || busy}
        onClick={onFinish}
        className="h-14 rounded-xl bg-ok text-base font-semibold text-white hover:bg-ok-dark disabled:cursor-not-allowed disabled:bg-[#a9bcd8]"
      >
        {busy ? "Concluindo…" : "Concluir atendimento"}
      </button>
    </div>
  );
}
