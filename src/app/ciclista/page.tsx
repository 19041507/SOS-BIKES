import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { CyclistFlow } from "./_components/CyclistFlow";

export const metadata: Metadata = {
  title: "Pedir socorro · SOS Bikes",
};

export default function CyclistPage() {
  return (
    <>
      <AppHeader
        links={[
          { href: "/ciclista", label: "Pedir socorro", active: true },
          { href: "/ciclista", label: "Meus chamados" },
        ]}
        user={{ initials: "AN", name: "Ana" }}
      />
      <CyclistFlow />
    </>
  );
}
