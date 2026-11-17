import { MapView } from "@/components/MapView";
import { currentMechanic, incomingRequest } from "@/data/requests";
import { formatBRL } from "@/lib/money";

type ActiveJobProps = {
  /** 1 = a caminho, 2 = em atendimento */
  stage: 1 | 2;
  estimate: number;
  onNext: () => void;
};

export function ActiveJob({ stage, estimate, onNext }: ActiveJobProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[13px] font-semibold text-ok">Atendimento confirmado pela ciclista</p>
        <h2 className="mt-0.5 font-display text-[22px] font-bold">
          {stage === 1 ? "A caminho da ciclista" : "Em atendimento"}
        </h2>
      </div>
      <MapView
        className="min-h-[200px]"
        pins={[{ id: "me", initials: currentMechanic.initials, x: currentMechanic.x, y: currentMechanic.y }]}
        routeTo={stage === 1 ? currentMechanic : undefined}
        chip={stage === 1 ? `${incomingRequest.customer} está a ${incomingRequest.distance}` : "Você está no local"}
      />
      <p className="text-[15px] text-slate-700">
        {incomingRequest.customer} · {incomingRequest.category} · estimativa {formatBRL(estimate)}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <a
          href="https://wa.me/"
          target="_blank"
          rel="noreferrer"
          className="flex h-12 items-center justify-center rounded-xl border border-field text-[15px] font-semibold hover:bg-surface"
        >
          Enviar mensagem
        </a>
        <a
          href="tel:"
          className="flex h-12 items-center justify-center rounded-xl border border-field text-[15px] font-semibold hover:bg-surface"
        >
          Ligar
        </a>
      </div>
      <button
        type="button"
        onClick={onNext}
        className="h-14 rounded-xl bg-brand text-base font-semibold text-white hover:bg-brand-dark"
      >
        {stage === 1 ? "Cheguei ao local" : "Concluir atendimento"}
      </button>
    </div>
  );
}
