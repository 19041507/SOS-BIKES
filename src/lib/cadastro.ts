// Regras do cadastro usadas no formulário (navegador) e na action (servidor).

export const SENHA_MINIMA = 6;

/** Só os dígitos do telefone, se tiver DDD + 8 ou 9 dígitos; senão null. */
export function normalizarTelefone(telefone: string) {
  const digitos = telefone.replace(/\D/g, "");
  return digitos.length === 10 || digitos.length === 11 ? digitos : null;
}

export function emailValido(email: string) {
  return /^\S+@\S+\.\S+$/.test(email.trim());
}

/** "81999990000" ou digitação livre → "(81) 99999-0000". */
export function formatarTelefone(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
