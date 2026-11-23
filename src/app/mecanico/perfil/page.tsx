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
      <div id="instalar-app" tabIndex={-1} className="mx-auto w-full max-w-4xl scroll-mt-4 px-3 pb-6 sm:px-6">
        <InstalarApp />
      </div>
    </>
  );
}
