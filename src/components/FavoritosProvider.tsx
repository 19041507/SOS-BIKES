"use client";

import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { listarFavoritos, removerFavorito, salvarFavorito, type MecanicoFavorito, type MecanicoParaSalvar } from "@/lib/favoritos";
import { usePerfil } from "./PerfilProvider";
import { useToast } from "./ui/Toaster";

type FavoritosContexto = {
  favoritos: MecanicoFavorito[];
  carregando: boolean;
  erro: string | null;
  pendentes: string[];
  atualizar: () => Promise<void>;
  alternar: (mecanico: MecanicoParaSalvar) => Promise<void>;
};
const Contexto = createContext<FavoritosContexto | null>(null);

/** initialFavoritos permite explorar a prévia sem fazer chamadas ao banco. */
export function FavoritosProvider({ children, initialFavoritos, catalogoPrevia }: { children: ReactNode; initialFavoritos?: MecanicoFavorito[]; catalogoPrevia?: MecanicoFavorito[] }) {
  const perfil = usePerfil();
  const avisar = useToast();
  const [favoritos, setFavoritos] = useState<MecanicoFavorito[]>(initialFavoritos ?? []);
  const [carregando, setCarregando] = useState(initialFavoritos === undefined && perfil.tipo === "ciclista");
  const [erro, setErro] = useState<string | null>(null);
  const [pendentes, setPendentes] = useState<string[]>([]);
  const locks = useRef(new Set<string>());

  const atualizar = useCallback(async () => {
    if (initialFavoritos !== undefined || perfil.tipo !== "ciclista" || locks.current.size > 0) return;
    setCarregando(true);
    setErro(null);
    try { setFavoritos(await listarFavoritos()); }
    catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível carregar seus favoritos."); }
    finally { setCarregando(false); }
  }, [initialFavoritos, perfil.tipo]);

  useEffect(() => {
    if (initialFavoritos !== undefined || perfil.tipo !== "ciclista") return;
    let ativo = true;
    listarFavoritos()
      .then(lista => { if (ativo) setFavoritos(lista); })
      .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível carregar seus favoritos."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [initialFavoritos, perfil.id, perfil.tipo]);

  async function alternar(mecanico: MecanicoParaSalvar) {
    if (carregando || erro || locks.current.size > 0 || perfil.tipo !== "ciclista") return;
    locks.current.add(mecanico.id);
    setPendentes(ids => [...ids, mecanico.id]);
    const salvo = favoritos.some(f => f.id === mecanico.id);
    try {
      if (initialFavoritos === undefined) {
        if (salvo) await removerFavorito(perfil.id, mecanico.id);
        else await salvarFavorito(perfil.id, mecanico.id);
      }
      let registro = catalogoPrevia?.find(m => m.id === mecanico.id) ?? {
        id: mecanico.id, nome: mecanico.nome, oficina: mecanico.oficina,
        disponivel: mecanico.disponivel ?? false, media: mecanico.media ?? null,
        avaliacoes: mecanico.avaliacoes ?? 0, atendimentos: mecanico.atendimentos ?? 0,
      };
      let precisaAtualizar = false;
      if (!salvo && initialFavoritos === undefined) {
        try { registro = (await listarFavoritos()).find(m => m.id === mecanico.id) ?? registro; }
        catch { precisaAtualizar = true; }
      }
      setFavoritos(atuais => salvo ? atuais.filter(f => f.id !== mecanico.id) : [...atuais, registro]);
      avisar(precisaAtualizar ? "Mecânico salvo. Atualize a lista para verificar a disponibilidade." : salvo ? "Mecânico removido dos favoritos." : "Mecânico salvo nos favoritos.", precisaAtualizar ? "aviso" : "sucesso");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível atualizar o favorito.", "erro");
    } finally {
      locks.current.delete(mecanico.id);
      setPendentes(ids => ids.filter(id => id !== mecanico.id));
    }
  }

  return <Contexto value={{ favoritos, carregando, erro, pendentes, atualizar, alternar }}>{children}</Contexto>;
}

export function useFavoritos() {
  const contexto = use(Contexto);
  if (!contexto) throw new Error("useFavoritos precisa estar dentro de FavoritosProvider.");
  return contexto;
}
