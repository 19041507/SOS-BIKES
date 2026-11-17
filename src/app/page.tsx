import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { perfilAtual } from "@/lib/auth";
import { BrandPanel } from "./_components/BrandPanel";
import { LoginForm } from "./_components/LoginForm";

// Lê a sessão, então fica num <Suspense> separado: o resto do login continua estático.
async function RedirecionarSeLogado() {
  const perfil = await perfilAtual();
  if (perfil) redirect(`/${perfil.tipo}`);
  return null;
}

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
          <LoginForm />
        </div>
      </section>
      <BrandPanel />
    </main>
  );
}
