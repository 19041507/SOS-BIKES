import type { Metadata } from "next";
import { ListaDeFavoritos } from "@/components/ListaDeFavoritos";

export const metadata: Metadata = { title: "Mecânicos favoritos · SOS Bikes" };

export default function FavoritosPage() {
  return <ListaDeFavoritos />;
}
