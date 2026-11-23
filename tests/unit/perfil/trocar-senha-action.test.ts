import { beforeEach, expect, it, vi } from "vitest";
import { trocarSenha } from "@/app/_actions/auth";

const { servidor, isolado } = vi.hoisted(() => ({ servidor: vi.fn(), isolado: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: servidor }));
vi.mock("@supabase/supabase-js", () => ({ createClient: isolado }));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfigurado: true, supabaseCredenciais: () => ({url:"https://example.supabase.co",publishableKey:"public-test-key"}) }));
beforeEach(() => { servidor.mockReset(); isolado.mockReset(); });

it("reautenticação divergente não modifica a sessão principal nem a senha", async () => {
  let identidadePrincipal = "dono";
  const updateUser = vi.fn();
  const signInPrincipal = vi.fn(async () => { identidadePrincipal = "outro"; return {data:{user:{id:"outro"}},error:null}; });
  servidor.mockResolvedValue({auth:{getUser:async()=>({data:{user:{id:identidadePrincipal,email:"dono@example.test"}},error:null}),signInWithPassword:signInPrincipal,updateUser}});
  const signInIsolado = vi.fn(async () => ({data:{user:{id:"outro"}},error:null}));
  isolado.mockReturnValue({auth:{signInWithPassword:signInIsolado}});
  expect("erro" in await trocarSenha({atual:"atual123",nova:"nova123"})).toBe(true);
  expect(identidadePrincipal).toBe("dono");
  expect(signInPrincipal).not.toHaveBeenCalled();
  expect(updateUser).not.toHaveBeenCalled();
});
it("sucesso atualiza pela sessão original e a reautenticação não persiste cookies", async () => {
  const updateUser = vi.fn(async () => ({data:{user:{id:"dono"}},error:null}));
  const signInPrincipal = vi.fn();
  servidor.mockResolvedValue({auth:{getUser:async()=>({data:{user:{id:"dono",email:"dono@example.test"}},error:null}),signInWithPassword:signInPrincipal,updateUser}});
  isolado.mockReturnValue({auth:{signInWithPassword:async()=>({data:{user:{id:"dono"}},error:null})}});
  expect(await trocarSenha({atual:"atual123",nova:"nova123"})).toEqual({ok:true});
  expect(signInPrincipal).not.toHaveBeenCalled();
  expect(isolado).toHaveBeenCalledWith("https://example.supabase.co","public-test-key",{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  expect(updateUser).toHaveBeenCalledWith({password:"nova123"});
});
