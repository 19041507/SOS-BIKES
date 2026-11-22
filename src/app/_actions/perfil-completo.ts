"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prepararFoto } from "@/lib/perfil-completo/imagens";
import { validarOperacao, validarDataCursor, uuidValido } from "@/lib/perfil-completo/validacao";
import type { BasePerfil, ItemPerfil, PaginaPerfil, Resultado } from "@/lib/perfil-completo/types";
import type { Mensagem } from "@/lib/supabase/database.types";

class ErroPerfil extends Error {}
async function contexto() {
  const db = await createClient();
  const {data:auth,error} = await db.auth.getUser();
  if (error || !auth.user) throw new ErroPerfil("Sua sessão expirou. Entre de novo.");
  const {data:perfil,error:erroPerfil} = await db.from("perfis").select("*").eq("id",auth.user.id).single();
  if (erroPerfil || !perfil) throw new ErroPerfil("Não foi possível carregar seu perfil.");
  return {db,perfil};
}
type Contexto = Awaited<ReturnType<typeof contexto>>;
const falhou = (erro:unknown): {ok:false;erro:string} => ({ok:false,erro:erro instanceof ErroPerfil ? erro.message : "Não foi possível concluir. Confira sua conexão e tente novamente."});

async function urlFoto(ctx:Contexto,caminho:string|null) {
  if (!caminho) return null;
  if (!caminho.startsWith(`${ctx.perfil.id}/`)) throw new ErroPerfil("Referência de foto inválida.");
  const {data,error} = await ctx.db.storage.from("fotos-perfil").createSignedUrl(caminho,300);
  if (error || !data) throw new ErroPerfil("Não foi possível carregar uma foto. Atualize para tentar novamente.");
  return data.signedUrl;
}
async function limparFoto(ctx:Contexto,caminho:string|null) {
  if (!caminho || !caminho.startsWith(`${ctx.perfil.id}/`)) return true;
  try {
    const {error} = await ctx.db.storage.from("fotos-perfil").remove([caminho]);
    return !error;
  } catch { return false; }
}
function revalidar() {
  // Falha de invalidação não desfaz uma gravação já confirmada pelo banco.
  try { revalidatePath("/ciclista","layout"); revalidatePath("/mecanico","layout"); } catch { /* A interface ainda solicita router.refresh(). */ }
}

export async function carregarPerfilCompleto(): Promise<Resultado<BasePerfil>> {
  try {
    const ctx = await contexto();
    const [privado,oficina] = await Promise.all([
      ctx.db.from("perfil_privado").select("*").eq("usuario_id",ctx.perfil.id).maybeSingle(),
      ctx.db.from("oficina_privada").select("*").eq("usuario_id",ctx.perfil.id).maybeSingle(),
    ]);
    if (privado.error || oficina.error) throw new ErroPerfil("Não foi possível carregar os dados adicionais. Verifique se as migrations do perfil foram aplicadas.");
    const [fotoUrl,fachadaUrl] = await Promise.all([urlFoto(ctx,privado.data?.foto_caminho??null),urlFoto(ctx,oficina.data?.foto_caminho??null)]);
    return {ok:true,dados:{perfil:ctx.perfil,privados:privado.data,oficina:oficina.data,fotoUrl,fachadaUrl}};
  } catch (erro) { return falhou(erro); }
}

export async function carregarSecaoPerfil(secao:string,cursor?:{data:string;id:string}): Promise<Resultado<PaginaPerfil>> {
  try {
    if (!["bicicletas","locais","locais_usados","favoritos","clientes","avaliacao","mensagens","atividade"].includes(secao)) throw new ErroPerfil("Seção inválida.");
    if (cursor && (!uuidValido(cursor.id) || !Number.isFinite(Date.parse(cursor.data)))) throw new ErroPerfil("Página inválida.");
    const ctx = await contexto();
    const {data,error} = await ctx.db.rpc("listar_secao_perfil",{secao,...(cursor?{antes:cursor.data,antes_id:cursor.id}:{})});
    if (error || !Array.isArray(data) || data.some(v => !v || typeof v!=="object" || Array.isArray(v) || typeof v.id!=="string" || typeof v.criado_em!=="string")) throw new ErroPerfil("Não foi possível carregar esta lista. Tente novamente.");
    const itens = data.slice(0,50) as ItemPerfil[];
    if (secao==="bicicletas") await Promise.all(itens.map(async item => { item.fotoUrl=await urlFoto(ctx,item.foto_caminho??null); }));
    const ultimo=itens.at(-1);
    return {ok:true,dados:{itens,proxima:data.length>50&&ultimo?{data:ultimo.criado_em,id:ultimo.id}:null}};
  } catch (erro) { return falhou(erro); }
}

export async function salvarSecaoPerfil(operacao:string,entrada:unknown): Promise<Resultado<{limpezaPendente:boolean}>> {
  let dados;
  try { dados=validarOperacao(operacao,entrada); }
  catch (erro) { return {ok:false,erro:erro instanceof Error?erro.message:"Dados inválidos."}; }
  try {
    const ctx=await contexto();
    let antiga:string|null=null;
    if (operacao==="remover_bicicleta") {
      const r=await ctx.db.from("bicicletas_perfil").select("foto_caminho").eq("usuario_id",ctx.perfil.id).eq("id",String(dados.id)).single();
      if(r.error) throw new ErroPerfil("Bicicleta não encontrada.");
      antiga=r.data.foto_caminho;
    } else if(operacao==="oficina") {
      const r=await ctx.db.from("oficina_privada").select("foto_caminho,cnpj").eq("usuario_id",ctx.perfil.id).maybeSingle();
      if(r.error) throw new ErroPerfil("Não foi possível carregar a oficina.");
      if (!dados.vinculado || r.data?.cnpj!==dados.cnpj) antiga=r.data?.foto_caminho??null;
    }
    const {error}=await ctx.db.rpc("salvar_perfil_completo",{operacao,dados});
    if(error) throw new ErroPerfil(error.code==="42501"?"Você não tem permissão para esta alteração.":"Não foi possível salvar. Confira os campos e tente novamente.");
    const limpa=await limparFoto(ctx,antiga);
    revalidar();
    return {ok:true,dados:{limpezaPendente:!limpa}};
  } catch(erro) { return falhou(erro); }
}

export async function alterarFotoPerfil(form:FormData): Promise<Resultado<{limpezaPendente:boolean}>> {
  try {
    const destino=form.get("destino");
    const item=form.get("id");
    if(!["avatar","fachada","bicicleta"].includes(String(destino)) || (destino==="bicicleta"&&!uuidValido(item))) throw new ErroPerfil("Destino de foto inválido.");
    const ctx=await contexto();
    let antiga:string|null;
    if(destino==="avatar") {
      const r=await ctx.db.from("perfil_privado").select("foto_caminho").eq("usuario_id",ctx.perfil.id).maybeSingle();
      if(r.error) throw new ErroPerfil("Não foi possível consultar a foto atual.");
      antiga=r.data?.foto_caminho??null;
    } else if(destino==="fachada") {
      const r=await ctx.db.from("oficina_privada").select("foto_caminho").eq("usuario_id",ctx.perfil.id).eq("vinculado",true).single();
      if(r.error) throw new ErroPerfil("Salve o vínculo com a oficina antes de adicionar a fachada.");
      antiga=r.data.foto_caminho;
    } else {
      const r=await ctx.db.from("bicicletas_perfil").select("foto_caminho").eq("usuario_id",ctx.perfil.id).eq("id",String(item)).single();
      if(r.error) throw new ErroPerfil("Bicicleta não encontrada.");
      antiga=r.data.foto_caminho;
    }
    let nova:string|null=null;
    if(form.get("remover")!=="true") {
      const arquivo=form.get("arquivo");
      if(!(arquivo instanceof File) || arquivo.size>5242880) throw new ErroPerfil("Escolha uma imagem de até 5 MB.");
      let bytes:Buffer;
      try { bytes=await prepararFoto(new Uint8Array(await arquivo.arrayBuffer()),arquivo.type); }
      catch(erro) { throw new ErroPerfil(erro instanceof Error?erro.message:"Imagem inválida."); }
      nova=`${ctx.perfil.id}/${destino}/${crypto.randomUUID()}.webp`;
      const upload=await ctx.db.storage.from("fotos-perfil").upload(nova,bytes,{contentType:"image/webp",upsert:false});
      if(upload.error) throw new ErroPerfil("Não foi possível enviar a foto. Tente novamente.");
    }
    // Em erro de transporte o commit pode ter ocorrido: não apagar a nova foto.
    const troca=await ctx.db.rpc("trocar_foto_perfil",{destino:String(destino),item_id:destino==="bicicleta"?String(item):null,antiga,nova});
    if(troca.error || !troca.data) {
      const rollbackConfirmado=troca.error&&/^(22|23|40|42|P0)[A-Z0-9]{3}$/.test(troca.error.code??"");
      if(nova&&(!troca.error||rollbackConfirmado)) await limparFoto(ctx,nova);
      throw new ErroPerfil("Não foi possível confirmar a alteração. Atualize antes de tentar novamente.");
    }
    const limpa=await limparFoto(ctx,antiga);
    revalidar();
    return {ok:true,dados:{limpezaPendente:!limpa}};
  } catch(erro) { return falhou(erro); }
}

export async function carregarResumoAvaliacoes():Promise<Resultado<{quantidade:number;media:number|null}>> {
  try {
    const ctx=await contexto();
    const {data,error}=await ctx.db.rpc("resumo_avaliacao_perfil");
    if(error||!data||typeof data!=="object"||Array.isArray(data)||typeof data.quantidade!=="number"||(data.media!==null&&typeof data.media!=="number")) throw new ErroPerfil("Não foi possível carregar o resumo das avaliações.");
    return {ok:true,dados:{quantidade:data.quantidade,media:data.media}};
  } catch(e) {return falhou(e);}
}

export async function carregarMensagensPerfil(chamado:string,cursor?:{data:string;id:string}):Promise<Resultado<{itens:Mensagem[];proxima:{data:string;id:string}|null}>> {
  try {
    if(!uuidValido(chamado)||cursor&&(!uuidValido(cursor.id)||!Number.isFinite(Date.parse(cursor.data)))) throw new ErroPerfil("Conversa inválida.");
    const ctx=await contexto();
    const permissao=await ctx.db.from("chamados").select("id").eq("id",chamado).single();
    if(permissao.error) throw new ErroPerfil("Conversa não encontrada ou sem permissão.");
    let query=ctx.db.from("mensagens").select("*").eq("chamado_id",chamado).order("criado_em",{ascending:false}).order("id",{ascending:false}).limit(51);
    if(cursor) {
      const data=validarDataCursor(cursor.data);
      query=query.or(`criado_em.lt.${data},and(criado_em.eq.${data},id.lt.${cursor.id})`);
    }
    const {data,error}=await query;
    if(error||!data) throw new ErroPerfil("Não foi possível carregar as mensagens.");
    const itens=data.slice(0,50);
    const ultimo=itens.at(-1);
    return {ok:true,dados:{itens,proxima:data.length>50&&ultimo?{data:ultimo.criado_em,id:ultimo.id}:null}};
  } catch(e) {return falhou(e);}
}

export async function marcarMensagensPerfilLidas(ids:string[]):Promise<Resultado<null>> {
  try {
    if(!Array.isArray(ids)||ids.length>50||ids.some(id=>!uuidValido(id))) throw new ErroPerfil("Mensagens inválidas.");
    const ctx=await contexto();
    const {error}=await ctx.db.rpc("marcar_mensagens_perfil_lidas",{ids});
    if(error) throw new ErroPerfil("Não foi possível atualizar a leitura das mensagens.");
    return {ok:true,dados:null};
  } catch(e) {return falhou(e);}
}
