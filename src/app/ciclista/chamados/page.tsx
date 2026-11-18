import type { Metadata } from "next";
import { ListaDeChamados } from "./_components/ListaDeChamados";

export const metadata: Metadata = {
  title: "Meus chamados · SOS Bikes",
};

export default function MeusChamadosPage() {
  return <ListaDeChamados />;
}
