import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AvisoConfirmacao } from "./_components/AvisoConfirmacao";
import { BrandPanel } from "./_components/BrandPanel";
import { LoginForm } from "./_components/LoginForm";
import { RedirecionarSeLogado } from "./_components/RedirecionarSeLogado";
import { LegalLinks } from "@/components/LegalLinks";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-2">
      <Suspense fallback={null}>
        <RedirecionarSeLogado />
      </Suspense>
      <section className="flex flex-col justify-center bg-white px-6 py-12 sm:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Entrar</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Acesse sua conta para pedir socorro ou atender chamados.
            </p>
          </div>
          <Suspense fallback={null}>
            <AvisoConfirmacao />
          </Suspense>
          <LoginForm />
          <div className="flex flex-col gap-2"><p className="text-center text-[15px] text-muted">
            Não tem conta?{" "}
            <Link href="/cadastro" className="font-semibold text-brand hover:text-brand-dark">
              Cadastre-se
            </Link>
          </p><LegalLinks /></div>
        </div>
      </section>
      <BrandPanel />
    </main>
  );
}
