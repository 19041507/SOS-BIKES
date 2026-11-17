import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigurado, supabaseCredenciais } from "./config";
import type { Database } from "./database.types";

const AREAS_PROTEGIDAS = ["/ciclista", "/mecanico"];

/**
 * Renova a sessão do Supabase a cada requisição e manda para o login quem tenta abrir
 * uma área sem estar logado. É só a checagem rápida: quem pode ver cada área é
 * verificado pelo perfil no layout de cada uma.
 */
export async function atualizarSessao(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!supabaseConfigurado) return response;

  const { url, publishableKey } = supabaseCredenciais();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims valida o token; não colocar código entre a criação do cliente e esta chamada.
  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims);
  const caminho = request.nextUrl.pathname;
  const areaProtegida = AREAS_PROTEGIDAS.some((area) => caminho === area || caminho.startsWith(`${area}/`));

  if (!logado && areaProtegida) {
    const login = request.nextUrl.clone();
    login.pathname = "/";
    login.search = "";
    const redirecionamento = NextResponse.redirect(login);
    response.cookies.getAll().forEach((cookie) => redirecionamento.cookies.set(cookie));
    return redirecionamento;
  }

  return response;
}
