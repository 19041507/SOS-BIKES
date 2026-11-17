import { formatBRL } from "@/lib/money";

type StatsCardsProps = {
  jobsToday: number;
  rating: string;
  earnedToday: number;
};

export function StatsCards({ jobsToday, rating, earnedToday }: StatsCardsProps) {
  const stats = [
    { label: "Atendimentos hoje", value: String(jobsToday) },
    { label: "Avaliação", value: rating },
    { label: "Ganhos hoje", value: formatBRL(earnedToday) },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-line bg-white p-3.5">
          <p className="text-xs text-subtle">{stat.label}</p>
          <p className="mt-1 text-xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
