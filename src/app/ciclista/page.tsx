import type { Metadata } from "next";
import { Suspense } from "react";
import { CyclistFlow } from "./_components/CyclistFlow";

export const metadata: Metadata = {
  title: "Pedir socorro · SOS Bikes",
};

async function Conteudo({ searchParams }: PageProps<"/ciclista">) {
  const { mecanico } = await searchParams;
  const id = typeof mecanico === "string" ? mecanico : undefined;
  return <CyclistFlow key={id ?? "inicio"} mecanicoFavoritoId={id} />;
}

export default function CyclistPage(props: PageProps<"/ciclista">) {
  return <Suspense fallback={<p className="p-4 text-subtle">Carregando…</p>}><Conteudo {...props} /></Suspense>;
}
