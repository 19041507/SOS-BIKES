"use client";

import dynamic from "next/dynamic";
import type { Posicao } from "@/lib/localizacao";

export type PinDoMapa = Posicao & { id: string; initials: string };

export type MapaProps = {
  /** Ponto azul do ciclista. */
  ciclista?: Posicao | null;
  pins: PinDoMapa[];
  /** Linha tracejada do mecânico até o ciclista. */
  rota?: { de: Posicao; ate: Posicao };
  chip: string;
  /** Pontos que o mapa deve mostrar inteiros; sem nenhum, fica no centro padrão. */
  enquadrar: Posicao[];
  className?: string;
};

// O Leaflet usa `window`, então o mapa só carrega no navegador.
const MapaReal = dynamic(() => import("./MapaReal"), {
  ssr: false,
  loading: () => <div className="size-full rounded-2xl bg-map motion-safe:animate-pulse" />,
});

export function Mapa({ className = "", ...props }: MapaProps) {
  return (
    <div className={`flex ${className}`}>
      <MapaReal {...props} className="flex-1" />
    </div>
  );
}
