import type { Perfil } from "@/lib/supabase/database.types";
import type { Oficina } from "./types";
export function pendenciasPerfil(perfil:Pick<Perfil,"nome"|"telefone"|"tipo"|"oficina">,oficina:Oficina|null):string[] {
  const faltas:string[]=[];
  if(perfil.nome.trim().length<3) faltas.push("Nome completo");
  if(!perfil.telefone) faltas.push("WhatsApp");
  if(perfil.tipo==="mecanico"&&(oficina?.vinculado??Boolean(perfil.oficina))) {
    if(!perfil.oficina) faltas.push("Nome da oficina");
    if(!oficina?.cnpj) faltas.push("CNPJ da oficina");
  }
  return faltas;
}
