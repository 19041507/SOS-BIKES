import type { Perfil } from "@/lib/supabase/database.types";
import type { Oficina } from "./types";
export function pendenciasPerfil(perfil:Pick<Perfil,"nome"|"telefone"|"tipo"|"oficina">,oficina:Oficina|null):string[] {
  const faltas:string[]=[];
  if(perfil.nome.trim().length<3) faltas.push("Nome completo");
  if(!perfil.telefone) faltas.push("WhatsApp");
  // CNPJ é opcional: só cobra o nome de quem marcou que tem oficina.
  if(perfil.tipo==="mecanico"&&oficina?.vinculado&&!perfil.oficina) faltas.push("Nome da oficina");
  return faltas;
}
