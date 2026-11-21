import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { BrandPanel } from "../_components/BrandPanel";
import { FormularioDeRecuperacao } from "./_components/FormularioDeRecuperacao";

export const metadata: Metadata = {
  title: "Recuperar senha · SOS Bikes",
};

export default function RecuperarSenhaPage() {
  return (
    <main className="grid min-h-dvh flex-1 grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
      <section className="auth-form-panel flex flex-col justify-center bg-white px-6 py-8 sm:px-12 lg:py-12">
        <div className="auth-form-content mx-auto flex w-full max-w-sm flex-col gap-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Recuperar senha</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Informe o e-mail da sua conta. Enviaremos um link para você criar uma senha nova.
            </p>
          </div>
          <Suspense fallback={null}>
            <FormularioDeRecuperacao />
          </Suspense>
          <p className="text-center text-[15px] text-muted">
            Lembrou a senha?{" "}
            <Link href="/" className="font-semibold text-brand hover:text-brand-dark">
              Entrar
            </Link>
          </p>
        </div>
      </section>
      <BrandPanel />
    </main>
  );
}
