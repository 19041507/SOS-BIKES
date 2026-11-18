import { Suspense } from "react";
import { AreaLogada, AreaLogadaCarregando } from "@/components/AreaLogada";

export default function MechanicLayout({ children }: LayoutProps<"/mecanico">) {
  return (
    <Suspense fallback={<AreaLogadaCarregando />}>
      <AreaLogada
        tipo="mecanico"
        links={[
          { href: "/mecanico", label: "Chamados", active: true },
          { href: "/mecanico", label: "Histórico" },
        ]}
      >
        {children}
      </AreaLogada>
    </Suspense>
  );
}
