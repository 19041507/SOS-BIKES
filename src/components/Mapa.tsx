"use client";

import dynamic from "next/dynamic";
import type { Posicao } from "@/lib/localizacao";

export type PinDoMapa = Posicao & {
  id: string;
  initials: string;
  /** Texto ao clicar no pin (nome, distância). */
  rotulo?: string;
};

export type MapaProps = {
  /** Ponto azul do ciclista. */
  ciclista?: Posicao | null;
  pins: PinDoMapa[];
  /** Linha tracejada do mecânico até o ciclista. */
  rota?: { de: Posicao; ate: Posicao };
  chip: string;
  /** Pontos que o mapa deve mostrar inteiros; sem nenhum, fica no centro padrão. */
  enquadrar: Posicao[];
  /** Quando existe, o ponto do ciclista pode ser arrastado, e tocar no mapa move o ponto. */
  onMoverCiclista?: (posicao: Posicao) => void;
  className?: string;
};

// O Leaflet usa `window`, então o mapa só carrega no navegador.
const MapaReal = dynamic(() => import("./MapaReal"), {
  ssr: false,
  loading: () => <div className="size-full rounded-2xl bg-map motion-safe:animate-pulse" />,
});

function valida(p: Posicao | null | undefined): p is Posicao {
  return Number.isFinite(p?.lat) && Number.isFinite(p?.lng);
}

// Ponto sem coordenada (ex.: banco sem a migration de localização) é ignorado: o Leaflet quebra com ele.
export function Mapa({ className = "", ciclista, pins, rota, enquadrar, ...props }: MapaProps) {
  return (
    <div className={`flex ${className}`}>
      <MapaReal
        {...props}
        ciclista={valida(ciclista) ? ciclista : null}
        pins={pins.filter(valida)}
        rota={rota && valida(rota.de) && valida(rota.ate) ? rota : undefined}
        enquadrar={enquadrar.filter(valida)}
        className="flex-1"
      />
    </div>
  );
}
