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
