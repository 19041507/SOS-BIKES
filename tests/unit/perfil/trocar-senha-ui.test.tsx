import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrocarSenha } from "@/components/perfil/TrocarSenha";
import { Toaster } from "@/components/ui/Toaster";
import { trocarSenha } from "@/app/_actions/auth";

vi.mock("@/app/_actions/auth", () => ({ trocarSenha: vi.fn() }));
afterEach(cleanup);
beforeEach(() => { vi.mocked(trocarSenha).mockReset(); });
async function preencher(nova = "nova123", confirmacao = nova) {
  const user = userEvent.setup();
  render(<Toaster><TrocarSenha /></Toaster>);
  await user.type(screen.getByLabelText("Senha atual"), "atual123");
  await user.type(screen.getByLabelText("Nova senha"), nova);
  await user.type(screen.getByLabelText("Confirmar senha"), confirmacao);
  return user;
}
it.each([["123", "123"], ["nova123", "outra123"]])("valida nova e confirmação sem enviar: %s/%s", async (nova, confirmacao) => {
  const user = await preencher(nova, confirmacao);
  await user.click(screen.getByRole("button", { name: "Trocar senha" }));
  expect(trocarSenha).not.toHaveBeenCalled();
  expect(screen.getByText(nova.length < 6 ? "A senha precisa ter pelo menos 6 caracteres." : "As senhas não são iguais.")).toBeTruthy();
});
it("mostra e oculta a senha sem submeter", async () => {
  const user = await preencher();
  const input = screen.getByLabelText("Senha atual") as HTMLInputElement;
  await user.click(screen.getByRole("button", { name: "Mostrar senha atual" }));
  expect(input.type).toBe("text");
  await user.click(screen.getByRole("button", { name: "Ocultar senha atual" }));
  expect(input.type).toBe("password");
  expect(trocarSenha).not.toHaveBeenCalled();
});
it("sucesso limpa os campos e mostra o toast", async () => {
  vi.mocked(trocarSenha).mockResolvedValue({ ok: true });
  const user = await preencher();
  await user.click(screen.getByRole("button", { name: "Trocar senha" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Senha alterada."));
  for (const label of ["Senha atual", "Nova senha", "Confirmar senha"]) expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe("");
  expect(trocarSenha).toHaveBeenCalledWith({ atual: "atual123", nova: "nova123" });
});
it("erro mantém rascunho e mensagem exata", async () => {
  vi.mocked(trocarSenha).mockResolvedValue({ erro: "Senha atual incorreta." });
  const user = await preencher();
  await user.click(screen.getByRole("button", { name: "Trocar senha" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Senha atual incorreta.");
  expect((screen.getByLabelText("Nova senha") as HTMLInputElement).value).toBe("nova123");
});
it("falha de transporte recebe mensagem recuperável", async () => {
  vi.mocked(trocarSenha).mockRejectedValue(new Error("network"));
  const user = await preencher();
  await user.click(screen.getByRole("button", { name: "Trocar senha" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível alterar a senha.");
});
