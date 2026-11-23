import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Página não encontrada · SOS Bikes",
};

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card
        aria-labelledby="not-found-title"
        className="w-full max-w-lg text-center"
      >
        <Link
          href="/"
          className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          aria-label="SOS Bikes — página inicial"
        >
          <Logo />
        </Link>

        <div
          className="mx-auto mt-8 flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand"
          aria-hidden="true"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 17 5-9 5 7 4-8 4 10" />
            <circle cx="3" cy="17" r="1" fill="currentColor" />
            <circle cx="21" cy="17" r="1" fill="currentColor" />
          </svg>
        </div>

        <p className="mt-5 font-display text-6xl leading-none font-extrabold text-brand">
          404
        </p>
        <h1
          id="not-found-title"
          className="mt-4 font-display text-2xl font-bold"
        >
          Não encontramos essa página
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Esse caminho não está no mapa. Confira o endereço ou volte para o início.
        </p>
        <ButtonLink href="/" className="mt-6">
          Voltar para o início
        </ButtonLink>
      </Card>
    </main>
  );
}
