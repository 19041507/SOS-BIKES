import { Logo } from "@/components/Logo";

// Coordenadas em % da área do mapa. A rota segue as ruas desenhadas abaixo,
// e o percurso do marcador em globals.css (mechanic-move) usa os mesmos pontos.
const ROUTE = "78,18 60,18 60,70 30,70";

const HORIZONTAL_STREETS = [
  { top: "18%", size: "h-4" },
  { top: "44%", size: "h-2" },
  { top: "70%", size: "h-5" },
];

const VERTICAL_STREETS = [
  { left: "12%", size: "w-2" },
  { left: "36%", size: "w-2" },
  { left: "60%", size: "w-4" },
  { left: "86%", size: "w-2" },
];

export function BrandPanel() {
  return (
    <aside className="brand-panel order-first flex flex-col bg-brand text-white lg:order-last">
      <div
        className="brand-map relative flex-1 overflow-hidden lg:basis-[52dvh] lg:min-h-[clamp(240px,48dvh,420px)]"
        style={{ maskImage: "linear-gradient(to bottom, black 78%, transparent)" }}
        aria-hidden="true"
      >
        {HORIZONTAL_STREETS.map((street) => (
          <div
            key={street.top}
            style={{ top: street.top }}
            className={`absolute inset-x-0 -translate-y-1/2 bg-white/10 ${street.size}`}
          />
        ))}
        {VERTICAL_STREETS.map((street) => (
          <div
            key={street.left}
            style={{ left: street.left }}
            className={`absolute inset-y-0 -translate-x-1/2 bg-white/10 ${street.size}`}
          />
        ))}
        <div className="absolute top-[52%] left-[66%] h-[12%] w-[16%] rounded-3xl bg-[#5fd08f]/15" />

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
        >
          <polyline
            points={ROUTE}
            fill="none"
            stroke="#5fd08f"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 12"
            vectorEffect="non-scaling-stroke"
            className="route-animated"
          />
        </svg>

        <span className="pulse-ring absolute top-[70%] left-[30%] size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />
        <span className="absolute top-[70%] left-[30%] flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white">
          <span className="size-3.5 rounded-full bg-brand" />
        </span>

        <span className="mechanic-move absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-ok text-sm font-bold shadow-lg">
          LF
        </span>

        <div className="absolute top-6 left-6 rounded-xl bg-white px-4 py-2.5 shadow-lg lg:top-10 lg:left-10 xl:left-14">
          <Logo />
        </div>

        <div className="brand-call absolute top-[28%] left-[6%] hidden w-[min(15rem,46%)] rounded-2xl bg-white p-4 text-ink shadow-xl lg:block">
          <p className="text-xs font-semibold text-warn">Novo chamado</p>
          <p className="mt-1 font-semibold">Pneu furado</p>
          <p className="text-sm text-subtle">R. da Aurora · a 800 m</p>
        </div>

        <div className="brand-arrival absolute top-[55%] right-[5%] flex w-48 items-center gap-2 rounded-2xl bg-white p-3 text-ink shadow-xl lg:top-[38%] lg:w-60 lg:gap-3 lg:p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ok text-xs font-bold text-white lg:size-10 lg:text-sm">
            LF
          </span>
          <div>
            <p className="text-xs font-semibold lg:text-sm">Lucas está a caminho</p>
            <p className="text-[11px] text-subtle lg:text-[13px]">Chega em 6 min · ★ 4,9</p>
          </div>
        </div>
      </div>

      <div className="brand-copy hidden shrink-0 px-10 pt-2 pb-12 lg:block xl:px-14 xl:pb-14">
        <h2 className="max-w-md font-display text-4xl leading-tight font-bold xl:text-5xl">
          Socorro sobre duas rodas.
        </h2>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-white/90">
          Pane no caminho? Informe o defeito, compartilhe sua localização e escolha um
          mecânico próximo.
        </p>
        <div className="brand-stat mt-8 flex max-w-md items-center gap-4 border-t border-white/20 pt-6">
          <span className="font-display text-5xl font-bold">82%</span>
          <p className="text-sm leading-snug text-white/90">
            dos ciclistas da região usam a bicicleta para ir ao trabalho.
            <span className="mt-1 block text-xs text-white/75">
              Ameciclo / Transporte Ativo, 2015–2024
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}
