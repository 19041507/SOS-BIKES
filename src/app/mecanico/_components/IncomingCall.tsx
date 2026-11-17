import { MapView } from "@/components/MapView";
import { incomingRequest } from "@/data/requests";

type IncomingCallProps = {
  estimate: string;
  eta: string;
  onEstimateChange: (value: string) => void;
  onEtaChange: (value: string) => void;
  onDecline: () => void;
  onAccept: () => void;
};

export function IncomingCall({ estimate, eta, onEstimateChange, onEtaChange, onDecline, onAccept }: IncomingCallProps) {
  const canAccept = estimate.trim() !== "" && eta.trim() !== "";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13px] font-semibold text-warn">Novo chamado</p>
          <h2 className="mt-0.5 font-display text-[22px] font-bold">{incomingRequest.customer} escolheu você</h2>
        </div>
        <span className="rounded-full bg-warn-soft px-3 py-1.5 text-[13px] font-semibold text-warn">
          a {incomingRequest.distance} de você
        </span>
      </div>

      <div className="flex flex-wrap gap-4">
        <MapView className="min-h-[170px] flex-[1_1_220px]" pins={[]} chip={incomingRequest.address} />
        <div className="flex flex-[2_1_260px] flex-col gap-2">
          <p className="text-[13px] text-subtle">Problema</p>
          <p className="text-xl font-bold">{incomingRequest.category}</p>
          <p className="mt-1 text-[15px] text-slate-700">{incomingRequest.address}</p>
          <p className="rounded-lg bg-slate-100 p-2.5 text-sm leading-snug text-slate-700">
            “{incomingRequest.details}”
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="estimate" className="text-sm font-semibold">Preço estimado (R$)</label>
          <input
            id="estimate"
            inputMode="decimal"
            value={estimate}
            onChange={(event) => onEstimateChange(event.target.value)}
            className="h-12 rounded-xl border border-field px-3 text-[17px] font-semibold"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="eta" className="text-sm font-semibold">Tempo até chegar (min)</label>
          <input
            id="eta"
            inputMode="numeric"
            value={eta}
            onChange={(event) => onEtaChange(event.target.value)}
            className="h-12 rounded-xl border border-field px-3 text-[17px] font-semibold"
          />
        </div>
      </div>
      <p className="text-sm text-muted">
        A ciclista é avisada de que o valor final pode variar conforme o serviço realizado.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onDecline}
          className="h-14 rounded-xl border border-field bg-white text-base font-semibold hover:bg-surface"
        >
          Recusar
        </button>
        <button
          type="button"
          disabled={!canAccept}
          onClick={onAccept}
          className="h-14 rounded-xl bg-ok text-base font-semibold text-white hover:bg-ok-dark disabled:cursor-not-allowed disabled:bg-[#a9bcd8]"
        >
          Aceitar e enviar
        </button>
      </div>
    </div>
  );
}
