import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { currentMechanic } from "@/data/requests";
import { MechanicPanel } from "./_components/MechanicPanel";

export const metadata: Metadata = {
  title: "Área do mecânico · SOS Bikes",
};

export default function MechanicPage() {
  return (
    <>
      <AppHeader
        badge="Mecânico"
        links={[
          { href: "/mecanico", label: "Chamados", active: true },
          { href: "/mecanico", label: "Histórico" },
        ]}
        user={{
          initials: currentMechanic.initials,
          name: `${currentMechanic.name.split(" ")[0]} · ${currentMechanic.workshop}`,
        }}
      />
      <MechanicPanel />
    </>
  );
}
