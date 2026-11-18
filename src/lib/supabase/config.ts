// As variáveis NEXT_PUBLIC_ precisam aparecer escritas assim para o Next embuti-las no build.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigurado = Boolean(url && publishableKey);

export function supabaseCredenciais() {
  if (!url || !publishableKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return { url, publishableKey };
}
