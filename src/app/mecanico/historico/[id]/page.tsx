import { Suspense } from "react";
import type { Metadata } from "next";
import { CarregarDetalhe } from "@/components/historico/CarregarDetalhe";

export const metadata: Metadata = {
  title: "Atendimento · SOS Bikes",
};

export default function AtendimentoPage({ params }: PageProps<"/mecanico/historico/[id]">) {
  return (
    <Suspense>
      <CarregarDetalhe params={params} visao="mecanico" voltarPara={{ href: "/mecanico/historico", rotulo: "Histórico" }} />
    </Suspense>
  );
}
