type HomeStepProps = {
  notice: string | null;
  onStart: () => void;
};

export function HomeStep({ notice, onStart }: HomeStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-semibold text-ok">Socorro sobre duas rodas</p>
      <h1 className="font-display text-3xl leading-tight font-bold">
        Sua bike deu problema no caminho?
      </h1>
      <p className="text-base leading-relaxed text-muted">
        Informe o defeito e a sua localização. Mostramos os mecânicos mais próximos
        para você escolher quem vai atender.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="flex h-16 items-center justify-center gap-2.5 rounded-2xl bg-brand text-lg font-bold text-white hover:bg-brand-dark"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        Preciso de socorro
      </button>
      {notice && (
        <div role="status" className="rounded-xl bg-ok-soft px-4 py-3.5 text-[15px] font-medium text-ok-dark">
          {notice}
        </div>
      )}
    </div>
  );
}
