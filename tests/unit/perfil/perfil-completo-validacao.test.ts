import { expect, it } from "vitest";
import { formatarCnpj, formatarCpf, validarOperacao, validarDocumento } from "@/lib/perfil-completo/validacao";

it("valida CPF e CNPJ numerico/alfanumerico sem aceitar repetidos ou DV errado", () => {
  expect(validarDocumento("529.982.247-25", "cpf")).toBe("52998224725");
  expect(validarDocumento("11111111111", "cpf")).toBe(false);
  expect(validarDocumento("11.222.333/0001-81", "cnpj")).toBe("11222333000181");
  expect(validarDocumento("12.ABC.345/01DE-35", "cnpj")).toBe("12ABC34501DE35");
  expect(validarDocumento("12ABC34501DE34", "cnpj")).toBe(false);
});
it("dados privados: só CPF e idade (nome e WhatsApp ficam no formulário de perfil)", () => {
  expect(validarOperacao("dados", { nome:" Ana Silva ", telefone:"(81) 99999-0000", cpf:"", idade:"" }))
    .toEqual({ cpf:null, idade:null });
  expect(validarOperacao("dados", { cpf:"529.982.247-25", idade:"30" })).toEqual({ cpf:"52998224725", idade:30 });
  expect(() => validarOperacao("dados", { idade:"121" })).toThrow(/idade/i);
  expect(() => validarOperacao("dados", { cpf:"111.111.111-11" })).toThrow(/CPF/);
});
it("autônomo não precisa de CNPJ; quem registra oficina informa nome e CNPJ válido", () => {
  expect(validarOperacao("oficina", { vinculado:false })).toMatchObject({vinculado:false,cnpj:null});
  expect(() => validarOperacao("oficina", { vinculado:true, nome:"Oficina", cnpj:"" })).toThrow(/CNPJ/);
  expect(() => validarOperacao("oficina", { vinculado:true, nome:"Oficina", cnpj:"11.222.333/0001-80" })).toThrow(/CNPJ/);
  expect(() => validarOperacao("oficina", { vinculado:true, nome:"", cnpj:"11.222.333/0001-81" })).toThrow(/oficina/i);
  expect(validarOperacao("oficina", { vinculado:true, nome:" BikeFast ", cnpj:"11.222.333/0001-81" }))
    .toMatchObject({ nome:"BikeFast", cnpj:"11222333000181" });
});
it("recusa operacoes, IDs e campos de colecao invalidos", () => {
  expect(() => validarOperacao("qualquer", {})).toThrow();
  expect(() => validarOperacao("remover_bicicleta", {id:"outro"})).toThrow();
  expect(() => validarOperacao("bicicleta", {modelo:""})).toThrow();
  expect(() => validarOperacao("preferencias", {alto_contraste:"true"})).toThrow();
});
it("CPF: só números, até 11, formatado enquanto digita", () => {
  expect(formatarCpf("abc529")).toBe("529");
  expect(formatarCpf("5299822")).toBe("529.982.2");
  expect(formatarCpf("529.982.247-25 extra 99")).toBe("529.982.247-25");
  expect(formatarCpf("")).toBe("");
});

it("formata CNPJ numérico e alfanumérico enquanto digita", () => {
  expect(formatarCnpj("11222333000181")).toBe("11.222.333/0001-81");
  expect(formatarCnpj("12abc34501de35")).toBe("12.ABC.345/01DE-35");
  expect(formatarCnpj("112")).toBe("11.2");
});
it("campo obrigatório vazio pede para preencher, sem falar em caracteres", () => {
  expect(() => validarOperacao("bicicleta", {modelo:"  "})).toThrow("Preencha o campo Modelo da bicicleta.");
});
