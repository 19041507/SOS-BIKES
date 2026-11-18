type Pin = { id: string; initials: string; x: number; y: number };

type MapViewProps = {
  pins: Pin[];
  chip: string;
  routeTo?: { x: number; y: number };
  className?: string;
};

/** Onde o ciclista aparece no mapa ilustrativo, em %. */
export const POSICAO_DO_CICLISTA = { x: 45, y: 55 };
const USER = POSICAO_DO_CICLISTA;

// Mapa ilustrativo: o projeto é acadêmico e não usa um serviço de mapas real.
export function MapView({ pins, chip, routeTo, className = "" }: MapViewProps) {
  const route = routeTo
    ? `M${USER.x} ${USER.y} Q ${(USER.x + routeTo.x) / 2 + 8} ${(USER.y + routeTo.y) / 2} ${routeTo.x} ${routeTo.y}`
    : null;

  return (
    <section
      aria-label="Mapa"
      className={`relative overflow-hidden rounded-2xl border border-line bg-map ${className}`}
    >
      <div className="absolute top-[30%] -left-[10%] h-[22px] w-[120%] -rotate-[10deg] bg-white" />
      <div className="absolute -top-[10%] left-[40%] h-[120%] w-5 rotate-[14deg] bg-white" />
      <div className="absolute top-[68%] -left-[10%] h-3.5 w-[120%] rotate-6 bg-white" />
      <div className="absolute -top-[10%] left-[16%] h-[120%] w-3 -rotate-[22deg] bg-white" />
      <div className="absolute -top-[10%] left-[78%] h-[120%] w-3.5 rotate-[8deg] bg-white" />
      <div className="absolute top-[40%] left-[58%] h-[18%] w-[18%] rounded-[40px] bg-park" />
      <div className="absolute top-[76%] left-[6%] h-[16%] w-[16%] rounded-[30px] bg-park" />

      {route && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          aria-hidden="true"
        >
          <path
            d={route}
            fill="none"
            stroke="var(--color-ok)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="2 10"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {pins.map((pin) => (
        <span
          key={pin.id}
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          className="absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-ok text-[13px] font-bold text-white shadow-md transition-[left,top] duration-1000 ease-linear motion-reduce:transition-none"
        >
          {pin.initials}
        </span>
      ))}

      <span
        style={{ left: `${USER.x}%`, top: `${USER.y}%` }}
        className="absolute size-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-brand shadow-[0_0_0_10px_rgba(29,95,191,0.18)]"
      />

      <span className="absolute top-4 left-4 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-md">
        {chip}
      </span>
    </section>
  );
}

/**
 * Posição ilustrativa e estável para um pin, a partir do id da pessoa.
 * Provisória até o mapa real (#22): evita o centro, onde fica o ciclista.
 */
export function posicaoNoMapa(id: string) {
  let hash = 0;
  for (const letra of id) hash = (hash * 31 + letra.charCodeAt(0)) >>> 0;
  const x = 12 + (hash % 76);
  const y = 12 + (Math.floor(hash / 76) % 76);
  const pertoDoCentro = Math.abs(x - USER.x) < 14 && Math.abs(y - USER.y) < 14;
  return pertoDoCentro ? { x: (x + 40) % 76 + 12, y } : { x, y };
}
