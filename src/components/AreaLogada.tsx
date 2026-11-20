import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { perfilAtual } from "@/lib/auth";
import { iniciais } from "@/lib/pessoas";
import type { Enum } from "@/lib/supabase/database.types";
import { AppHeader } from "./AppHeader";
import type { LinkDeNavegacao } from "./NavPrincipal";
import { Logo } from "./Logo";
import { PerfilProvider } from "./PerfilProvider";
import { FavoritosProvider } from "./FavoritosProvider";
import { Toaster } from "./ui/Toaster";

type AreaLogadaProps = {
  tipo: Enum<"tipo_perfil">;
  links: LinkDeNavegacao[];
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
      {!perfil.telefone && (
        <div role="status" className="border-b border-warn/20 bg-warn-soft">
          <p className="mx-auto max-w-7xl px-4 py-2.5 text-sm text-warn">
            <strong>Complete seu perfil:</strong> adicione seu WhatsApp para{" "}
            {tipo === "mecanico" ? "os ciclistas" : "o mecânico"} conseguir falar com você.{" "}
            <Link href={`/${tipo}/perfil`} className="font-semibold underline underline-offset-2">
              Completar agora
            </Link>
          </p>
        </div>
      )}
      <PerfilProvider perfil={perfil}>
        <Toaster><FavoritosProvider>{children}</FavoritosProvider></Toaster>
      </PerfilProvider>
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
