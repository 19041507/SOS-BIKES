import type { Enum } from "./supabase/database.types";

export const BUCKET_FOTOS_MECANICOS = "sos-bikes-perfis-mecanicos";
export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;

export type TipoFotoMecanico = Enum<"tipo_foto_mecanico">;
