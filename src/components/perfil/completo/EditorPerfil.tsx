"use client";

import { use, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { RascunhosContexto } from "./RascunhosPerfil";
import { useRouter } from "next/navigation";
import { salvarSecaoPerfil } from "@/app/_actions/perfil-completo";
import { formatarCnpj, formatarCpf, validarOperacao } from "@/lib/perfil-completo/validacao";
import type { Json } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/Button";
import { Confirmacao } from "@/components/ui/Confirmacao";
import { useToast } from "@/components/ui/Toaster";

export type CampoEditor = {id:string;titulo:string;tipo?:"text"|"number"|"checkbox"|"cpf"|"cnpj";max?:number;obrigatorio?:boolean;soVinculado?:boolean;autoComplete?:string;placeholder?:string};
export const CAMPO_PERFIL="min-h-12 w-full min-w-0 rounded-xl border border-field bg-white px-3.5 py-2 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger";

function formatar(campo:CampoEditor,valor:string) {
  if(campo.tipo==="cpf") return formatarCpf(valor);
  if(campo.tipo==="cnpj") return formatarCnpj(valor);
  if(campo.tipo==="number") return valor.replace(/\D/g,"").slice(0,3);
  return valor;
}

export function EditorPerfil({operacao,campos,iniciais,aoSalvar,limpar=false,cnpjAnterior}: {
  operacao:string;campos:CampoEditor[];iniciais:Record<string,string>;aoSalvar:()=>void;
  limpar?:boolean;cnpjAnterior?:string|null;
}) {
  const prefixo=useId();
  const cache=use(RascunhosContexto);
  const chave=`${operacao}:${iniciais.id??"principal"}`;
  const [valores,setValores]=useState(()=>cache?.get(chave)??iniciais);
  const [erro,setErro]=useState("");
  const [trocaPendente,setTrocaPendente]=useState<Record<string,Json>|null>(null);
  const [pendente,iniciar]=useTransition();
  const ocupado=useRef(false);
  const avisar=useToast();
  const router=useRouter();
  const idErro=`${prefixo}-erro`;
  const alterado=campos.some(c=>(valores[c.id]??"")!==(iniciais[c.id]??""));

  function salvar(dados:Record<string,Json>) {
    ocupado.current=true;
    setErro("");
    setTrocaPendente(null);
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

  function enviar(evento:FormEvent) {
    evento.preventDefault();
    if(ocupado.current) return;
    const entrada:Record<string,unknown>={...valores};
    for(const campo of campos) if(campo.tipo==="checkbox") entrada[campo.id]=valores[campo.id]==="true";
    let dados;
    try { dados=validarOperacao(operacao,entrada); }
    catch(e) { setErro(e instanceof Error?e.message:"Confira os campos."); return; }
    // Mesmo CNPJ (só com outra pontuação) não é troca de oficina: endereço e fachada continuam.
    if(operacao==="oficina"&&cnpjAnterior&&(dados.cnpj!==cnpjAnterior||!dados.vinculado)) {
      setTrocaPendente({...dados,confirmar:true});
      return;
    }
    salvar(dados);
  }

  return <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
    <fieldset disabled={pendente} className="flex min-w-0 flex-col gap-4">
      {campos.filter(c=>!c.soVinculado||valores.vinculado==="true").map(c=>{
        const id=`${prefixo}-${c.id}`;
        const alterar=(valor:string)=>{
          const proximos={...valores,[c.id]:valor};
          setValores(proximos);
          cache?.set(chave,proximos);
          setErro("");
          setTrocaPendente(null);
        };
        if(c.tipo==="checkbox") return <label key={c.id} htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
          <input id={id} type="checkbox" checked={valores[c.id]==="true"} onChange={e=>alterar(String(e.target.checked))} className="size-5 shrink-0 accent-brand"/>
          {c.titulo}
        </label>;
        const numerico=c.tipo==="cpf"||c.tipo==="number";
        return <div key={c.id} className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-semibold">{c.titulo}</label>
          {/* CPF e números usam texto com teclado numérico: type="number" aceita "e" (1e2) e esconde o que foi filtrado. */}
          <input id={id} type="text" required={c.obrigatorio}
            inputMode={numerico?"numeric":undefined}
            placeholder={c.placeholder??(c.tipo==="cpf"?"000.000.000-00":c.tipo==="cnpj"?"00.000.000/0000-00":undefined)}
            value={valores[c.id]??""}
            maxLength={c.tipo==="number"?3:c.max}
            autoComplete={c.autoComplete??"off"}
            aria-invalid={erro?true:undefined}
            aria-describedby={erro?idErro:undefined}
            onChange={e=>alterar(formatar(c,e.target.value))}
            className={CAMPO_PERFIL} />
        </div>;
      })}
      {erro&&<p id={idErro} role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-danger">{erro}</p>}
      {trocaPendente&&<Confirmacao
        texto={trocaPendente.vinculado?"O CNPJ mudou: o endereço e a foto da fachada da oficina anterior serão removidos. Você poderá cadastrar os novos depois.":"Você deixará de ter oficina: nome, CNPJ, endereço e foto da fachada serão removidos."}
        confirmar="Confirmar e salvar" onConfirmar={()=>salvar(trocaPendente)} onCancelar={()=>setTrocaPendente(null)}/>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pendente} loadingText="Salvando…">Salvar</Button>
        {alterado&&!limpar&&<p className="text-[13px] text-subtle">Alterações ainda não salvas.</p>}
      </div>
    </fieldset>
  </form>;
}
