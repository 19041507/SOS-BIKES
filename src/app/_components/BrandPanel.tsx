import { Logo } from "@/components/Logo";

// Rota ilustrativa do mecânico (canto superior direito) até o ciclista.
const ROUTE = "M470 170 C 430 260, 300 250, 290 360 S 190 470, 210 560";

export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-brand text-white lg:flex lg:flex-col">
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 600 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g stroke="white" strokeOpacity="0.12" strokeLinecap="round" fill="none">
          <path d="M-40 230 L640 120" strokeWidth="26" />
          <path d="M-40 520 L640 600" strokeWidth="18" />
          <path d="M120 -40 L330 840" strokeWidth="20" />
          <path d="M520 -40 L430 840" strokeWidth="14" />
          <path d="M-40 380 L640 330" strokeWidth="10" />
          <path d="M40 -40 L-20 840" strokeWidth="10" />
        </g>
        <rect x="360" y="380" width="150" height="110" rx="40" fill="#178045" fillOpacity="0.35" />
        <rect x="40" y="610" width="130" height="90" rx="34" fill="#178045" fillOpacity="0.35" />
        <path d="M-40 760 C 120 700, 260 790, 640 690" stroke="#7fb9e6" strokeOpacity="0.35" strokeWidth="30" fill="none" />

        <path d={ROUTE} stroke="#5fd08f" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12" fill="none" className="route-animated" />

        <g>
          <circle r="22" fill="#178045" stroke="white" strokeWidth="4" />
          <text textAnchor="middle" dy="5" fontSize="14" fontWeight="700" fill="white">LF</text>
          <animateMotion dur="7s" repeatCount="indefinite" path={ROUTE} keyPoints="0;1;1" keyTimes="0;0.85;1" calcMode="linear" />
        </g>

        <circle cx="210" cy="560" r="34" fill="white" fillOpacity="0.15" className="pulse-ring" />
        <circle cx="210" cy="560" r="13" fill="white" />
        <circle cx="210" cy="560" r="7" fill="#1d5fbf" />
      </svg>

      <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
        <div className="w-fit rounded-xl bg-white px-4 py-2.5 shadow-lg">
          <Logo />
        </div>

        <div className="flex flex-col gap-3 self-end">
          <div className="w-64 rounded-2xl bg-white p-4 text-ink shadow-xl">
            <p className="text-xs font-semibold text-warn">Novo chamado</p>
            <p className="mt-1 font-semibold">Pneu furado</p>
            <p className="text-sm text-subtle">R. da Aurora · a 800 m</p>
          </div>
          <div className="flex w-64 items-center gap-3 rounded-2xl bg-white p-4 text-ink shadow-xl">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ok text-sm font-bold text-white">LF</span>
            <div>
              <p className="text-sm font-semibold">Lucas está a caminho</p>
              <p className="text-[13px] text-subtle">Chega em 6 min · ★ 4,9</p>
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="font-display text-4xl leading-tight font-bold xl:text-5xl">
            Socorro sobre duas rodas.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/90">
            Pane no caminho? Informe o defeito, compartilhe sua localização e escolha
            um mecânico próximo.
          </p>
          <div className="mt-8 flex items-center gap-4 border-t border-white/20 pt-6">
            <span className="font-display text-5xl font-bold">82%</span>
            <p className="text-sm leading-snug text-white/85">
              dos ciclistas da região usam a bicicleta para ir ao trabalho.
              <span className="mt-1 block text-xs text-white/65">Ameciclo / Transporte Ativo, 2015–2024</span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
