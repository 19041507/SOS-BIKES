"use client";

import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  listarFavoritos,
  removerFavorito,
  salvarFavorito,
  type MecanicoFavorito,
  type MecanicoParaSalvar,
} from "@/lib/favoritos";
import { usePerfil } from "./PerfilProvider";
import { useToast } from "./ui/Toaster";

type FavoritosContexto = {
  favoritos: MecanicoFavorito[];
  carregando: boolean;
  erro: string | null;
  atualizar: () => Promise<void>;
  alternar: (mecanico: MecanicoParaSalvar) => Promise<void>;
};
const Contexto = createContext<FavoritosContexto | null>(null);

function mensagem(erro: unknown) {
  return erro instanceof Error ? erro.message : "Não foi possível carregar seus favoritos.";
}

export function FavoritosProvider({ children }: { children: ReactNode }) {
  const perfil = usePerfil();
  const avisar = useToast();
  const [favoritos, setFavoritos] = useState<MecanicoFavorito[]>([]);
  const [carregando, setCarregando] = useState(perfil.tipo === "ciclista");
  const [erro, setErro] = useState<string | null>(null);

  const atualizar = useCallback(async () => {
    if (perfil.tipo !== "ciclista") return;
    setCarregando(true);
    setErro(null);
    try {
      setFavoritos(await listarFavoritos());
    } catch (e) {
      setErro(mensagem(e));
    } finally {
      setCarregando(false);
    }
  }, [perfil.tipo]);

  useEffect(() => {
    if (perfil.tipo !== "ciclista") return;
    let ativo = true;
    listarFavoritos()
      .then((lista) => { if (ativo) setFavoritos(lista); })
      .catch((e) => { if (ativo) setErro(mensagem(e)); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [perfil.id, perfil.tipo]);

  async function alternar(mecanico: MecanicoParaSalvar) {
    if (carregando || erro || perfil.tipo !== "ciclista") return;
    const salvo = favoritos.some((favorito) => favorito.id === mecanico.id);
    try {
      if (salvo) {
        await removerFavorito(perfil.id, mecanico.id);
        setFavoritos((atuais) => atuais.filter((favorito) => favorito.id !== mecanico.id));
      } else {
        await salvarFavorito(perfil.id, mecanico.id);
        const registro: MecanicoFavorito = {
          id: mecanico.id,
          nome: mecanico.nome,
          oficina: mecanico.oficina,
          disponivel: mecanico.disponivel ?? false,
          media: mecanico.media ?? null,
          avaliacoes: mecanico.avaliacoes ?? 0,
          atendimentos: mecanico.atendimentos ?? 0,
        };
        setFavoritos((atuais) => [...atuais.filter((favorito) => favorito.id !== mecanico.id), registro]);
      }
      avisar(salvo ? "Mecânico removido dos favoritos." : "Mecânico salvo nos favoritos.", "sucesso");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível atualizar o favorito.", "erro");
    }
  }

  return (
    <Contexto value={{ favoritos, carregando, erro, atualizar, alternar }}>
      {children}
    </Contexto>
  );
}

export function useFavoritos() {
  const contexto = use(Contexto);
  if (!contexto) throw new Error("useFavoritos precisa estar dentro de FavoritosProvider.");
  return contexto;
}
