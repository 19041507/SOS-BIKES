import { Suspense } from "react";
import { AreaLogada, AreaLogadaCarregando } from "@/components/AreaLogada";

export default function CyclistLayout({ children }: LayoutProps<"/ciclista">) {
  return (
    <Suspense fallback={<AreaLogadaCarregando />}>
      <AreaLogada
        tipo="ciclista"
        links={[
          { href: "/ciclista", label: "Pedir socorro", active: true },
          { href: "/ciclista", label: "Meus chamados" },
        ]}
      >
        {children}
      </AreaLogada>
    </Suspense>
  );
}
