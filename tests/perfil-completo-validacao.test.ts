import { expect, it } from "vitest";
import { validarOperacao, validarDocumento } from "@/lib/perfil-completo/validacao";

it("valida CPF e CNPJ numerico/alfanumerico sem aceitar repetidos ou DV errado", () => {
  expect(validarDocumento("529.982.247-25", "cpf")).toBe("52998224725");
  expect(validarDocumento("11111111111", "cpf")).toBe(false);
  expect(validarDocumento("11.222.333/0001-81", "cnpj")).toBe("11222333000181");
  expect(validarDocumento("12.ABC.345/01DE-35", "cnpj")).toBe("12ABC34501DE35");
  expect(validarDocumento("12ABC34501DE34", "cnpj")).toBe(false);
});
it("normaliza dados pessoais e preserva documentos opcionais", () => {
  expect(validarOperacao("dados", { nome:" Ana Silva ", telefone:"(81) 99999-0000", cpf:"", idade:"" }))
    .toEqual({ nome:"Ana Silva", telefone:"81999990000", cpf:null, idade:null });
  expect(() => validarOperacao("dados", { nome:"Ana", telefone:"81999990000", idade:"121" })).toThrow(/idade/i);
});
it("exige CNPJ somente com oficina vinculada", () => {
  expect(validarOperacao("oficina", { vinculado:false })).toMatchObject({vinculado:false,cnpj:null});
  expect(() => validarOperacao("oficina", { vinculado:true,nome:"Oficina",cnpj:"" })).toThrow(/CNPJ/);
});
it("recusa operacoes, IDs e campos de colecao invalidos", () => {
  expect(() => validarOperacao("qualquer", {})).toThrow();
  expect(() => validarOperacao("remover_bicicleta", {id:"outro"})).toThrow();
  expect(() => validarOperacao("bicicleta", {modelo:""})).toThrow();
  expect(() => validarOperacao("preferencias", {alto_contraste:"true"})).toThrow();
});
