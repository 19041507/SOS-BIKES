import type { Perfil } from "@/lib/supabase/database.types";

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };
export type Preferencias = { texto_ampliado: boolean; alto_contraste: boolean; reduzir_movimentos: boolean };
export type DadosPrivados = Preferencias & { usuario_id: string; cpf: string | null; idade: number | null; foto_caminho: string | null };
export type Oficina = { usuario_id: string; vinculado: boolean; cnpj: string | null; endereco: string | null; foto_caminho: string | null };
export type BasePerfil = {
  perfil: Perfil;
  privados: DadosPrivados | null;
  oficina: Oficina | null;
  fotoUrl: string | null;
  fachadaUrl: string | null;
};
export type ItemPerfil = {
  id: string; criado_em: string; nome?: string; modelo?: string; apelido?: string | null;
  cor?: string | null; foto_caminho?: string | null; fotoUrl?: string | null;
  endereco?: string; oficina?: string | null; nota?: number; comentario?: string | null;
  tipo?: string;
};
export type PaginaPerfil = { itens: ItemPerfil[]; proxima: { data: string; id: string } | null };
const comuns = [
  { id: "favoritos", titulo: "Favoritos" },
  { id: "avaliacao", titulo: "Sua avaliação" },
  { id: "acessibilidade", titulo: "Acessibilidade" },
  { id: "ajuda", titulo: "Ajuda" },
  { id: "status", titulo: "Status do perfil" },
  { id: "atividade", titulo: "Sua atividade" },
] as const;
export type SecaoPerfil = "dados" | "bicicletas" | "locais" | "oficina" | "publico" | typeof comuns[number]["id"];
export function secoesDoPerfil(tipo: Perfil["tipo"]): { id: SecaoPerfil; titulo: string }[] {
  return [
    { id: "dados", titulo: "Dados pessoais" },
    ...(tipo === "ciclista"
      ? [{ id: "bicicletas" as const, titulo: "Minhas bicicletas" }, { id: "locais" as const, titulo: "Locais" }]
      : [{ id: "oficina" as const, titulo: "Minha oficina" }, { id: "publico" as const, titulo: "Perfil público" }]),
    ...comuns.map(s => s.id === "favoritos" ? { ...s, titulo: tipo === "ciclista" ? "Mecânicos favoritos" : "Clientes favoritos" } : s),
  ];
}
