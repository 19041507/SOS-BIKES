"use client";

import { use, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { RascunhosContexto } from "./RascunhosPerfil";
import { useRouter } from "next/navigation";
import { salvarSecaoPerfil } from "@/app/_actions/perfil-completo";
import { validarOperacao } from "@/lib/perfil-completo/validacao";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";

export type CampoEditor = {id:string;titulo:string;tipo?:"text"|"tel"|"number"|"checkbox"|"password";max?:number;obrigatorio?:boolean;soVinculado?:boolean};
export const CAMPO_PERFIL="min-h-12 w-full min-w-0 rounded-xl border border-field bg-white px-3.5 py-2 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function EditorPerfil({operacao,campos,iniciais,aoSalvar,limpar=false,cnpjAnterior}: {
  operacao:string;campos:CampoEditor[];iniciais:Record<string,string>;aoSalvar:()=>void;
  limpar?:boolean;cnpjAnterior?:string|null;
}) {
  const prefixo=useId();
  const cache=use(RascunhosContexto);
  const chave=`${operacao}:${iniciais.id??"principal"}`;
  const [valores,setValores]=useState(()=>cache?.get(chave)??iniciais);
  const [erro,setErro]=useState("");
  const [pendente,iniciar]=useTransition();
  const ocupado=useRef(false);
  const avisar=useToast();
  const router=useRouter();
  function enviar(evento:FormEvent) {
    evento.preventDefault();
    if(ocupado.current) return;
    const entrada:Record<string,unknown>={...valores};
    for(const campo of campos) if(campo.tipo==="checkbox") entrada[campo.id]=valores[campo.id]==="true";
    let dados;
    try { dados=validarOperacao(operacao,entrada); }
    catch(e) { setErro(e instanceof Error?e.message:"Confira os campos."); return; }
    if(operacao==="oficina"&&cnpjAnterior&&(dados.cnpj!==cnpjAnterior||!dados.vinculado)) {
      if(!window.confirm("Remover os dados da oficina anterior? Endereço e fachada serão removidos. Você poderá cadastrar os novos depois.")) return;
      dados.confirmar=true;
    }
    ocupado.current=true;
    setErro("");
    iniciar(async()=>{
      try {
        const r=await salvarSecaoPerfil(operacao,dados);
        if(!r.ok) { setErro(r.erro); return; }
        avisar("Dados salvos.","sucesso");
        cache?.delete(chave);
        if(r.dados.limpezaPendente) avisar("Os dados foram salvos, mas uma foto antiga ainda aguarda limpeza.","info");
        if(limpar) setValores(iniciais);
        aoSalvar();
        router.refresh();
      } catch { setErro("Não foi possível confirmar o salvamento. Atualize antes de tentar novamente."); }
      finally { ocupado.current=false; }
    });
  }
  return <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
    <fieldset disabled={pendente} className="flex min-w-0 flex-col gap-4">
      {campos.filter(c=>!c.soVinculado||valores.vinculado==="true").map(c=>{
        const id=`${prefixo}-${c.id}`;
        return <div key={c.id} className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-semibold">{c.titulo}</label>
          <input id={id} type={c.tipo??"text"} required={c.obrigatorio}
            checked={c.tipo==="checkbox"?valores[c.id]==="true":undefined}
            value={c.tipo==="checkbox"?undefined:valores[c.id]??""}
            maxLength={c.max} min={c.tipo==="number"?1:undefined} max={c.tipo==="number"?120:undefined}
            autoComplete={c.id==="nome"?"name":c.id==="telefone"?"tel": "off"}
            onChange={e=>{
              const valor=c.tipo==="checkbox"?String(e.target.checked):e.target.value;
              const proximos={...valores,[c.id]:valor,...(c.id==="cnpj"&&cnpjAnterior?{endereco:""}:{})};
              setValores(proximos);
              cache?.set(chave,proximos);
              setErro("");
            }} className={c.tipo==="checkbox"?"size-6 accent-brand":CAMPO_PERFIL} />
        </div>;
      })}
      <Button type="submit" loading={pendente} loadingText="Salvando…" className="self-start">Salvar</Button>
    </fieldset>
    {erro&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-danger">{erro}</p>}
  </form>;
}
