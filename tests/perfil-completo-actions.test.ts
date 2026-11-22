import { beforeEach, expect, it, vi } from "vitest";
import { salvarSecaoPerfil,carregarMensagensPerfil } from "@/app/_actions/perfil-completo";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({createClient:vi.fn()}));
vi.mock("next/cache", () => ({revalidatePath:vi.fn()}));
const rpc = vi.fn();
function cliente(logado: boolean) {
  const single = vi.fn().mockResolvedValue({data:{id:"dono",tipo:"ciclista",nome:"Ana",telefone:"81999990000",oficina:null},error:null});
  const eq = vi.fn().mockReturnValue({single});
  return {auth:{getUser:vi.fn().mockResolvedValue({data:{user:logado?{id:"dono"}:null},error:null})},from:vi.fn().mockReturnValue({select:vi.fn().mockReturnValue({eq})}),rpc};
}
beforeEach(() => { rpc.mockReset(); });
it("sem sessão não grava dados e informa expiração",async () => {
  vi.mocked(createClient).mockResolvedValue(cliente(false) as unknown as Awaited<ReturnType<typeof createClient>>);
  const r = await salvarSecaoPerfil("dados",{nome:"Ana Silva",telefone:"81999990000"});
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.erro).toMatch(/sessão/i);
  expect(rpc).not.toHaveBeenCalled();
});
it("cursor das mensagens preserva microssegundos do banco no filtro",async()=>{
  const filtro=vi.fn();
  const query={data:[],error:null,select:vi.fn(),eq:vi.fn(),order:vi.fn(),limit:vi.fn(),or:filtro};
  for(const metodo of [query.select,query.eq,query.order,query.limit,filtro]) metodo.mockReturnValue(query);
  const db=cliente(true);
  const fromPerfil=db.from;
  db.from=vi.fn().mockImplementation((t:string)=>t==="mensagens"?query:fromPerfil());
  vi.mocked(createClient).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof createClient>>);
  const r=await carregarMensagensPerfil("30000000-0000-0000-0000-000000000001",{data:"2026-11-21T12:00:00.123456+00:00",id:"40000000-0000-0000-0000-000000000001"});
  expect(r.ok).toBe(true);
  expect(filtro).toHaveBeenCalledWith("criado_em.lt.2026-11-21T12:00:00.123456+00:00,and(criado_em.eq.2026-11-21T12:00:00.123456+00:00,id.lt.40000000-0000-0000-0000-000000000001)");
});
it("normaliza no servidor, não envia dono do formulário e não simula sucesso em erro do banco",async () => {
  vi.mocked(createClient).mockResolvedValue(cliente(true) as unknown as Awaited<ReturnType<typeof createClient>>);
  rpc.mockResolvedValue({error:{code:"42P01"}});
  const r = await salvarSecaoPerfil("dados",{nome:"Ana Silva",telefone:"(81) 99999-0000",usuario_id:"terceiro"});
  expect(r.ok).toBe(false);
  expect(rpc).toHaveBeenCalledWith("salvar_perfil_completo",{operacao:"dados",dados:{nome:"Ana Silva",telefone:"81999990000",cpf:null,idade:null}});
});
