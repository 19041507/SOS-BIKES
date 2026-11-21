import type { Metadata } from "next";
import { FormularioDePerfil } from "@/components/perfil/FormularioDePerfil";
import { InstalarApp } from "@/components/InstalarApp";

export const metadata: Metadata = {
  title: "Meu perfil · SOS Bikes",
};

export default function PerfilPage() {
  return (
    <>
      <FormularioDePerfil />
      <div className="mx-auto w-full max-w-2xl px-3 pb-4 sm:px-4">
        <InstalarApp />
      </div>
    </>
  );
}
