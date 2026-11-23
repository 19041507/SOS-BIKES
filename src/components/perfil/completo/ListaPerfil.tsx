"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { carregarSecaoPerfil } from "@/app/_actions/perfil-completo";
import type { ItemPerfil, PaginaPerfil } from "@/lib/perfil-completo/types";
import { Button } from "@/components/ui/Button";

export function ListaPerfil({secao,vazio,children}:{secao:string;vazio:string;children:(item:ItemPerfil,recarregar:()=>void)=>ReactNode}) {
  const [pagina,setPagina]=useState<PaginaPerfil|null>(null);
  const [erro,setErro]=useState("");
  const [pendente,setPendente]=useState(true);
  const [consulta,setConsulta]=useState(0);
  const ocupado=useRef(false);
  const revisao=useRef(0);
  useEffect(()=>{
    let ativo=true;
    const versao=++revisao.current;
    ocupado.current=true;
    carregarSecaoPerfil(secao).then(r=>{
      if(!ativo||revisao.current!==versao) return;
      if(r.ok) setPagina(r.dados); else setErro(r.erro);
    }).catch(()=>{if(ativo&&revisao.current===versao) setErro("Não foi possível carregar a lista.");})
      .finally(()=>{if(ativo&&revisao.current===versao){ocupado.current=false;setPendente(false);}});
    return ()=>{ativo=false; revisao.current=-1;};
  },[secao,consulta]);
  async function carregarMais() {
    if(ocupado.current) return;
    ocupado.current=true;
    setPendente(true);setErro("");
    const versao=++revisao.current;
    try {
      const r=await carregarSecaoPerfil(secao,pagina?.proxima??undefined);
      if(revisao.current!==versao) return;
      if(!r.ok) {setErro(r.erro);return;}
      setPagina(p=>({proxima:r.dados.proxima,itens:[...(p?.itens??[]),...r.dados.itens.filter(i=>!p?.itens.some(a=>a.id===i.id))]}));
    } catch {if(revisao.current===versao) setErro("Não foi possível carregar a lista.");}
    finally {if(revisao.current===versao){ocupado.current=false;setPendente(false);}}
  }
  return <div className="flex min-w-0 flex-col gap-4">
    {erro&&<p role="alert" className="text-sm text-danger">{erro}</p>}
    {!pagina&&!erro&&<p role="status" className="text-sm text-muted">Carregando…</p>}
    {pagina?.itens.length===0&&!erro&&<p className="rounded-xl bg-surface p-4 text-sm text-muted">{vazio}</p>}
    {pagina&&<ul className="flex min-w-0 flex-col gap-4">{pagina.itens.map(item=><li key={item.id} className="min-w-0 rounded-xl border border-line p-4">{children(item,()=>{setPendente(true);setErro("");setConsulta(c=>c+1);})}</li>)}</ul>}
    {pagina?.proxima&&<Button variant="secondary" loading={pendente} loadingText="Carregando…" onClick={()=>void carregarMais()} className="self-start">Carregar mais</Button>}
  </div>;
}
