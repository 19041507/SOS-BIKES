import { createBrowserClient } from "@supabase/ssr";
import { supabaseCredenciais } from "./config";
import type { Database } from "./database.types";

/** Cliente do Supabase para Client Components ("use client"). */
export function createClient() {
  const { url, publishableKey } = supabaseCredenciais();
  return createBrowserClient<Database>(url, publishableKey);
}
