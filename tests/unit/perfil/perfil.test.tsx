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
function abrir(tipo: Perfil["tipo"] = "ciclista") {
  const perfil: Perfil = { id: "dono", tipo, nome: "Ana Teste", telefone: "81999990000", oficina: tipo === "mecanico" ? "Oficina Teste" : null, disponivel: false, especialidades: [], servicos: [], bairro_regiao: null, criado_em: "2026-11-21T12:00:00Z" };
  render(<PerfilProvider perfil={perfil}><Toaster><FormularioDePerfil /></Toaster></PerfilProvider>);
}
it.each(["ciclista", "mecanico"] as const)("%s tem Senha abaixo de Dados pessoais e mantém campos", tipo => {
  abrir(tipo);
  const titulos = screen.getAllByRole("heading", {level: 2}).map(el => el.textContent);
  expect(titulos.indexOf("Dados pessoais")).toBeGreaterThanOrEqual(0);
  expect(titulos.indexOf("Senha")).toBeGreaterThan(titulos.indexOf("Dados pessoais"));
  expect(screen.getByLabelText("Nome completo")).toBeTruthy();
  expect(screen.getByLabelText("WhatsApp")).toBeTruthy();
  expect(screen.queryByLabelText(/Oficina/)!==null).toBe(tipo === "mecanico");
});
it("salva valores e pede atualização do cabeçalho após sucesso", async () => {
  vi.mocked(atualizarPerfil).mockResolvedValue({ok:true});
  abrir();
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText("Nome completo"));
  await user.type(screen.getByLabelText("Nome completo"), "Ana Atualizada");
  await user.click(screen.getByRole("button", {name:"Salvar alterações"}));
  expect((await screen.findByRole("status")).textContent).toContain("Perfil atualizado.");
  expect(atualizarPerfil).toHaveBeenCalledWith({nome:"Ana Atualizada",telefone:"(81) 99999-0000",bairro_regiao:"",oficina:"",especialidades:[],servicos:""});
  expect(refresh).toHaveBeenCalledOnce();
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
