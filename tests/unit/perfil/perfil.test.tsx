import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormularioDePerfil } from "@/components/perfil/FormularioDePerfil";
import { PerfilProvider } from "@/components/PerfilProvider";
import { Toaster } from "@/components/ui/Toaster";
import { atualizarPerfil } from "@/app/_actions/perfil";
import type { Perfil } from "@/lib/supabase/database.types";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/_actions/perfil", () => ({ atualizarPerfil: vi.fn() }));
vi.mock("@/app/_actions/auth", () => ({ trocarSenha: vi.fn() }));
afterEach(cleanup);
beforeEach(() => { refresh.mockClear(); vi.mocked(atualizarPerfil).mockReset(); });
function abrir(tipo: Perfil["tipo"] = "ciclista", parte: "contato" | "publico" = "contato") {
  const perfil: Perfil = { id: "dono", tipo, nome: "Ana Teste", telefone: "81999990000", oficina: tipo === "mecanico" ? "Oficina Teste" : null, disponivel: false, especialidades: [], servicos: [], bairro_regiao: null, criado_em: "2026-11-21T12:00:00Z" };
  render(<PerfilProvider perfil={perfil}><Toaster><FormularioDePerfil parte={parte} /></Toaster></PerfilProvider>);
}
it.each(["ciclista", "mecanico"] as const)("%s: contato tem só nome e WhatsApp", tipo => {
  abrir(tipo);
  expect(screen.getByLabelText("Nome completo")).toBeTruthy();
  expect(screen.getByLabelText("WhatsApp")).toBeTruthy();
  // Especialidades, serviços e região ficam no Perfil público; oficina tem seção própria.
  expect(screen.queryByText("Especialidades")).toBeNull();
  expect(screen.queryByLabelText(/Oficina/)).toBeNull();
});
it("contato salva só nome e WhatsApp e pede atualização do cabeçalho", async () => {
  vi.mocked(atualizarPerfil).mockResolvedValue({ok:true});
  abrir();
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText("Nome completo"));
  await user.type(screen.getByLabelText("Nome completo"), "Ana Atualizada");
  await user.click(screen.getByRole("button", {name:"Salvar alterações"}));
  expect((await screen.findByRole("status")).textContent).toContain("Perfil atualizado.");
  expect(atualizarPerfil).toHaveBeenCalledWith({nome:"Ana Atualizada",telefone:"(81) 99999-0000"});
  expect(refresh).toHaveBeenCalledOnce();
});
it("perfil público do mecânico salva região, especialidades e serviços com o contato já salvo", async () => {
  vi.mocked(atualizarPerfil).mockResolvedValue({ok:true});
  abrir("mecanico", "publico");
  expect(screen.queryByLabelText("Nome completo")).toBeNull();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Bairro ou região/), "Boa Vista");
  await user.click(screen.getByRole("button", {name:"Salvar alterações"}));
  expect(atualizarPerfil).toHaveBeenCalledWith({nome:"Ana Teste",telefone:"81999990000",bairro_regiao:"Boa Vista",especialidades:[],servicos:""});
});
it("perfil público sem WhatsApp salvo orienta a completar Dados pessoais", async () => {
  vi.mocked(atualizarPerfil).mockResolvedValue({erros:{telefone:"Informe o WhatsApp com DDD."}});
  abrir("mecanico", "publico");
  await userEvent.setup().click(screen.getByRole("button", {name:"Salvar alterações"}));
  expect((await screen.findByRole("alert")).textContent).toContain("Dados pessoais");
});
it("falha de rede mantém rascunho e não atualiza cabeçalho", async () => {
  vi.mocked(atualizarPerfil).mockRejectedValue(new Error("network"));
  abrir();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", {name:"Salvar alterações"}));
  expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível salvar.");
  expect((screen.getByLabelText("Nome completo") as HTMLInputElement).value).toBe("Ana Teste");
  expect(refresh).not.toHaveBeenCalled();
});
