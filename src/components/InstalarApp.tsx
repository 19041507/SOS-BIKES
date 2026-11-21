"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/** Evento do Chrome/Android que permite abrir o pedido de instalação por um botão. */
type PedidoDeInstalacao = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const INSTALADO = "(display-mode: standalone)";

function useAparelho() {
  return useSyncExternalStore(
    (avisar) => {
      const media = window.matchMedia(INSTALADO);
      media.addEventListener("change", avisar);
      return () => media.removeEventListener("change", avisar);
    },
    () => {
      if (window.matchMedia(INSTALADO).matches) return "instalado";
      // iPadOS se apresenta como Mac; o toque denuncia.
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && navigator.maxTouchPoints > 1);
      if (ios) return "ios";
      return /android/i.test(navigator.userAgent) ? "android" : "computador";
    },
    () => "instalado" as const,
  );
}

/** Card de "Meu perfil" para instalar o site como app; some dentro do app instalado. */
export function InstalarApp() {
  const aparelho = useAparelho();
  const [pedido, setPedido] = useState<PedidoDeInstalacao | null>(null);

  useEffect(() => {
    function guardar(evento: Event) {
      evento.preventDefault();
      setPedido(evento as PedidoDeInstalacao);
    }
    function instalado() {
      setPedido(null);
    }
    window.addEventListener("beforeinstallprompt", guardar);
    window.addEventListener("appinstalled", instalado);
    return () => {
      window.removeEventListener("beforeinstallprompt", guardar);
      window.removeEventListener("appinstalled", instalado);
    };
  }, []);

  if (aparelho === "instalado") return null;
  // No computador, só aparece se o navegador permitir instalar pelo botão.
  if (aparelho === "computador" && !pedido) return null;

  return (
    <Card className="flex items-start gap-4">
      <Image src="/icons/icon-192.png" alt="" width={56} height={56} className="shrink-0 rounded-2xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <h2 className="font-display text-lg font-bold">Instale o SOS Bikes no celular</h2>
          <p className="text-[15px] text-muted">Abra direto da tela inicial, em tela cheia, como um app.</p>
        </div>
        {pedido ? (
          <Button
            className="self-start"
            onClick={async () => {
              await pedido.prompt();
              await pedido.userChoice;
              setPedido(null);
            }}
          >
            Instalar app
          </Button>
        ) : aparelho === "ios" ? (
          <p className="text-sm leading-relaxed text-subtle">
            No Safari, toque em <strong className="text-ink">Compartilhar</strong> e depois em{" "}
            <strong className="text-ink">Adicionar à Tela de Início</strong>. No app instalado, entre de novo com seu e-mail e senha.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-subtle">
            No Chrome, abra o menu <strong className="text-ink">⋮</strong> e toque em <strong className="text-ink">Instalar app</strong>.
          </p>
        )}
      </div>
    </Card>
  );
}
