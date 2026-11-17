"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { SENHA_MINIMA, emailValido, normalizarTelefone } from "@/lib/cadastro";
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

type DadosDeCadastro = {
  perfil: Enum<"tipo_perfil">;
  nome: string;
  telefone: string;
  oficina: string;
  email: string;
  senha: string;
};

export type ResultadoDoCadastro =
  | { erros: Partial<Record<keyof DadosDeCadastro | "geral", string>> }
  | { confirmarEmail: string };

/**
 * Cria a conta no Supabase Auth. O perfil é criado pelo banco (trigger) com os dados enviados.
 * Se a confirmação de e-mail estiver desligada no Supabase, já entra e redireciona;
 * se estiver ligada, avisa para confirmar pelo link enviado.
 */
export async function cadastrar(dados: DadosDeCadastro): Promise<ResultadoDoCadastro> {
  const nome = dados.nome.trim().replace(/\s+/g, " ");
  const email = dados.email.trim().toLowerCase();
  const telefone = normalizarTelefone(dados.telefone);
  const oficina = dados.perfil === "mecanico" ? dados.oficina.trim() : "";

  const erros: Partial<Record<keyof DadosDeCadastro, string>> = {};
  if (nome.length < 3) erros.nome = "Informe seu nome.";
  if (!telefone) erros.telefone = "Informe o WhatsApp com DDD.";
  if (!emailValido(email)) erros.email = "Informe um e-mail válido.";
  if (dados.senha.length < SENHA_MINIMA) erros.senha = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  if (Object.keys(erros).length > 0) return { erros };

  if (!supabaseConfigurado) {
    return { erros: { geral: "O cadastro não está configurado neste ambiente." } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: dados.senha,
    options: {
      data: { nome, tipo: dados.perfil, telefone, oficina: oficina || null },
    },
  });

  if (error) {
    switch (error.code) {
      case "user_already_exists":
      case "email_exists":
        return { erros: { email: "Já existe uma conta com este e-mail." } };
      case "weak_password":
        return { erros: { senha: "Senha fraca. Use letras e números." } };
      case "over_email_send_rate_limit":
      case "over_request_rate_limit":
        return { erros: { geral: "Muitos cadastros em pouco tempo. Tente de novo em alguns minutos." } };
      default:
        return { erros: { geral: "Não foi possível criar a conta. Tente de novo." } };
    }
  }

  // Com a confirmação ligada, o Supabase não revela que o e-mail já existe:
  // devolve um usuário sem identidades em vez de um erro.
  if (data.user && data.user.identities?.length === 0) {
    return { erros: { email: "Já existe uma conta com este e-mail." } };
  }

  if (!data.session) {
    return { confirmarEmail: email };
  }

  redirect(`/${dados.perfil}`);
}

export async function sair() {
  if (supabaseConfigurado) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
