import { describe, expect, it } from "vitest";
import { emailValido, formatarTelefone, normalizarTelefone } from "@/lib/cadastro";

describe("normalizarTelefone", () => {
  it("retorna apenas os dígitos de um telefone com DDD", () => {
    expect(normalizarTelefone("(81) 99999-0000")).toBe("81999990000");
    expect(normalizarTelefone("81 3333-0000")).toBe("8133330000");
  });

  it("recusa telefones com quantidade de dígitos inválida", () => {
    expect(normalizarTelefone("9999-0000")).toBeNull();
    expect(normalizarTelefone("(81) 99999-00000")).toBeNull();
  });
});

describe("emailValido", () => {
  it("aceita e-mails válidos com espaços externos", () => {
    expect(emailValido("  pessoa@example.com  ")).toBe(true);
  });

  it("recusa e-mails sem usuário, domínio ou ponto", () => {
    expect(emailValido("pessoa")).toBe(false);
    expect(emailValido("pessoa@")).toBe(false);
    expect(emailValido("pessoa@example")).toBe(false);
  });
});

describe("formatarTelefone", () => {
  it("formata números de celular e telefone fixo", () => {
    expect(formatarTelefone("81999990000")).toBe("(81) 99999-0000");
    expect(formatarTelefone("8133330000")).toBe("(81) 3333-0000");
  });

  it("formata a digitação parcial e limita a 11 dígitos", () => {
    expect(formatarTelefone("8")).toBe("(8");
    expect(formatarTelefone("819")).toBe("(81) 9");
    expect(formatarTelefone("81999990000123")).toBe("(81) 99999-0000");
  });
});
