import type { Metadata } from "next";
import { FormularioDePerfil } from "@/components/perfil/FormularioDePerfil";

export const metadata: Metadata = {
  title: "Meu perfil · SOS Bikes",
};

export default function PerfilPage() {
  return <FormularioDePerfil />;
}
