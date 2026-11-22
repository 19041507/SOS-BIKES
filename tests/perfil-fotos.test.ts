// @vitest-environment node
import { expect, it } from "vitest";
import { prepararFoto } from "@/lib/perfil-completo/imagens";
import sharp from "sharp";

it("rejeita formato disfarçado, arquivo vazio e limite excedido", async () => {
  await expect(prepararFoto(new Uint8Array(), "image/png")).rejects.toThrow();
  await expect(prepararFoto(new TextEncoder().encode("<svg></svg>"), "image/png")).rejects.toThrow();
  await expect(prepararFoto(new Uint8Array(5242881), "image/jpeg")).rejects.toThrow(/5 MB/);
});
it("decodifica imagem real e gera WebP sem reutilizar nome do arquivo", async () => {
  const png = await sharp({create:{width:2,height:2,channels:3,background:"#205dbb"}}).png().toBuffer();
  const foto = await prepararFoto(png,"image/png");
  expect(foto.toString("ascii",0,4)).toBe("RIFF");
  expect(foto.toString("ascii",8,12)).toBe("WEBP");
});
