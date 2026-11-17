export type Category = { id: string; label: string };

export const categories: Category[] = [
  { id: "pneu", label: "Pneu furado" },
  { id: "corrente", label: "Corrente partida" },
  { id: "freio", label: "Freios" },
  { id: "roda", label: "Rodas" },
  { id: "selim", label: "Selim" },
];

export type Mechanic = {
  id: string;
  name: string;
  initials: string;
  kind: string;
  rating: string;
  reviews: number;
  distance: string;
  estimate: number;
  finalPrice: number;
  priceChangeReason?: string;
  etaMinutes: number;
  /** Posição no mapa ilustrativo, em % */
  x: number;
  y: number;
  declines?: boolean;
};

// Dados fictícios. Marcos sempre recusa e o atendimento de João termina acima
// da estimativa, para exibir as duas regras de negócio.
export const mechanics: Mechanic[] = [
  {
    id: "lucas",
    name: "Lucas Ferreira",
    initials: "LF",
    kind: "Oficina BikeFast",
    rating: "4,9",
    reviews: 152,
    distance: "800 m",
    estimate: 25,
    finalPrice: 25,
    etaMinutes: 6,
    x: 70,
    y: 25,
  },
  {
    id: "joao",
    name: "João Silva",
    initials: "JS",
    kind: "Mecânico autônomo",
    rating: "4,7",
    reviews: 64,
    distance: "600 m",
    estimate: 20,
    finalPrice: 28,
    priceChangeReason: "foi preciso trocar a câmara de ar.",
    etaMinutes: 5,
    x: 28,
    y: 30,
  },
  {
    id: "marcos",
    name: "Marcos Lima",
    initials: "ML",
    kind: "Mecânico autônomo",
    rating: "4,5",
    reviews: 38,
    distance: "1,2 km",
    estimate: 30,
    finalPrice: 30,
    etaMinutes: 9,
    x: 68,
    y: 78,
    declines: true,
  },
];

export const PLATFORM_FEE = 0.1;
