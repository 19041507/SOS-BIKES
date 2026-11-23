import { describe, expect, it, vi } from "vitest";
import { trocarSenhaAutenticada } from "@/lib/trocar-senha";

function conta() {
  return {
    getUser: vi.fn(async () => ({ data: { user: { id: "dono", email: "dono@example.test" } }, error: null })),
    signInWithPassword: vi.fn(async (dados: { email: string; password: string }) => { void dados; return { data: { user: { id: "dono" } }, error: null as { code?: string } | null }; }),
    updateUser: vi.fn(async (dados: { password: string }) => { void dados; return { data: { user: { id: "dono" } }, error: null as { code?: string } | null }; }),
  };
}
const dados = { atual: " atual com espaços ", nova: "nova123" };

describe("troca autenticada da senha", () => {
  it("rejeita nova curta antes de chamar o Auth", async () => {
    const auth = conta();
    expect(await trocarSenhaAutenticada(auth, { ...dados, nova: "123" })).toEqual({ erro: "A senha precisa ter pelo menos 6 caracteres." });
    expect(auth.getUser).not.toHaveBeenCalled();
  });
  it("valida tipos e senha atual vazia na entrada direta", async () => {
    const auth = conta();
    expect(await trocarSenhaAutenticada(auth, { ...dados, atual: "" })).toEqual({ erro: "Informe sua senha atual." });
    expect("erro" in await trocarSenhaAutenticada(auth, null)).toBe(true);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("não altera sem sessão", async () => {
    const auth = conta();
    auth.getUser.mockResolvedValueOnce({ data: { user: null! }, error: null });
    expect("erro" in await trocarSenhaAutenticada(auth, dados)).toBe(true);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it("senha atual incorreta impede updateUser", async () => {
    const auth = conta();
    auth.signInWithPassword.mockResolvedValueOnce({ data: { user: null! }, error: { code: "invalid_credentials" } });
    expect(await trocarSenhaAutenticada(auth, dados)).toEqual({ erro: "Senha atual incorreta." });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("identidade divergente impede atualização de outra conta", async () => {
    const auth = conta();
    auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: "outro" } }, error: null });
    expect("erro" in await trocarSenhaAutenticada(auth, dados)).toBe(true);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it.each([
    ["same_password", "Use uma senha diferente da atual."],
    ["weak_password", "Senha fraca. Use letras e números."],
    ["unexpected", "Não foi possível alterar a senha. Tente de novo."],
  ])("traduz o erro %s do Auth", async (code, erro) => {
    const auth = conta();
    auth.updateUser.mockResolvedValueOnce({ data: { user: null! }, error: { code } });
    expect(await trocarSenhaAutenticada(auth, dados)).toEqual({ erro });
  });
  it("erro de rede não vira sucesso e não expõe segredos", async () => {
    const auth = conta();
    auth.updateUser.mockRejectedValueOnce(new Error(dados.nova));
    const resultado = await trocarSenhaAutenticada(auth, dados);
    expect(resultado).toEqual({ erro: "Não foi possível alterar a senha. Tente de novo." });
  });
  it("reautentica o e-mail da sessão e preserva senhas sem trim", async () => {
    const auth = conta();
    expect(await trocarSenhaAutenticada(auth, dados)).toEqual({ ok: true });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "dono@example.test", password: " atual com espaços " });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "nova123" });
    expect(auth.signInWithPassword.mock.invocationCallOrder[0]).toBeLessThan(auth.updateUser.mock.invocationCallOrder[0]);
  });
});
