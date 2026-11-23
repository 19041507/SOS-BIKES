import { expect, it } from "vitest";
import { pendenciasPerfil } from "@/lib/perfil-completo/status";
it("documentos e fotos opcionais não geram pendência ao ciclista",()=>{
  expect(pendenciasPerfil({nome:"Ana Silva",telefone:"81999990000",tipo:"ciclista",oficina:null},null)).toEqual([]);
});
it("CNPJ nunca gera pendência; só falta o nome de quem marcou que tem oficina",()=>{
  expect(pendenciasPerfil({nome:"Lucas Silva",telefone:"81999990000",tipo:"mecanico",oficina:null},null)).toEqual([]);
  expect(pendenciasPerfil({nome:"Lucas Silva",telefone:"81999990000",tipo:"mecanico",oficina:"Oficina antiga"},null)).toEqual([]);
  const vinculadoSemNome={usuario_id:"m",vinculado:true,cnpj:null,endereco:null,foto_caminho:null};
  expect(pendenciasPerfil({nome:"Lucas Silva",telefone:"81999990000",tipo:"mecanico",oficina:null},vinculadoSemNome)).toEqual(["Nome da oficina"]);
});
