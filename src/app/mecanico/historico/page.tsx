import type { Metadata } from "next";
import { HistoricoDoMecanico } from "./_components/HistoricoDoMecanico";

export const metadata: Metadata = {
  title: "Histórico · SOS Bikes",
};

export default function HistoricoPage() {
  return <HistoricoDoMecanico />;
}
