import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { iniciais, perfilAtual } from "@/lib/auth";
import type { Enum } from "@/lib/supabase/database.types";
import { AppHeader } from "./AppHeader";
import { Logo } from "./Logo";

type AreaLogadaProps = {
  tipo: Enum<"tipo_perfil">;
  links: { href: string; label: string; active?: boolean }[];
  children: ReactNode;
};

/**
 * Lê o perfil logado e só mostra a área para o tipo certo.
 * Lê cookies, então precisa ficar dentro de um <Suspense> (cacheComponents).
 */
export async function AreaLogada({ tipo, links, children }: AreaLogadaProps) {
  const perfil = await perfilAtual();
  if (!perfil) redirect("/");
  if (perfil.tipo !== tipo) redirect(`/${perfil.tipo}`);

  const primeiroNome = perfil.nome.split(" ")[0];
  const nome = tipo === "mecanico" ? `${primeiroNome} · ${perfil.oficina ?? "Mecânico autônomo"}` : primeiroNome;

  return (
    <>
      <AppHeader
        badge={tipo === "mecanico" ? "Mecânico" : undefined}
        links={links}
        user={{ initials: iniciais(perfil.nome), name: nome }}
      />
      {children}
    </>
  );
}

export function AreaLogadaCarregando() {
  return (
    <header className="border-b border-line bg-white" aria-busy="true">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-3">
        <Logo />
        <span className="ml-auto text-sm text-subtle">Carregando…</span>
      </div>
    </header>
  );
}
