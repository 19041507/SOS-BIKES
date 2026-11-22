import { SENHA_MINIMA } from "./cadastro";

export type ResultadoDaSenha = { erro: string } | { ok: true };

type AuthDaSenha = {
  getUser(): Promise<{ data: { user: { id: string; email?: string } | null }; error: unknown }>;
  signInWithPassword(dados: { email: string; password: string }): Promise<{
    data: { user: { id: string } | null }; error: { code?: string } | null;
  }>;
  updateUser(dados: { password: string }): Promise<{
    data: { user: { id: string } | null }; error: { code?: string } | null;
  }>;
};

/** Reautentica o titular da sessão antes de alterar sua senha; nunca registra segredos. */
export async function trocarSenhaAutenticada(auth: AuthDaSenha, dados: unknown): Promise<ResultadoDaSenha> {
  if (!dados || typeof dados !== "object" || !("atual" in dados) || typeof dados.atual !== "string" || !dados.atual) {
    return { erro: "Informe sua senha atual." };
  }
  if (!("nova" in dados) || typeof dados.nova !== "string" || dados.nova.length < SENHA_MINIMA) {
    return { erro: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };
  }
  try {
    const { data, error } = await auth.getUser();
    const usuario = data.user;
    if (error || !usuario?.email) return { erro: "Sua sessão expirou. Entre de novo." };

    const entrada = await auth.signInWithPassword({ email: usuario.email, password: dados.atual });
    if (entrada.error || !entrada.data.user) return { erro: "Senha atual incorreta." };
    if (entrada.data.user.id !== usuario.id) return { erro: "Sua sessão mudou. Entre de novo antes de trocar a senha." };

    const alteracao = await auth.updateUser({ password: dados.nova });
    if (alteracao.error?.code === "same_password") return { erro: "Use uma senha diferente da atual." };
    if (alteracao.error?.code === "weak_password") return { erro: "Senha fraca. Use letras e números." };
    if (alteracao.error || alteracao.data.user?.id !== usuario.id) {
      return { erro: "Não foi possível alterar a senha. Tente de novo." };
    }
    return { ok: true };
  } catch {
    return { erro: "Não foi possível alterar a senha. Tente de novo." };
  }
}
