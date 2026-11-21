import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type AtivarLocalizacaoProps = {
  onAtivar: () => Promise<void>;
  onAgoraNao: () => void;
};

/** Explica a localização antes do pedido de permissão do navegador, na primeira vez depois do login. */
export function AtivarLocalizacao({ onAtivar, onAgoraNao }: AtivarLocalizacaoProps) {
  const [ativando, setAtivando] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-5 p-5">
      <span className="flex size-16 items-center justify-center self-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </span>
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Ative a localização para encontrar mecânicos perto de você</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Usamos sua posição para mostrar os mecânicos mais próximos e preencher o endereço do pedido. Não acompanhamos seus deslocamentos.
        </p>
      </div>
      <Button
        size="lg"
        loading={ativando}
        loadingText="Ativando…"
        onClick={async () => {
          setAtivando(true);
          await onAtivar();
          setAtivando(false);
        }}
      >
        Ativar localização
      </Button>
      <Button variant="secondary" disabled={ativando} onClick={onAgoraNao}>
        Agora não
      </Button>
      <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center text-sm font-semibold text-brand underline">
        Política de privacidade
      </Link>
    </main>
  );
}
