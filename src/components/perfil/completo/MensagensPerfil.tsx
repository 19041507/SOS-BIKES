"use client";

import {useEffect,useRef,useState} from "react";
import {carregarMensagensPerfil,marcarMensagensPerfilLidas} from "@/app/_actions/perfil-completo";
import {enviarMensagem,TAMANHO_MAXIMO} from "@/lib/mensagens";
import {usePerfil} from "@/components/PerfilProvider";
import type {ItemPerfil} from "@/lib/perfil-completo/types";
import type {Mensagem} from "@/lib/supabase/database.types";
import {Button} from "@/components/ui/Button";
import {ListaPerfil} from "./ListaPerfil";
import {CAMPO_PERFIL} from "./EditorPerfil";

export function MensagensPerfil() {
  const [conversa,setConversa]=useState<ItemPerfil|null>(null);
  return <div className="flex min-w-0 flex-col gap-5">
    <p className="text-sm text-muted">Converse apenas com participantes dos seus chamados. Ao encerrar o atendimento, a conversa fica somente para leitura.</p>
    {conversa&&<section className="rounded-xl border border-brand/30 p-4" aria-label={`Conversa com ${conversa.nome}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{conversa.nome}</h3><Button variant="secondary" onClick={()=>setConversa(null)}>Fechar conversa</Button></div>
      <ConversaPerfil key={conversa.id} conversa={conversa}/>
    </section>}
    <ListaPerfil secao="mensagens" vazio="Nenhum chamado disponível para conversar.">{item=><>
      <p className="font-semibold">{item.nome}</p><p className="text-sm text-muted">{item.status?.replaceAll("_"," ")}</p>
      <Button className="mt-3" variant="secondary" onClick={()=>setConversa(item)}>Abrir conversa</Button>
    </>}</ListaPerfil>
  </div>;
}

function ConversaPerfil({conversa}:{conversa:ItemPerfil}) {
  const perfil=usePerfil();
  const [mensagens,setMensagens]=useState<Mensagem[]|null>(null);
  const [proxima,setProxima]=useState<{data:string;id:string}|null>(null);
  const [texto,setTexto]=useState("");
  const [filtro,setFiltro]=useState("todas");
  const [erro,setErro]=useState("");
  const [pendente,setPendente]=useState(false);
  const [incerto,setIncerto]=useState(false);
  const ocupado=useRef(false);
  const ativo=useRef(true);
  const revisao=useRef(0);
  const aberto=["aceito","a_caminho","em_atendimento"].includes(conversa.status??"");
  useEffect(()=>{
    ativo.current=true;
    const versao=++revisao.current;
    carregarMensagensPerfil(conversa.id).then(r=>{
      if(!ativo.current||revisao.current!==versao)return;
      if(r.ok){setMensagens(r.dados.itens);setProxima(r.dados.proxima);}else setErro(r.erro);
    }).catch(()=>{if(ativo.current)setErro("Não foi possível carregar a conversa.");});
    return()=>{ativo.current=false;revisao.current=-1;};
  },[conversa.id]);
  useEffect(()=>{
    function lerVisiveis() {
      if(document.visibilityState!=="visible")return;
      const ids=(mensagens??[]).filter(m=>m.autor_id!==perfil.id&&!m.lida_em).slice(0,50).map(m=>m.id);
      if(ids.length) void marcarMensagensPerfilLidas(ids).then(r=>{if(!r.ok&&ativo.current)setErro(r.erro);}).catch(()=>{if(ativo.current)setErro("Não foi possível confirmar a leitura.");});
    }
    lerVisiveis();document.addEventListener("visibilitychange",lerVisiveis);
    return()=>document.removeEventListener("visibilitychange",lerVisiveis);
  },[mensagens,perfil.id]);
  async function atualizar(mais=false) {
    if(ocupado.current)return;
    ocupado.current=true;setPendente(true);setErro("");
    const versao=++revisao.current;
    try {
      const r=await carregarMensagensPerfil(conversa.id,mais?proxima??undefined:undefined);
      if(!ativo.current||revisao.current!==versao)return;
      if(r.ok){setMensagens(m=>mais?[...(m??[]),...r.dados.itens.filter(n=>!m?.some(a=>a.id===n.id))]:r.dados.itens);setProxima(r.dados.proxima);setIncerto(false);}else setErro(r.erro);
    }catch{if(ativo.current)setErro("Não foi possível atualizar a conversa.");}
    finally{ocupado.current=false;if(ativo.current)setPendente(false);}
  }
  return <div className="flex min-w-0 flex-col gap-3">
    <div className="flex flex-wrap gap-2">
      <label className="flex flex-col gap-1 text-sm">Mostrar mensagens
        <select value={filtro} onChange={e=>setFiltro(e.target.value)} className={CAMPO_PERFIL}><option value="todas">Todas</option><option value="enviadas">Enviadas</option><option value="recebidas">Recebidas</option></select>
      </label>
      <Button variant="secondary" disabled={pendente} onClick={()=>void atualizar()}>Atualizar conversa</Button>
    </div>
    {erro&&<p role="alert" className="text-sm text-danger">{erro}</p>}
    {mensagens===null&&!erro&&<p role="status">Carregando mensagens…</p>}
    {proxima&&<Button variant="secondary" disabled={pendente} onClick={()=>void atualizar(true)}>Carregar mensagens anteriores</Button>}
    {mensagens?.length===0&&<p className="text-sm text-muted">Nenhuma mensagem neste atendimento.</p>}
    <ul className="flex max-h-96 min-w-0 flex-col gap-3 overflow-y-auto">
      {[...(mensagens??[])].sort((a,b)=>a.criado_em.localeCompare(b.criado_em)||a.id.localeCompare(b.id)).filter(m=>filtro==="todas"||(filtro==="enviadas"?m.autor_id===perfil.id:m.autor_id!==perfil.id)).map(m=><li key={m.id} className={`max-w-[90%] rounded-xl p-3 text-sm ${m.autor_id===perfil.id?"self-end bg-brand-soft":"self-start bg-surface"}`}>
        <p className="mb-1 font-semibold">{m.autor_id===perfil.id?"Você":conversa.nome}</p><p className="break-words whitespace-pre-wrap">{m.texto}</p><time className="text-xs text-muted" dateTime={m.criado_em}>{new Date(m.criado_em).toLocaleString("pt-BR")}{m.autor_id===perfil.id&&m.lida_em?" · Lida":""}</time>
      </li>)}
    </ul>
    {aberto?<form onSubmit={e=>{
      e.preventDefault();if(ocupado.current||incerto||!texto.trim())return;
      ocupado.current=true;setPendente(true);setErro("");
      void enviarMensagem(conversa.id,texto).then(m=>{if(ativo.current){setMensagens(lista=>[m,...(lista??[])]);setTexto("");}}).catch(()=>{if(ativo.current){setIncerto(true);setErro("Não foi possível confirmar o envio. Atualize a conversa e confira antes de tentar novamente. Seu texto foi mantido.");}}).finally(()=>{ocupado.current=false;if(ativo.current)setPendente(false);});
    }} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-semibold">Mensagem<textarea value={texto} onChange={e=>setTexto(e.target.value)} maxLength={TAMANHO_MAXIMO} rows={3} disabled={pendente} className={CAMPO_PERFIL}/></label>
      <Button type="submit" disabled={pendente||incerto||!texto.trim()} className="self-start">Enviar mensagem</Button>
    </form>:<p className="text-sm text-muted">Atendimento encerrado ou ainda não aceito: somente leitura.</p>}
  </div>;
}
