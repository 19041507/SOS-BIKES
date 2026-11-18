import { Suspense } from "react";
import { AreaLogada, AreaLogadaCarregando } from "@/components/AreaLogada";

export default function CyclistLayout({ children }: LayoutProps<"/ciclista">) {
  return (
    <Suspense fallback={<AreaLogadaCarregando />}>
      <AreaLogada
        tipo="ciclista"
        links={[
          { href: "/ciclista", label: "Pedir socorro", exato: true },
          { href: "/ciclista/chamados", label: "Meus chamados" },
          { href: "/ciclista/perfil", label: "Meu perfil" },
        ]}
      >
        {children}
      </AreaLogada>
    </Suspense>
  );
}
