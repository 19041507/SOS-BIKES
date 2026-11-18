import { useState } from "react";
import { Button } from "@/components/ui/Button";

type AvailabilityCardProps = {
  online: boolean;
  busy: boolean;
  /** Há um chamado em andamento: pede confirmação antes de ficar indisponível */
  hasActiveCall: boolean;
  onToggle: () => void;
};

export function AvailabilityCard({ online, busy, hasActiveCall, onToggle }: AvailabilityCardProps) {
  const [confirming, setConfirming] = useState(false);

  function toggle() {
    if (online && hasActiveCall) {
      setConfirming(true);
      return;
    }
    onToggle();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="font-semibold">{online ? "Disponível" : "Indisponível"}</p>
          <p className="mt-0.5 text-[13px] text-subtle">
            {online ? "Ciclistas próximos podem escolher você" : "Ative para receber chamados"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={online}
          aria-label="Disponível para chamados"
          disabled={busy || confirming}
          onClick={toggle}
          className={`flex h-8 w-14 shrink-0 rounded-full p-[3px] transition-colors disabled:cursor-wait disabled:opacity-60 ${online ? "justify-end bg-ok" : "justify-start bg-slate-400"}`}
        >
          <span className="block size-[26px] rounded-full bg-white" />
        </button>
      </div>
      {confirming && (
        <div role="alertdialog" aria-label="Ficar indisponível" className="flex flex-col gap-2.5 rounded-xl bg-warn-soft p-3 text-sm text-warn">
          <p>Você tem um chamado em andamento. Ficar indisponível não cancela esse chamado, só impede que novos ciclistas escolham você.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Continuar disponível
            </Button>
            <Button
              onClick={() => {
                setConfirming(false);
                onToggle();
              }}
            >
              Ficar indisponível
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
