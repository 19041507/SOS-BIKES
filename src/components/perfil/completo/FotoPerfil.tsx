"use client";

import Image from "next/image";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { alterarFotoPerfil } from "@/app/_actions/perfil-completo";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";

export function FotoPerfil({destino,itemId,url,aoSalvar}: {destino:"avatar"|"fachada"|"bicicleta";itemId?:string;url:string|null;aoSalvar:()=>void}) {
  const id=useId();
  const [erro,setErro]=useState("");
  const [pendente,iniciar]=useTransition();
  const ocupado=useRef(false);
  const form=useRef<HTMLFormElement>(null);
  const avisar=useToast();
  function enviar(evento?:FormEvent<HTMLFormElement>,remover=false) {
    evento?.preventDefault();
    if(ocupado.current||!form.current) return;
    if(remover&&!window.confirm("Remover esta foto?")) return;
    const dados=new FormData(form.current);
    dados.set("destino",destino);
    if(itemId) dados.set("id",itemId);
    if(remover) dados.set("remover","true");
    const arquivo=dados.get("arquivo");
    if(!remover&&(!(arquivo instanceof File)||!arquivo.size||arquivo.size>5242880)) {setErro("Escolha uma imagem de até 5 MB.");return;}
    ocupado.current=true;
    setErro("");
    iniciar(async()=>{
      try {
        const r=await alterarFotoPerfil(dados);
        if(!r.ok) {setErro(r.erro);return;}
        avisar("Foto atualizada.","sucesso");
        if(r.dados.limpezaPendente) avisar("Foto atualizada; a remoção do arquivo antigo ainda está pendente.","info");
        form.current?.reset();
        aoSalvar();
      } catch {setErro("Não foi possível confirmar a alteração. Atualize antes de tentar novamente.");}
      finally {ocupado.current=false;}
    });
  }
  const titulo=destino==="avatar"?"Foto do perfil":destino==="fachada"?"Foto da fachada da oficina":"Foto da bicicleta";
  return <form ref={form} onSubmit={enviar} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line p-4">
    <h3 className="font-semibold">{titulo}</h3>
    {url&&<Image src={url} unoptimized width={180} height={140} alt={titulo} className="max-h-40 max-w-full rounded-xl object-contain" />}
    <label htmlFor={id} className="text-sm">JPG, PNG ou WebP · até 5 MB · foto privada</label>
    <input id={id} name="arquivo" type="file" accept="image/jpeg,image/png,image/webp" disabled={pendente} className="w-full min-w-0 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-brand" />
    <div className="flex flex-wrap gap-2">
      <Button type="submit" loading={pendente}>Enviar foto</Button>
      {url&&<Button variant="danger-link" disabled={pendente} onClick={()=>enviar(undefined,true)}>Remover foto</Button>}
    </div>
    {erro&&<p role="alert" className="text-sm text-danger">{erro}</p>}
  </form>;
}
