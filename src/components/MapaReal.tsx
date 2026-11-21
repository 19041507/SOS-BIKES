"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { divIcon, latLngBounds } from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { CENTRO_PADRAO, type Posicao } from "@/lib/localizacao";
import type { MapaProps } from "./Mapa";

const ICONE_DO_CICLISTA = divIcon({
  className: "",
  html: '<span class="block size-[26px] rounded-full border-4 border-white bg-brand shadow-[0_0_0_10px_rgba(29,95,191,0.18)]"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function iconeDoMecanico(iniciais: string) {
  return divIcon({
    className: "",
    html: `<span class="flex size-10 items-center justify-center rounded-full border-[3px] border-white bg-ok text-[13px] font-bold text-white shadow-md">${escapar(iniciais)}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

/** Enquadra os pontos quando eles mudam (não a cada passo do mecânico a caminho). */
function Enquadrar({ pontos }: { pontos: Posicao[] }) {
  const mapa = useMap();
  const chave = pontos.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join("|");

  useEffect(() => {
    if (pontos.length === 0) return;
    if (pontos.length === 1) mapa.setView(pontos[0], 15);
    else mapa.fitBounds(latLngBounds(pontos), { padding: [48, 48], maxZoom: 16 });
    // `chave` resume `pontos`; o array muda de identidade a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, chave]);

  return null;
}

export default function MapaReal({ ciclista, pins, rota, chip, enquadrar, className = "" }: MapaProps) {
  return (
    <section aria-label="Mapa" className={`relative isolate overflow-hidden rounded-2xl border border-line bg-map ${className}`}>
      <MapContainer center={ciclista ?? CENTRO_PADRAO} zoom={14} scrollWheelZoom={false} className="absolute inset-0 size-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Enquadrar pontos={enquadrar} />
        {rota && (
          <Polyline
            positions={[rota.de, rota.ate]}
            pathOptions={{ className: "stroke-ok", weight: 5, dashArray: "2 10", lineCap: "round" }}
          />
        )}
        {ciclista && <Marker position={ciclista} icon={ICONE_DO_CICLISTA} keyboard={false} />}
        {pins.map((pin) => (
          <Marker key={pin.id} position={pin} icon={iconeDoMecanico(pin.initials)} keyboard={false} />
        ))}
      </MapContainer>
      <span className="pointer-events-none absolute top-4 left-4 z-[1000] rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-md">
        {chip}
      </span>
    </section>
  );
}
