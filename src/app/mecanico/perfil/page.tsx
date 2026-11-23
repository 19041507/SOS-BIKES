import type { Metadata } from "next";
import { Suspense } from "react";
import { PerfilCompleto } from "@/components/perfil/completo/PerfilCompleto";
import { InstalarApp } from "@/components/InstalarApp";

export const metadata: Metadata = {
  title: "Meu perfil · SOS Bikes",
};

export default function PerfilPage() {
  return (
    <>
      <Suspense fallback={<p className="p-6">Carregando perfil…</p>}><PerfilCompleto /></Suspense>
      <div id="instalar-app" tabIndex={-1} className="mx-auto w-full max-w-7xl scroll-mt-4 px-3 pb-6 sm:px-6">
        <InstalarApp />
      </div>
    </>
  );
}
