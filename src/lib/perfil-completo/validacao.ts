import type { Json } from "@/lib/supabase/database.types";

export function uuidValido(id: unknown): id is string {
  return typeof id === "string" && /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id);
}
/** Receita Federal: módulo 11, caracteres do CNPJ convertidos por ASCII - 48. */
export function validarDocumento(entrada: unknown, especie: "cpf" | "cnpj"): string | null | false {
  if (entrada == null || entrada === "") return null;
  if (typeof entrada !== "string" || /[^a-z0-9. /-]/i.test(entrada)) return false;
  const valor = entrada.toUpperCase().replace(/[. /-]/g, "");
  if (!(especie === "cpf" ? /^\d{11}$/ : /^[A-Z0-9]{12}\d{2}$/).test(valor) || /^(\d)\1+$/.test(valor)) return false;
  const inicio = especie === "cpf" ? 9 : 12;
  for (let etapa = inicio; etapa <= inicio + 1; etapa++) {
    let soma = 0;
    if (especie === "cpf") {
      for (let i = 0; i < etapa; i++) soma += Number(valor[i]) * (etapa + 1 - i);
      const dv = (soma * 10) % 11;
      if ((dv === 10 ? 0 : dv) !== Number(valor[etapa])) return false;
    } else {
      let peso = 2;
      for (let i = etapa - 1; i >= 0; i--) {
        soma += (valor.charCodeAt(i) - 48) * peso;
        peso = peso === 9 ? 2 : peso + 1;
      }
      const resto = soma % 11;
      if ((resto < 2 ? 0 : 11 - resto) !== Number(valor[etapa])) return false;
    }
  }
  return valor;
}

function texto(valor: unknown, campo: string, min: number, max: number) {
  if (typeof valor !== "string" || valor.trim().length < min || valor.trim().length > max) throw new Error(`${campo}: use entre ${min} e ${max} caracteres.`);
  return valor.trim();
}
function id(valor: unknown) {
  if (!uuidValido(valor)) throw new Error("Identificador inválido.");
  return valor;
}
export function validarOperacao(operacao: string, entrada: unknown): Record<string, Json> {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) throw new Error("Dados inválidos.");
  const d = entrada as Record<string, unknown>;
  switch (operacao) {
    case "dados": {
      // Nome e WhatsApp são salvos por atualizarPerfil (regras do cadastro); aqui só os dados privados.
      const cpf = validarDocumento(d.cpf, "cpf");
      if (cpf === false) throw new Error("Informe um CPF válido.");
      const valor = d.idade == null ? "" : String(d.idade);
      if (valor && (!/^\d+$/.test(valor) || Number(valor) < 1 || Number(valor) > 120)) throw new Error("A idade deve ser entre 1 e 120.");
      return { cpf, idade: valor ? Number(valor) : null };
    }
    case "oficina": {
      if (typeof d.vinculado !== "boolean") throw new Error("Informe o vínculo com a oficina.");
      if (!d.vinculado) return { vinculado: false, cnpj: null, confirmar: d.confirmar === true };
      // CNPJ é opcional (o nome da oficina continua livre em Dados pessoais); se vier, precisa ser válido.
      const cnpj = validarDocumento(d.cnpj, "cnpj");
      if (cnpj === false) throw new Error("Informe um CNPJ válido ou deixe em branco.");
      return { vinculado: true, cnpj, endereco: d.endereco ? texto(d.endereco, "Endereço", 5, 200) : null, confirmar: d.confirmar === true };
    }
    case "bicicleta":
      return { id: d.id ? id(d.id) : null, modelo: texto(d.modelo, "Modelo", 1, 100), apelido: d.apelido ? texto(d.apelido, "Apelido", 1, 80) : null, cor: d.cor ? texto(d.cor, "Cor", 1, 40) : null };
    case "local":
      return { id: d.id ? id(d.id) : null, nome: texto(d.nome, "Nome do local", 1, 80), endereco: texto(d.endereco, "Endereço", 5, 200) };
    case "remover_bicicleta":
    case "remover_local": return { id: id(d.id) };
    case "cliente_favorito":
      if (typeof d.salvar !== "boolean") throw new Error("Informe a ação do favorito.");
      return { id: id(d.id), salvar: d.salvar };
    case "preferencias": {
      if ([d.texto_ampliado, d.alto_contraste, d.reduzir_movimentos].some(v => typeof v !== "boolean")) throw new Error("Preferências inválidas.");
      return { texto_ampliado: d.texto_ampliado as boolean, alto_contraste: d.alto_contraste as boolean, reduzir_movimentos: d.reduzir_movimentos as boolean };
    }
    default: throw new Error("Operação inválida.");
  }
}
