import sharp from "sharp";

export async function prepararFoto(bytes: Uint8Array, mime: string): Promise<Buffer> {
  if (!bytes.length || bytes.length > 5242880) throw new Error("Escolha uma imagem de até 5 MB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) throw new Error("Use uma imagem JPG, PNG ou WebP.");
  try {
    const imagem = sharp(bytes, { limitInputPixels: 40000000, failOn: "warning", animated: false });
    const meta = await imagem.metadata();
    const esperado = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[mime];
    if (meta.format !== esperado || (meta.pages ?? 1) > 1) throw new Error("formato");
    // Recodificar remove EXIF (inclusive localização), metadados e conteúdo anexado.
    return await imagem.rotate().resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true }).webp({quality:85}).toBuffer();
  } catch {
    throw new Error("Imagem inválida. Use uma imagem JPG, PNG ou WebP válida.");
  }
}
