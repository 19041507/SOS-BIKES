"use client";
import {createContext,useState,type ReactNode} from "react";
export const RascunhosContexto=createContext<Map<string,Record<string,string>>|null>(null);
/** Rascunhos sensíveis ficam só na memória da página, nunca no Storage do navegador. */
export function RascunhosPerfil({children}:{children:ReactNode}) {
  const [cache]=useState(()=>new Map<string,Record<string,string>>());
  return <RascunhosContexto value={cache}>{children}</RascunhosContexto>;
}
