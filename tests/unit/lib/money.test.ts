import { describe, expect, it } from "vitest";
import { formatBRL, parseBRL } from "@/lib/money";

describe("formatBRL", () => {
  it("formata valores como moeda brasileira", () => {
    expect(formatBRL(1234.56).replace(/\u00a0/g, " ")).toBe("R$ 1.234,56");
    expect(formatBRL(0).replace(/\u00a0/g, " ")).toBe("R$ 0,00");
  });
});

describe("parseBRL", () => {
  it("converte separadores brasileiros para número", () => {
    expect(parseBRL("1.234,56")).toBe(1234.56);
    expect(parseBRL("12,50")).toBe(12.5);
  });

  it("retorna zero para valores vazios ou não numéricos", () => {
    expect(parseBRL("")).toBe(0);
    expect(parseBRL("inválido")).toBe(0);
  });
});
