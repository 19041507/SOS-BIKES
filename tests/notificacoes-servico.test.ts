import { afterEach, expect, it, vi } from "vitest";
import { desativarNotificacoes } from "@/lib/notificacoes";

const { criarCliente } = vi.hoisted(() => ({ criarCliente: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: criarCliente }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); criarCliente.mockReset(); });
function preparar(erro: { message: string } | null, cancelou = true) {
  const unsubscribe = vi.fn(async () => cancelou);
  const eq = vi.fn(async () => ({error:erro}));
  const excluir = vi.fn(() => ({eq}));
  const from = vi.fn(() => ({delete:excluir}));
  criarCliente.mockReturnValue({from});
  vi.stubGlobal("navigator", {serviceWorker:{getRegistration:async()=>({pushManager:{getSubscription:async()=>({endpoint:"https://push.example.test/abc",unsubscribe})}})}});
  return {unsubscribe,eq,from};
}
it("erro no banco impede sucesso silencioso ao desativar", async () => {
  const estado = preparar({message:"database unavailable"});
  await expect(desativarNotificacoes()).rejects.toThrow("Não foi possível desativar as notificações.");
  expect(estado.unsubscribe).not.toHaveBeenCalled();
});
it("cancelamento recusado pelo navegador é informado", async () => {
  preparar(null,false);
  await expect(desativarNotificacoes()).rejects.toThrow("Não foi possível desativar as notificações.");
});
it("remove somente a inscrição do navegador atual antes de cancelar", async () => {
  const estado = preparar(null);
  await expect(desativarNotificacoes()).resolves.toBeUndefined();
  expect(estado.from).toHaveBeenCalledWith("inscricoes_push");
  expect(estado.eq).toHaveBeenCalledWith("endpoint","https://push.example.test/abc");
  expect(estado.unsubscribe).toHaveBeenCalledOnce();
});
it.each([false,true])("estado ativo exige inscrição local E cadastro no servidor: cadastrado=%s", async cadastrado => {
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY","chave-publica-de-teste");
  vi.resetModules();
  const { estadoDasNotificacoes } = await import("@/lib/notificacoes");
  vi.stubGlobal("navigator", {userAgent:"desktop-test",maxTouchPoints:0,serviceWorker:{getRegistration:async()=>({pushManager:{getSubscription:async()=>({endpoint:"https://push.example.test/abc"})}})}});
  vi.stubGlobal("PushManager",class {});
  vi.stubGlobal("Notification",{permission:"granted"});
  const maybeSingle = vi.fn(async()=>({data:cadastrado?{id:"registro"}:null,error:null}));
  const eq = vi.fn(()=>({maybeSingle}));
  const select = vi.fn(()=>({eq}));
  criarCliente.mockReturnValue({from:()=>({select})});
  expect(await estadoDasNotificacoes()).toBe(cadastrado?"ativadas":"desativadas");
  expect(select).toHaveBeenCalledWith("id");
  expect(eq).toHaveBeenCalledWith("endpoint","https://push.example.test/abc");
});
