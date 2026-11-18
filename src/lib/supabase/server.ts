import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseCredenciais } from "./config";
import type { Database } from "./database.types";

/** Cliente do Supabase para Server Components, Server Actions e Route Handlers. */
export async function createClient() {
  const { url, publishableKey } = supabaseCredenciais();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Em Server Components os cookies são somente leitura; a renovação da sessão
          // fica com o proxy (src/proxy.ts), que entra junto com o login.
        }
      },
    },
  });
}
