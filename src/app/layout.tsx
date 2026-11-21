import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { RegistrarServiceWorker } from "@/components/RegistrarServiceWorker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SOS Bikes",
  description: "Socorro sobre duas rodas: assistência mecânica para ciclistas.",
  // No iPhone, o app adicionado à tela inicial abre em tela cheia.
  appleWebApp: { capable: true, title: "SOS Bikes", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1d5fbf",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
