import { Suspense } from "react";
import type { Metadata } from "next";
import { CarregarDetalhe } from "@/components/historico/CarregarDetalhe";

export const metadata: Metadata = {
  title: "Chamado · SOS Bikes",
};

export default function ChamadoDoCiclistaPage({ params }: PageProps<"/ciclista/chamados/[id]">) {
  return (
    <Suspense>
      <CarregarDetalhe params={params} visao="ciclista" voltarPara={{ href: "/ciclista/chamados", rotulo: "Meus chamados" }} />
    </Suspense>
  );
}
