/** "Ana Souza" → "AS"; "Lucas" → "LU". */
export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const letras = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : partes[0].slice(0, 2);
  return letras.toUpperCase();
}

export function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0];
}

/** Links de contato a partir do telefone salvo (só dígitos, com DDD). */
export function linksDeContato(telefone: string | null) {
  if (!telefone) return null;
  return {
    whatsapp: `https://wa.me/55${telefone}`,
    ligacao: `tel:+55${telefone}`,
  };
}
