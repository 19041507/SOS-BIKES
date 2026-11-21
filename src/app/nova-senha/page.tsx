import type { Metadata } from "next";
import { BrandPanel } from "../_components/BrandPanel";
import { FormularioDeNovaSenha } from "./_components/FormularioDeNovaSenha";

export const metadata: Metadata = {
  title: "Nova senha · SOS Bikes",
};

export default function NovaSenhaPage() {
  return (
    <main className="grid min-h-dvh flex-1 grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
      <section className="auth-form-panel flex flex-col justify-center bg-white px-6 py-8 sm:px-12 lg:py-12">
        <div className="auth-form-content mx-auto flex w-full max-w-sm flex-col gap-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Crie uma senha nova</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Depois de salvar, entre com a senha nova.
            </p>
          </div>
          <FormularioDeNovaSenha />
        </div>
      </section>
      <BrandPanel />
    </main>
  );
}
