import { beforeEach, expect, it, vi } from "vitest";
import { atualizarPerfil } from "@/app/_actions/perfil";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const update = vi.fn();
beforeEach(() => {
  update.mockReset().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const single = vi.fn().mockResolvedValue({ data: { tipo: "mecanico" }, error: null });
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "dono" } } }) },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }) }), update }),
  } as unknown as Awaited<ReturnType<typeof createClient>>);
});

it("formulário de contato do mecânico não apaga região, especialidades e serviços", async () => {
  expect(await atualizarPerfil({ nome: "Lucas Silva", telefone: "(81) 99999-0000" })).toEqual({ ok: true });
  expect(update).toHaveBeenCalledWith({ nome: "Lucas Silva", telefone: "81999990000" });
});

it("formulário do perfil público grava região, especialidades e serviços", async () => {
  await atualizarPerfil({ nome: "Lucas Silva", telefone: "81999990000", bairro_regiao: "Boa Vista", especialidades: ["pneu"], servicos: "Revisão" });
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ bairro_regiao: "Boa Vista", especialidades: ["pneu"], servicos: ["Revisão"] }));
});
