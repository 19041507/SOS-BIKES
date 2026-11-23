import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Notificacoes } from "@/components/perfil/Notificacoes";
import { Toaster } from "@/components/ui/Toaster";
import { ativarNotificacoes, desativarNotificacoes, estadoDasNotificacoes, type EstadoDasNotificacoes } from "@/lib/notificacoes";

vi.mock("@/lib/notificacoes", () => ({ ativarNotificacoes: vi.fn(), desativarNotificacoes: vi.fn(), estadoDasNotificacoes: vi.fn() }));
afterEach(cleanup);
beforeEach(() => { vi.mocked(estadoDasNotificacoes).mockReset(); vi.mocked(ativarNotificacoes).mockReset(); vi.mocked(desativarNotificacoes).mockReset(); });
function abrir(estado: EstadoDasNotificacoes) {
  vi.mocked(estadoDasNotificacoes).mockResolvedValue(estado);
  render(<Toaster><Notificacoes /></Toaster>);
}
it.each([
  ["ativadas", "Você recebe avisos do atendimento com o app fechado.", "Desativar"],
  ["desativadas", "Receba avisos de chamados e mensagens com o app fechado.", "Ativar notificações"],
] as const)("mostra estado %s", async (estado, texto, botao) => {
  abrir(estado);
  expect(await screen.findByText(texto)).toBeTruthy();
  expect(screen.getByRole("button", {name:botao})).toBeTruthy();
});
it("bloqueadas orienta sem botão de ativação", async () => {
  abrir("bloqueadas");
  expect(await screen.findByText("As notificações estão bloqueadas. Libere nas configurações do navegador.")).toBeTruthy();
  expect(screen.queryByRole("button", {name:"Ativar notificações"})).toBeNull();
  expect(screen.queryByRole("button", {name:"Desativar"})).toBeNull();
});
it("iPhone aponta para o card de instalação", async () => {
  abrir("instalar");
  expect(await screen.findByText("No iPhone, instale o app para receber notificações.")).toBeTruthy();
  expect(screen.getByRole("link", {name:/Instale o SOS Bikes/}).getAttribute("href")).toBe("#instalar-app");
});
it("não exibe card sem suporte", async () => {
  abrir("indisponivel");
  await vi.waitFor(() => expect(estadoDasNotificacoes).toHaveBeenCalled());
  expect(screen.queryByRole("heading", {name:"Notificações"})).toBeNull();
});
it("ativação confirmada atualiza estado e toast", async () => {
  abrir("desativadas");
  await screen.findByRole("button", {name:"Ativar notificações"});
  vi.mocked(ativarNotificacoes).mockResolvedValue("ativadas");
  await userEvent.click(screen.getByRole("button", {name:"Ativar notificações"}));
  expect(await screen.findByText("Você recebe avisos do atendimento com o app fechado.")).toBeTruthy();
  expect(screen.getByRole("status").textContent).toContain("Notificações ativadas.");
});
it("desativação confirmada reconsulta estado", async () => {
  abrir("ativadas");
  await screen.findByRole("button", {name:"Desativar"});
  vi.mocked(desativarNotificacoes).mockResolvedValue(undefined);
  vi.mocked(estadoDasNotificacoes).mockResolvedValue("desativadas");
  await userEvent.click(screen.getByRole("button", {name:"Desativar"}));
  expect(await screen.findByRole("button", {name:"Ativar notificações"})).toBeTruthy();
  expect(screen.getByRole("status").textContent).toContain("Notificações desativadas.");
});
it("erro parcial não anuncia desativação nem recebimento ativo", async () => {
  abrir("ativadas");
  await screen.findByRole("button", {name:"Desativar"});
  vi.mocked(desativarNotificacoes).mockRejectedValue(new Error("network"));
  await userEvent.click(screen.getByRole("button", {name:"Desativar"}));
  expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível atualizar as notificações.");
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByText("Você recebe avisos do atendimento com o app fechado.")).toBeNull();
  expect(screen.queryByRole("button", {name:"Desativar"})).toBeNull();
  expect(screen.getByRole("button", {name:"Atualizar estado"})).toBeTruthy();
});
it("ativação pendente impede cliques duplicados", async () => {
  abrir("desativadas");
  await screen.findByRole("button", {name:"Ativar notificações"});
  let concluir!: (estado: EstadoDasNotificacoes) => void;
  vi.mocked(ativarNotificacoes).mockReturnValue(new Promise(resolve => { concluir = resolve; }));
  await userEvent.click(screen.getByRole("button", {name:"Ativar notificações"}));
  const pendente = screen.getByRole("button", {name:"Atualizando…"}) as HTMLButtonElement;
  expect(pendente.disabled).toBe(true);
  await userEvent.click(pendente);
  expect(ativarNotificacoes).toHaveBeenCalledOnce();
  await act(async () => { concluir("ativadas"); });
  expect(screen.getByRole("button", {name:"Desativar"})).toBeTruthy();
});
it("consulta inicial falhando permite recuperar sem inventar estado", async () => {
  vi.mocked(estadoDasNotificacoes).mockRejectedValueOnce(new Error("network"));
  render(<Toaster><Notificacoes /></Toaster>);
  expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível consultar");
  expect(screen.queryByRole("button", {name:"Ativar notificações"})).toBeNull();
  vi.mocked(estadoDasNotificacoes).mockResolvedValue("desativadas");
  await userEvent.click(screen.getByRole("button", {name:"Atualizar estado"}));
  expect(await screen.findByRole("button", {name:"Ativar notificações"})).toBeTruthy();
});
