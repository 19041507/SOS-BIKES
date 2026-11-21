import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SOS Bikes",
    short_name: "SOS Bikes",
    description: "Socorro sobre duas rodas: assistência mecânica para ciclistas.",
    lang: "pt-BR",
    // Quem já está logado é levado pelo proxy direto para a própria área.
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f7fa",
    theme_color: "#1d5fbf",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
