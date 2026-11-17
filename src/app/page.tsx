import Link from "next/link";
import { Logo } from "@/components/Logo";

const profiles = [
  {
    href: "/ciclista",
    title: "Sou ciclista",
    description: "Peça socorro quando sua bike der problema no caminho.",
    className: "bg-brand hover:bg-brand-dark",
  },
  {
    href: "/mecanico",
    title: "Sou mecânico",
    description: "Receba chamados de ciclistas próximos e realize atendimentos.",
    className: "bg-ok hover:bg-ok-dark",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo />
        <h1 className="font-display text-4xl leading-tight font-bold sm:text-5xl">
          Socorro sobre duas rodas
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted">
          Ciclistas com pane mecânica encontram mecânicos próximos, com estimativa
          de preço e tempo de chegada.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {profiles.map((profile) => (
          <Link
            key={profile.href}
            href={profile.href}
            className={`flex flex-col gap-2 rounded-2xl p-6 text-white transition-colors ${profile.className}`}
          >
            <span className="font-display text-2xl font-bold">{profile.title}</span>
            <span className="text-[15px] leading-relaxed text-white/90">
              {profile.description}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
