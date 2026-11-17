type AvailabilityCardProps = {
  online: boolean;
  onToggle: () => void;
};

export function AvailabilityCard({ online, onToggle }: AvailabilityCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
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
        onClick={onToggle}
        className={`flex h-8 w-14 shrink-0 rounded-full p-[3px] transition-colors ${online ? "justify-end bg-ok" : "justify-start bg-slate-400"}`}
      >
        <span className="block size-[26px] rounded-full bg-white" />
      </button>
    </div>
  );
}
