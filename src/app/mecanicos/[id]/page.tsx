import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AreaLogada, AreaLogadaCarregando } from "@/components/AreaLogada";
import { PerfilPublicoMecanico } from "@/components/perfil/PerfilPublicoMecanico";
import { perfilAtual } from "@/lib/auth";
import { buscarPerfilPublicoDoMecanico } from "@/lib/perfil-publico-mecanico";

export const metadata: Metadata = {
  title: "Perfil do mecânico · SOS Bikes",
};

const ID_VALIDO = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
type ParametrosDaRota = { params: Promise<{ id: string }> };

async function ConteudoPerfil({ params }: ParametrosDaRota) {
  const [{ id }, perfilVisitante] = await Promise.all([params, perfilAtual()]);
  if (!perfilVisitante) redirect("/");
  if (!ID_VALIDO.test(id)) notFound();

  const mecanico = await buscarPerfilPublicoDoMecanico(id);
  if (!mecanico) notFound();

  const links = perfilVisitante.tipo === "mecanico"
    ? [
        { href: "/mecanico", label: "Painel", exato: true },
        { href: "/mecanico/historico", label: "Histórico" },
        { href: "/mecanico/perfil", label: "Meu perfil" },
      ]
    : [
        { href: "/ciclista", label: "Início", exato: true },
        { href: "/ciclista/chamados", label: "Meus chamados" },
        { href: "/ciclista/favoritos", label: "Favoritos" },
        { href: "/ciclista/perfil", label: "Meu perfil" },
      ];

  return (
    <AreaLogada tipo={perfilVisitante.tipo} links={links}>
      <PerfilPublicoMecanico mecanico={mecanico} podeSolicitar={perfilVisitante.tipo === "ciclista"} />
    </AreaLogada>
  );
}

export default function PaginaPerfilPublicoMecanico({ params }: ParametrosDaRota) {
  return (
    <Suspense fallback={<AreaLogadaCarregando />}>
      <ConteudoPerfil params={params} />
    </Suspense>
  );
}
