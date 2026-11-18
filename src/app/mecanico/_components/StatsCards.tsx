import { ValorAnimado } from "@/components/ui/ValorAnimado";

type StatsCardsProps = {
  jobsToday: number;
  rating: number | null;
  earnedToday: number;
};

export function StatsCards({ jobsToday, rating, earnedToday }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="col-span-2 rounded-xl border border-line bg-white p-4">
        <p className="text-[13px] text-subtle">Ganhos hoje</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">
          <ValorAnimado valor={earnedToday} />
        </p>
        <p className="mt-0.5 text-xs text-subtle">já descontada a comissão de 10%</p>
      </div>
      <div className="rounded-xl border border-line bg-white p-4">
        <p className="text-[13px] text-subtle">Atendimentos hoje</p>
        <p className="mt-1 text-xl font-bold tabular-nums">{jobsToday}</p>
      </div>
      <div className="rounded-xl border border-line bg-white p-4">
        <p className="text-[13px] text-subtle">Avaliação</p>
        <p className="mt-1 text-xl font-bold tabular-nums">
          {rating === null ? (
            "—"
          ) : (
            <>
              <span className="text-star" aria-hidden="true">★</span> {rating.toFixed(1).replace(".", ",")}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
