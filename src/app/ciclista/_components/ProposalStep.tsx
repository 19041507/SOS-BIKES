import type { Mechanic } from "@/data/mechanics";
import { formatBRL } from "@/lib/money";

type ProposalStepProps = {
  mechanic: Mechanic;
  onConfirm: () => void;
  onChooseAnother: () => void;
};

export function ProposalStep({ mechanic, onConfirm, onChooseAnother }: ProposalStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[13px] font-semibold text-ok">Chamado aceito</p>
        <h2 className="mt-0.5 font-display text-[22px] font-bold">
          {mechanic.name.split(" ")[0]} pode atender você
        </h2>
      </div>
      <dl className="rounded-2xl border border-line px-4">
        <div className="flex justify-between border-b border-line py-3 text-[15px]">
          <dt>Preço estimado</dt>
          <dd className="font-bold">{formatBRL(mechanic.estimate)}</dd>
        </div>
        <div className="flex justify-between py-3 text-[15px]">
          <dt>Tempo de chegada</dt>
          <dd className="font-bold">{mechanic.etaMinutes} min</dd>
        </div>
      </dl>
      <p className="rounded-xl bg-warn-soft px-3.5 py-3 text-sm leading-normal text-warn">
        O valor final pode variar conforme o serviço realizado. Se mudar, o mecânico
        informa o novo valor ao concluir o atendimento.
      </p>
      <p className="text-sm text-muted">O pagamento é feito diretamente ao mecânico.</p>
      <button
        type="button"
        onClick={onConfirm}
        className="h-14 rounded-xl bg-brand text-base font-semibold text-white hover:bg-brand-dark"
      >
        Confirmar atendimento
      </button>
      <button
        type="button"
        onClick={onChooseAnother}
        className="h-12 rounded-xl border border-field bg-white text-[15px] font-semibold hover:bg-surface"
      >
        Escolher outro mecânico
      </button>
    </div>
  );
}
