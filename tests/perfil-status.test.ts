import { expect, it } from "vitest";
import { pendenciasPerfil } from "@/lib/perfil-completo/status";
it("documentos e fotos opcionais não geram pendência ao ciclista",()=>{
  expect(pendenciasPerfil({nome:"Ana Silva",telefone:"81999990000",tipo:"ciclista",oficina:null},null)).toEqual([]);
});
it("autônomo não exige CNPJ; oficina antiga sem CNPJ fica incompleta sem inventar punição",()=>{
  expect(pendenciasPerfil({nome:"Lucas Silva",telefone:"81999990000",tipo:"mecanico",oficina:null},null)).toEqual([]);
  expect(pendenciasPerfil({nome:"Lucas Silva",telefone:"81999990000",tipo:"mecanico",oficina:"Oficina antiga"},null)).toContain("CNPJ da oficina");
});
