import { Suspense } from "react";
import { AreaLogada, AreaLogadaCarregando } from "@/components/AreaLogada";

export default function MechanicLayout({ children }: LayoutProps<"/mecanico">) {
  return (
    <Suspense fallback={<AreaLogadaCarregando />}>
      <AreaLogada
        tipo="mecanico"
        links={[
          { href: "/mecanico", label: "Chamados", exato: true },
          { href: "/mecanico/historico", label: "Histórico" },
          { href: "/mecanico/perfil", label: "Meu perfil" },
        ]}
      >
        {children}
      </AreaLogada>
    </Suspense>
  );
}
