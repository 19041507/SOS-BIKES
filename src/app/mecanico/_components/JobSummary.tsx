import { PLATFORM_FEE } from "@/data/mechanics";
import { formatBRL } from "@/lib/money";

type JobSummaryProps = {
  estimate: number;
  finalPrice: number;
  onBack: () => void;
};

export function JobSummary({ estimate, finalPrice, onBack }: JobSummaryProps) {
  const fee = finalPrice * PLATFORM_FEE;
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4.5">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-ok text-white">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h2 className="font-display text-[22px] font-bold">Atendimento concluído</h2>
      </div>
      <dl className="rounded-2xl border border-line px-4">
        {finalPrice !== estimate && (
          <div className="flex justify-between border-b border-line py-3 text-[15px] text-muted">
            <dt>Estimativa</dt>
            <dd>{formatBRL(estimate)}</dd>
          </div>
        )}
        <div className="flex justify-between border-b border-line py-3 text-[15px]">
          <dt>Valor final do serviço</dt>
          <dd className="font-bold">{formatBRL(finalPrice)}</dd>
        </div>
        <div className="flex justify-between border-b border-line py-3 text-[15px] text-muted">
          <dt>Comissão SOS Bikes (10%)</dt>
          <dd>− {formatBRL(fee)}</dd>
        </div>
        <div className="flex justify-between py-3 font-bold text-ok-dark">
          <dt>Você recebe</dt>
          <dd>{formatBRL(finalPrice - fee)}</dd>
        </div>
      </dl>
      <p className="text-center text-sm text-muted">
        O pagamento e a gorjeta, se houver, são feitos diretamente pela ciclista.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="h-14 rounded-xl bg-brand text-base font-semibold text-white hover:bg-brand-dark"
      >
        Voltar aos chamados
      </button>
    </div>
  );
}
