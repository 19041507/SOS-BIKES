import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { perfilAtual } from "@/lib/auth";
import { iniciais } from "@/lib/pessoas";
import type { Enum } from "@/lib/supabase/database.types";
import { AppHeader } from "./AppHeader";
import type { LinkDeNavegacao } from "./NavPrincipal";
import { Logo } from "./Logo";
import { PerfilProvider } from "./PerfilProvider";
import { FavoritosProvider } from "./FavoritosProvider";
import { LegalLinks } from "./LegalLinks";
import { Toaster } from "./ui/Toaster";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_FOTOS_MECANICOS } from "@/lib/perfil-mecanico";
import preferencias from "./perfil/completo/preferencias.module.css";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Ciclista: foto do Meu perfil, em bucket privado (link assinado de 1 hora). */
async function fotoPrivada(db: Supabase, caminho: string | null) {
  if (!caminho) return null;
  const { data } = await db.storage.from("fotos-perfil").createSignedUrl(caminho, 3600);
  return data?.signedUrl ?? null;
}

/** Mecânico: a mesma foto pública do perfil que os ciclistas veem (uma foto só). */
async function fotoPublicaDoMecanico(db: Supabase, mecanicoId: string) {
  const { data } = await db.from("perfil_mecanico_fotos").select("caminho").eq("mecanico_id", mecanicoId).eq("tipo", "perfil").maybeSingle();
  return data ? db.storage.from(BUCKET_FOTOS_MECANICOS).getPublicUrl(data.caminho).data.publicUrl : null;
}

type AreaLogadaProps = {
  tipo: Enum<"tipo_perfil">;
  links: LinkDeNavegacao[];
  children: ReactNode;
};

/**
 * Lê o perfil logado e só mostra a área para o tipo certo.
 * Lê cookies, então precisa ficar dentro de um <Suspense> (cacheComponents).
 */
export async function AreaLogada({ tipo, links, children }: AreaLogadaProps) {
  const perfil = await perfilAtual();
  if (!perfil) redirect("/");
  if (perfil.tipo !== tipo) redirect(`/${perfil.tipo}`);

  const primeiroNome = perfil.nome.split(" ")[0];
  const nome = tipo === "mecanico" ? `${primeiroNome} · ${perfil.oficina ?? "Mecânico autônomo"}` : primeiroNome;
  const db = await createClient();
  const { data: ajustes } = await db.from("perfil_privado").select("texto_ampliado,alto_contraste,reduzir_movimentos,foto_caminho").eq("usuario_id",perfil.id).maybeSingle();
  const fotoUrl = tipo === "mecanico" ? await fotoPublicaDoMecanico(db, perfil.id) : await fotoPrivada(db, ajustes?.foto_caminho ?? null);
  // Ausência da migration não deve quebrar pedidos/histórico; Meu perfil informa o erro.
  const classes = [preferencias.area, ajustes?.texto_ampliado ? preferencias.texto : "", ajustes?.alto_contraste ? preferencias.contraste : "", ajustes?.reduzir_movimentos ? preferencias.movimento : ""].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <AppHeader
        badge={tipo === "mecanico" ? "Mecânico" : undefined}
        links={links}
        user={{ initials: iniciais(perfil.nome), name: nome, fotoUrl }}
      />
      {!perfil.telefone && (
        <div role="status" className="border-b border-warn/20 bg-warn-soft">
          <p className="mx-auto max-w-7xl px-4 py-2.5 text-sm text-warn">
            <strong>Complete seu perfil:</strong> adicione seu WhatsApp para{" "}
            {tipo === "mecanico" ? "os ciclistas" : "o mecânico"} conseguir falar com você.{" "}
            <Link href={`/${tipo}/perfil`} className="font-semibold underline underline-offset-2">
              Completar agora
            </Link>
          </p>
        </div>
      )}
      <PerfilProvider perfil={perfil}>
        <Toaster>
          <FavoritosProvider>{children}</FavoritosProvider>
          <footer className="border-t border-line bg-white px-4 py-2">
            <LegalLinks />
          </footer>
        </Toaster>
      </PerfilProvider>
    </div>
  );
}

export function AreaLogadaCarregando() {
  return (
    <header className="border-b border-line bg-white" aria-busy="true">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-3">
        <Logo />
        <span className="ml-auto text-sm text-subtle">Carregando…</span>
      </div>
    </header>
  );
}
