"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import type { Enum } from "@/lib/supabase/database.types";

type DadosDeEntrada = {
  email: string;
  senha: string;
  perfil: Enum<"tipo_perfil">;
};

const NOME_DO_PERFIL: Record<Enum<"tipo_perfil">, string> = {
  ciclista: "ciclista",
  mecanico: "mecânico",
};

const OPCAO_DO_PERFIL: Record<Enum<"tipo_perfil">, string> = {
  ciclista: "Sou ciclista",
  mecanico: "Sou mecânico",
};

/** Retorna a mensagem de erro; em caso de sucesso, redireciona para a área do perfil. */
export async function entrar({ email, senha, perfil }: DadosDeEntrada): Promise<{ erro: string }> {
  if (!supabaseConfigurado) {
    return { erro: "O login não está configurado neste ambiente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });

  if (error || !data.user) {
    return {
      erro:
        error?.code === "email_not_confirmed"
          ? "Confirme seu e-mail antes de entrar."
          : "E-mail ou senha incorretos.",
    };
  }

  const { data: conta } = await supabase.from("perfis").select("tipo").eq("id", data.user.id).single();

  if (!conta) {
    await supabase.auth.signOut();
    return { erro: "Não encontramos o perfil desta conta." };
  }

  if (conta.tipo !== perfil) {
    await supabase.auth.signOut();
    return {
      erro: `Esta conta é de ${NOME_DO_PERFIL[conta.tipo]}. Selecione "${OPCAO_DO_PERFIL[conta.tipo]}" e entre de novo.`,
    };
  }

  redirect(`/${conta.tipo}`);
}

export async function sair() {
  if (supabaseConfigurado) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
