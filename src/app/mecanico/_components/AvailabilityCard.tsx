import { useState } from "react";
import { Button } from "@/components/ui/Button";

type AvailabilityCardProps = {
  online: boolean;
  busy: boolean;
  /** Há um chamado em andamento: pede confirmação antes de ficar indisponível */
  hasActiveCall: boolean;
  onToggle: () => void;
};

/** Faixa de status do topo do painel, com a chave de disponibilidade. */
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
    <div
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3.5 ${
        online ? "border-ok/30 bg-ok-soft" : "border-dashed border-field bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        {online && (
          <span className="relative flex size-3 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex size-full rounded-full bg-ok opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex size-3 rounded-full bg-ok" />
          </span>
        )}
        <p role="status" className="flex-1 text-[15px]">
          <strong className={online ? "text-ok-dark" : "text-ink"}>{online ? "Disponível" : "Indisponível"}</strong>
          <span className={online ? "text-ok-dark" : "text-muted"}>
            {online
              ? " · Os chamados aparecem aqui assim que um ciclista escolher você."
              : " · Ligue para aparecer na lista dos ciclistas."}
          </span>
        </p>
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
        <div role="alertdialog" aria-label="Ficar indisponível" className="flex flex-col gap-2.5 rounded-xl bg-warn-soft p-3 text-sm text-warn sm:flex-row sm:items-center">
          <p className="flex-1">Você tem um chamado em andamento. Ficar indisponível não cancela esse chamado, só impede que novos ciclistas escolham você.</p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
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
