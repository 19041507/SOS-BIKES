"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "./ui/Button";
import { Card } from "./ui/Card";

/** Conteúdo das páginas de erro (error.tsx) das áreas logadas. */
/** `retry` busca os dados de novo e renderiza a área outra vez (Next 16). */
export function ErroDaArea({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center p-4">
      <Card className="flex w-full flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-warn-soft text-warn" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">Algo deu errado</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Não conseguimos carregar esta tela. Verifique sua conexão e tente de novo.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 sm:flex-row">
          <Button onClick={() => retry()} fullWidth>
            Tentar de novo
          </Button>
          <ButtonLink href="/" variant="secondary" fullWidth>
            Voltar ao início
          </ButtonLink>
        </div>
      </Card>
    </main>
  );
}
