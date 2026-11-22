import { expect, it } from "vitest";
import { secoesDoPerfil } from "@/lib/perfil-completo/types";

it("oferece bicicletas e locais somente ao ciclista", () => {
  const ids = secoesDoPerfil("ciclista").map(s => s.id);
  expect(ids).toContain("bicicletas");
  expect(ids).toContain("locais");
  expect(ids).not.toContain("oficina");
});
it("oferece oficina somente ao mecânico e mantém as seções comuns", () => {
  const ids = secoesDoPerfil("mecanico").map(s => s.id);
  expect(ids).toContain("oficina");
  expect(ids).not.toContain("bicicletas");
  expect(ids).not.toContain("locais");
  for (const id of ["dados", "favoritos", "avaliacao", "acessibilidade", "ajuda", "status", "mensagens", "atividade"]) expect(ids).toContain(id);
});
