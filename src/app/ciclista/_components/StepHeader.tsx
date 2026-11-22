type StepHeaderProps = {
  eyebrow: string;
  title: string;
  onBack?: () => void;
};

export function StepHeader({ eyebrow, title, onBack }: StepHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white hover:bg-surface"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}
      <div>
        <p className="text-[13px] font-semibold text-subtle">{eyebrow}</p>
        <h1 className="mt-0.5 font-display text-[22px] font-bold">{title}</h1>
      </div>
    </div>
  );
}
