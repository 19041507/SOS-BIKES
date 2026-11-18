import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";

/**
 * Destino do link de confirmação do e-mail de cadastro.
 * - `token_hash` + `type`: link do template do projeto (supabase/templates). Funciona em
 *   qualquer aparelho, mesmo que o e-mail seja aberto em outro navegador.
 * - `code`: link do template padrão do Supabase. Só funciona no navegador do cadastro.
 * Confirmado, a pessoa já entra e vai para a área do perfil.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const destino = request.nextUrl.clone();
  destino.search = "";

  if (supabaseConfigurado && ((tokenHash && type) || code)) {
    const supabase = await createClient();
    const { error } =
      tokenHash && type
        ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
        : await supabase.auth.exchangeCodeForSession(code!);

    if (!error) {
      const { data: auth } = await supabase.auth.getUser();
      const { data: perfil } = auth.user
        ? await supabase.from("perfis").select("tipo").eq("id", auth.user.id).single()
        : { data: null };

      if (perfil) {
        destino.pathname = `/${perfil.tipo}`;
        return NextResponse.redirect(destino);
      }
    }
  }

  destino.pathname = "/";
  destino.searchParams.set("confirmacao", "invalida");
  return NextResponse.redirect(destino);
}
