export type Posicao = { lat: number; lng: number };

/** Centro do mapa quando ainda não há nenhuma posição: Boa Vista, Recife. */
export const CENTRO_PADRAO: Posicao = { lat: -8.0631, lng: -34.8811 };

const ERROS_DO_GPS: Record<number, string> = {
  1: "A localização foi bloqueada. Libere nas configurações do navegador ou digite o endereço.",
  2: "Não foi possível encontrar sua localização agora. Digite o endereço.",
  3: "A localização demorou demais. Tente de novo ou digite o endereço.",
};

/** Lê a posição do aparelho uma vez. */
export function obterPosicao(): Promise<Posicao> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Este navegador não informa a localização. Digite o endereço."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      (erro) => reject(new Error(ERROS_DO_GPS[erro.code] ?? ERROS_DO_GPS[2])),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

/** Só lê a posição se a pessoa já autorizou antes, sem abrir o pedido de permissão. */
export async function posicaoSeJaAutorizada(): Promise<Posicao | null> {
  try {
    const permissao = await navigator.permissions.query({ name: "geolocation" });
    return permissao.state === "granted" ? await obterPosicao() : null;
  } catch {
    return null;
  }
}

type RespostaDoNominatim = {
  display_name?: string;
  address?: { road?: string; house_number?: string; suburb?: string; neighbourhood?: string; city?: string; town?: string };
};

/** Endereço escrito a partir das coordenadas (OpenStreetMap/Nominatim). */
export async function enderecoDaPosicao({ lat, lng }: Posicao): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=pt-BR&lat=${lat}&lon=${lng}`;
    const resposta = await fetch(url);
    if (!resposta.ok) return null;
    const { address, display_name }: RespostaDoNominatim = await resposta.json();
    if (!address?.road) return display_name ?? null;
    const rua = address.house_number ? `${address.road}, ${address.house_number}` : address.road;
    const bairro = address.suburb ?? address.neighbourhood ?? address.city ?? address.town;
    return bairro ? `${rua} — ${bairro}` : rua;
  } catch {
    return null;
  }
}

/** Distância em linha reta, em km (haversine). */
export function distanciaKm(a: Posicao, b: Posicao) {
  const rad = (graus: number) => (graus * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatarDistancia(km: number) {
  return km < 1 ? `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m` : `${km.toFixed(1).replace(".", ",")} km`;
}

/** Tempo sugerido para chegar, a ~15 km/h no trânsito da cidade, com no mínimo 5 min. */
export function minutosSugeridos(km: number) {
  return Math.max(5, Math.ceil((km / 15) * 60));
}

/** Ponto entre `de` e `ate`, com `fracao` de 0 a 1. */
export function pontoNoCaminho(de: Posicao, ate: Posicao, fracao: number): Posicao {
  return { lat: de.lat + (ate.lat - de.lat) * fracao, lng: de.lng + (ate.lng - de.lng) * fracao };
}

export function linkDaRota({ lat, lng }: Posicao) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function posicaoDoChamado(chamado: { latitude: number | null; longitude: number | null }): Posicao | null {
  return chamado.latitude !== null && chamado.longitude !== null ? { lat: chamado.latitude, lng: chamado.longitude } : null;
}
