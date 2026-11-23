import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { conterTabNoDialogo } from "@/lib/foco";

type AtivarLocalizacaoProps = {
  onAtivar: () => Promise<void>;
  onAgoraNao: () => void;
};

const VANTAGENS = [
  { titulo: "Mecânicos mais perto primeiro", texto: "A lista já vem ordenada pela distância até você." },
  { titulo: "Endereço preenchido sozinho", texto: "Você só confere a rua e o número na hora do pedido." },
  { titulo: "Sem rastreamento", texto: "Lemos a posição enquanto você usa o app, nunca em segundo plano." },
];

/**
 * Pop-up da primeira vez depois do login: explica a localização antes do pedido de
 * permissão do navegador, para a pessoa saber por que está sendo perguntada.
 */
export function AtivarLocalizacao({ onAtivar, onAgoraNao }: AtivarLocalizacaoProps) {
  const [ativando, setAtivando] = useState(false);
  const principal = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLElement>(null);

  useEffect(() => {
    principal.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !ativando) onAgoraNao();
        conterTabNoDialogo(event, dialogo.current);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ativar-localizacao-titulo"
        ref={dialogo}
        tabIndex={-1}
        className="max-h-[100dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl motion-safe:animate-[toast-entrada_250ms_ease-out]"
      >
        <div className="relative h-40 overflow-hidden rounded-t-3xl bg-brand" aria-hidden="true">
          <div className="absolute inset-x-0 top-[30%] h-3 bg-white/10" />
          <div className="absolute inset-x-0 top-[72%] h-2 bg-white/10" />
          <div className="absolute inset-y-0 left-[22%] w-2 bg-white/10" />
          <div className="absolute inset-y-0 left-[74%] w-3 bg-white/10" />
          <div className="absolute top-[40%] left-[8%] h-[22%] w-[10%] rounded-2xl bg-[#5fd08f]/20" />

          <span className="absolute top-[22%] left-[16%] flex size-8 items-center justify-center rounded-full border-2 border-white bg-ok text-[11px] font-bold text-white shadow-md">
            LF
          </span>
          <span className="absolute top-[64%] left-[80%] flex size-8 items-center justify-center rounded-full border-2 border-white bg-ok text-[11px] font-bold text-white shadow-md">
            MS
          </span>

          <span className="absolute top-1/2 left-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <span className="absolute inline-flex size-full rounded-full bg-white/25 motion-safe:animate-ping" />
            <span className="absolute inline-flex size-16 rounded-full bg-white/20" />
            <span className="relative flex size-12 items-center justify-center rounded-full bg-white text-brand shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-5 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div>
            <h2 id="ativar-localizacao-titulo" className="font-display text-[22px] leading-tight font-bold">
              Ative a localização para encontrar mecânicos perto de você
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Com ela, o socorro chega mais rápido e você não precisa digitar onde está.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {VANTAGENS.map((vantagem) => (
              <li key={vantagem.titulo} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <p className="text-sm leading-snug">
                  <strong className="font-semibold">{vantagem.titulo}</strong>
                  <span className="block text-subtle">{vantagem.texto}</span>
                </p>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2.5">
            <Button
              ref={principal}
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
          </div>

          <p className="text-center text-[13px] text-subtle">
            Você pode mudar isso nas configurações do navegador.{" "}
            <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">
              Privacidade
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
