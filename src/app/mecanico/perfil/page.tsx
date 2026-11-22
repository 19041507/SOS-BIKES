import type { Metadata } from "next";
import { FormularioDePerfil } from "@/components/perfil/FormularioDePerfil";
import { FotosDoPerfil } from "@/components/perfil/FotosDoPerfil";
import { InstalarApp } from "@/components/InstalarApp";

export const metadata: Metadata = {
  title: "Meu perfil · SOS Bikes",
};

export default function PerfilPage() {
  return (
    <>
      <FormularioDePerfil />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-3 pb-4 sm:px-4">
        <FotosDoPerfil />
        <InstalarApp />
      </div>
    </>
  );
}
