"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { carregarSecaoPerfil } from "@/app/_actions/perfil-completo";
import type { ItemPerfil, PaginaPerfil } from "@/lib/perfil-completo/types";
import { Button } from "@/components/ui/Button";

export function ListaPerfil({secao,vazio,children}:{secao:string;vazio:string;children:(item:ItemPerfil,recarregar:()=>void)=>ReactNode}) {
  const [pagina,setPagina]=useState<PaginaPerfil|null>(null);
  const [erro,setErro]=useState("");
  const [pendente,setPendente]=useState(false);
  const [consulta,setConsulta]=useState(0);
  const ocupado=useRef(false);
  const revisao=useRef(0);
  useEffect(()=>{
    let ativo=true;
    const versao=++revisao.current;
    carregarSecaoPerfil(secao).then(r=>{
      if(!ativo||revisao.current!==versao) return;
      if(r.ok) setPagina(r.dados); else setErro(r.erro);
    }).catch(()=>{if(ativo&&revisao.current===versao) setErro("Não foi possível carregar a lista.");});
    return ()=>{ativo=false; revisao.current=-1;};
  },[secao,consulta]);
  async function carregar(mais=false) {
    if(ocupado.current) return;
    ocupado.current=true;
    setPendente(true);setErro("");
    const versao=++revisao.current;
    try {
      const r=await carregarSecaoPerfil(secao,mais?pagina?.proxima??undefined:undefined);
      if(revisao.current!==versao) return;
      if(!r.ok) {setErro(r.erro);return;}
      setPagina(p=>({proxima:r.dados.proxima,itens:mais?[...(p?.itens??[]),...r.dados.itens.filter(i=>!p?.itens.some(a=>a.id===i.id))]:r.dados.itens}));
    } catch {if(revisao.current===versao) setErro("Não foi possível carregar a lista.");}
    finally {ocupado.current=false;if(revisao.current===versao) setPendente(false);}
  }
  return <div className="flex min-w-0 flex-col gap-4">
    <Button variant="secondary" loading={pendente} onClick={()=>void carregar()} className="self-start">Atualizar lista</Button>
    {erro&&<p role="alert" className="text-sm text-danger">{erro}</p>}
    {!pagina&&!erro&&<p role="status">Carregando…</p>}
    {pagina?.itens.length===0&&!erro&&<p className="rounded-xl bg-surface p-4 text-sm text-muted">{vazio}</p>}
    {pagina&&<ul className="flex min-w-0 flex-col gap-4">{pagina.itens.map(item=><li key={item.id} className="min-w-0 rounded-xl border border-line p-4">{children(item,()=>{setErro("");setConsulta(c=>c+1);})}</li>)}</ul>}
    {pagina?.proxima&&<Button variant="secondary" loading={pendente} onClick={()=>void carregar(true)}>Carregar mais</Button>}
  </div>;
}
