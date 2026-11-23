"use client";

import { useRouter } from "next/navigation";

/** Volta para a tela de onde a pessoa veio (pedido em andamento, favoritos…); sem histórico, para o início da área. */
export function VoltarDoPerfil({ inicio }: { inicio: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(inicio))}
      className="flex min-h-11 w-fit items-center gap-2 rounded-lg px-1 text-sm font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
    >
      <span aria-hidden="true">←</span> Voltar
    </button>
  );
}
