import { createClient } from "@supabase/supabase-js";

export const E2E_PASSWORD = "sos-bikes-e2e-senha";

export const e2eAccounts = {
  cyclist: {
    email: "ciclista.e2e@sosbikes.test",
    password: E2E_PASSWORD,
    name: "Ciclista E2E",
  },
  mechanic: {
    email: "mecanico.e2e@sosbikes.test",
    password: E2E_PASSWORD,
    name: "Mecânico E2E",
  },
};

export default async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("A preparação dos testes exige as credenciais do Supabase local.");
  }
  const supabaseAddress = new URL(url);
  if (
    supabaseAddress.protocol !== "http:" ||
    !["localhost", "127.0.0.1"].includes(supabaseAddress.hostname) ||
    supabaseAddress.port !== "54321"
  ) {
    throw new Error("A preparação dos testes só pode usar o Supabase local em http://127.0.0.1:54321.");
  }

  const accounts = [
    { profile: "ciclista", account: e2eAccounts.cyclist },
    { profile: "mecanico", account: e2eAccounts.mechanic },
  ] as const;

  for (const { profile, account } of accounts) {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: {
        data: {
          nome: account.name,
          tipo: profile,
          telefone: "81999990000",
          oficina: profile === "mecanico" ? "Oficina E2E" : null,
        },
      },
    });

    if (error) {
      throw new Error(`Não foi possível preparar a conta local de ${profile}: ${error.message}`);
    }
    if (!data.user || !data.session) {
      throw new Error(
        `Não foi possível criar a conta local de ${profile}. Execute \`supabase db reset\` antes dos testes E2E.`,
      );
    }

    if (profile === "mecanico") {
      const { error: availabilityError } = await supabase
        .from("perfis")
        .update({ disponivel: true })
        .eq("id", data.user.id);

      if (availabilityError) {
        throw new Error(`Não foi possível disponibilizar o mecânico de teste: ${availabilityError.message}`);
      }
    }
  }
}
