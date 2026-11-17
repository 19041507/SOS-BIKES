import type { Metadata } from "next";
import { MechanicPanel } from "./_components/MechanicPanel";

export const metadata: Metadata = {
  title: "Área do mecânico · SOS Bikes",
};

export default function MechanicPage() {
  return <MechanicPanel />;
}
