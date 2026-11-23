"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { usePerfil } from "@/components/PerfilProvider";
import { Button } from "@/components/ui/Button";
import { Confirmacao } from "@/components/ui/Confirmacao";
import { createClient } from "@/lib/supabase/client";
import { BUCKET_FOTOS_MECANICOS, TAMANHO_MAXIMO_FOTO, type TipoFotoMecanico } from "@/lib/perfil-mecanico";
import { iniciais } from "@/lib/pessoas";

type Foto = {
  id: string;
  caminho: string;
  tipo: TipoFotoMecanico;
  descricao: string;
  criado_em: string;
  url: string;
};

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function nomeErro(erro: unknown) {
  return erro instanceof Error ? erro.message : "Não foi possível atualizar as fotos.";
}

const DESCRICAO_MINIMA = 2;
const CLASSE_ENVIO =
  "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-field bg-white px-3 text-sm font-semibold hover:bg-surface focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2";

/** Fotos públicas do mecânico. A foto do perfil daqui também aparece no topo do site (AreaLogada). */
export function FotosDoPerfil({ aoMudarFotoDePerfil }: { aoMudarFotoDePerfil?: () => void } = {}) {
  const perfil = usePerfil();
  const router = useRouter();
  const [removendo, setRemovendo] = useState<Foto | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    const cliente = createClient();

    async function carregarFotos() {
      try {
        const { data, error: erroDaConsulta } = await cliente
          .from("perfil_mecanico_fotos")
          .select("id, caminho, tipo, descricao, criado_em")
          .eq("mecanico_id", perfil.id)
          .order("criado_em", { ascending: true });
        if (!ativo) return;
        if (erroDaConsulta) {
          setErro("Não foi possível carregar as fotos.");
          return;
        }
        setFotos(data.map((foto) => ({
          ...foto,
          tipo: foto.tipo,
          url: cliente.storage.from(BUCKET_FOTOS_MECANICOS).getPublicUrl(foto.caminho).data.publicUrl,
        })));
      } catch (e) {
        if (ativo) setErro(nomeErro(e));
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarFotos();

    return () => {
      ativo = false;
    };
  }, [perfil.id]);

  if (perfil.tipo !== "mecanico") return null;

  const fotoDePerfil = fotos.find((foto) => foto.tipo === "perfil");
  const fotosDeTrabalho = fotos.filter((foto) => foto.tipo === "trabalho");
  const descricaoPronta = descricao.trim().length >= DESCRICAO_MINIMA;

  function fotoDePerfilMudou() {
    router.refresh();
    aoMudarFotoDePerfil?.();
  }

  async function enviarFoto(event: ChangeEvent<HTMLInputElement>, tipo: TipoFotoMecanico) {
    const input = event.currentTarget;
    const arquivo = input.files?.[0];
    input.value = "";
    if (!arquivo) return;

    setErro(null);
    const extensao = EXTENSAO_POR_TIPO[arquivo.type];
    if (!extensao) {
      setErro("Use uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      setErro("A imagem deve ter no máximo 5 MB.");
      return;
    }

    const descricaoLimpa = tipo === "perfil" ? "Foto de perfil do mecânico" : descricao.trim();
    if (descricaoLimpa.length < DESCRICAO_MINIMA || descricaoLimpa.length > 140) {
      setErro("Escreva a descrição da foto (2 a 140 caracteres) antes de escolher a imagem.");
      return;
    }

    setSalvando(true);
    const cliente = createClient();
    const caminho = `${perfil.id}/${crypto.randomUUID()}.${extensao}`;
    try {
      const { error: erroUpload } = await cliente.storage
        .from(BUCKET_FOTOS_MECANICOS)
        .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
      if (erroUpload) throw new Error("Não foi possível enviar a imagem. Tente novamente.");

      if (tipo === "perfil" && fotoDePerfil) {
        const { error: erroAtualizacao } = await cliente
          .from("perfil_mecanico_fotos")
          .update({ caminho, descricao: descricaoLimpa })
          .eq("id", fotoDePerfil.id)
          .eq("mecanico_id", perfil.id);
        if (erroAtualizacao) {
          const { error: erroLimpeza } = await cliente.storage.from(BUCKET_FOTOS_MECANICOS).remove([caminho]);
          throw new Error(
            erroLimpeza
              ? "Não foi possível atualizar a foto nem limpar o novo arquivo. Tente novamente."
              : "Não foi possível atualizar a foto. Tente novamente.",
          );
        }

        const { error: erroFotoAntiga } = await cliente.storage
          .from(BUCKET_FOTOS_MECANICOS)
          .remove([fotoDePerfil.caminho]);
        setFotos((atuais) => atuais.map((foto) => foto.id === fotoDePerfil.id
          ? {
              ...foto,
              caminho,
              descricao: descricaoLimpa,
              url: cliente.storage.from(BUCKET_FOTOS_MECANICOS).getPublicUrl(caminho).data.publicUrl,
            }
          : foto));
        if (erroFotoAntiga) {
          setErro("A foto foi atualizada, mas não foi possível remover o arquivo anterior do armazenamento.");
          return;
        }
      } else {
        const { data: foto, error: erroRegistro } = await cliente
          .from("perfil_mecanico_fotos")
          .insert({
            mecanico_id: perfil.id,
            caminho,
            tipo,
            descricao: descricaoLimpa,
          })
          .select("id, caminho, tipo, descricao, criado_em")
          .single();
        if (erroRegistro || !foto) {
          const { error: erroLimpeza } = await cliente.storage.from(BUCKET_FOTOS_MECANICOS).remove([caminho]);
          throw new Error(
            erroLimpeza
              ? "Não foi possível salvar a foto nem limpar o arquivo enviado. Tente novamente."
              : "Não foi possível salvar a foto. Tente novamente.",
          );
        }
        setFotos((atuais) => [...atuais, {
          ...foto,
          tipo: foto.tipo,
          url: cliente.storage.from(BUCKET_FOTOS_MECANICOS).getPublicUrl(foto.caminho).data.publicUrl,
        }]);
      }

      if (tipo === "trabalho") setDescricao("");
      else fotoDePerfilMudou();
    } catch (e) {
      setErro(nomeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  async function removerFoto(foto: Foto) {
    if (salvando) return;
    setRemovendo(null);
    setErro(null);
    setSalvando(true);
    const cliente = createClient();
    try {
      const { error: erroRegistro } = await cliente
        .from("perfil_mecanico_fotos")
        .delete()
        .eq("id", foto.id)
        .eq("mecanico_id", perfil.id);
      if (erroRegistro) throw new Error("Não foi possível remover a foto do perfil.");

      const { error: erroArquivo } = await cliente.storage
        .from(BUCKET_FOTOS_MECANICOS)
        .remove([foto.caminho]);
      if (erroArquivo) {
        const { error: erroRestauracao } = await cliente.from("perfil_mecanico_fotos").insert({
          id: foto.id,
          mecanico_id: perfil.id,
          caminho: foto.caminho,
          tipo: foto.tipo,
          descricao: foto.descricao,
          criado_em: foto.criado_em,
        });
        if (erroRestauracao) {
          throw new Error("A foto saiu da galeria, mas o arquivo não foi removido nem o registro restaurado. Avise o responsável pelo projeto.");
        }
        throw new Error("Não foi possível remover o arquivo; a foto foi mantida no perfil.");
      }
      setFotos((atuais) => atuais.filter((atual) => atual.id !== foto.id));
      if (foto.tipo === "perfil") fotoDePerfilMudou();
    } catch (e) {
      setErro(nomeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="fotos-publicas-titulo">
      <div>
        <h3 id="fotos-publicas-titulo" className="font-semibold">Fotos do perfil e dos trabalhos</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          As imagens são públicas por URL e aparecem no seu perfil. Publique somente fotos que você tem autorização para divulgar (JPEG, PNG ou WebP, até 5 MB).
        </p>
      </div>

      {carregando && <p className="text-sm text-subtle">Carregando fotos…</p>}
      {!carregando && (
        <div className="grid gap-5 sm:grid-cols-2">
          <section className="flex flex-col gap-2" aria-labelledby="foto-perfil-titulo">
            <h4 id="foto-perfil-titulo" className="text-sm font-semibold">Foto do perfil</h4>
            <p className="text-[13px] text-subtle">Aparece no seu perfil público e no topo do site.</p>
            {fotoDePerfil ? (
              <div className="flex items-center gap-3">
                <Image
                  src={fotoDePerfil.url}
                  alt={fotoDePerfil.descricao}
                  width={80}
                  height={80}
                  unoptimized
                  className="size-20 rounded-full object-cover"
                />
                <Button variant="secondary" disabled={salvando} onClick={() => setRemovendo(fotoDePerfil)}>
                  Remover foto
                </Button>
              </div>
            ) : (
              <span className="flex size-20 items-center justify-center rounded-full bg-brand-muted font-bold text-brand" aria-hidden="true">
                {iniciais(perfil.nome)}
              </span>
            )}
            <label className={`mt-1 ${CLASSE_ENVIO}`}>
              {salvando ? "Salvando…" : fotoDePerfil ? "Substituir foto" : "Adicionar foto"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={salvando}
                onChange={(event) => void enviarFoto(event, "perfil")}
                className="sr-only"
              />
            </label>
          </section>

          <section className="flex flex-col gap-2" aria-labelledby="fotos-trabalho-titulo">
            <h4 id="fotos-trabalho-titulo" className="text-sm font-semibold">Fotos dos trabalhos</h4>
            <label htmlFor="descricao-foto-trabalho" className="text-[13px] text-subtle">Descrição da próxima foto</label>
            <input
              id="descricao-foto-trabalho"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              maxLength={140}
              placeholder="Ex.: Troca de corrente"
              aria-describedby="descricao-foto-trabalho-ajuda"
              className="h-11 rounded-xl border border-field px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <p id="descricao-foto-trabalho-ajuda" className="text-[13px] text-subtle">Escreva a descrição antes de escolher a imagem.</p>
            <label className={`${CLASSE_ENVIO} ${descricaoPronta ? "" : "cursor-not-allowed opacity-60"}`}>
              {salvando ? "Salvando…" : "Adicionar foto de trabalho"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={salvando || !descricaoPronta}
                onChange={(event) => void enviarFoto(event, "trabalho")}
                className="sr-only"
              />
            </label>
            {fotosDeTrabalho.length > 0 && (
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {fotosDeTrabalho.map((foto) => (
                  <li key={foto.id} className="rounded-xl border border-line p-2">
                    <Image
                      src={foto.url}
                      alt={foto.descricao}
                      width={320}
                      height={240}
                      unoptimized
                      className="aspect-[4/3] w-full rounded-lg object-cover"
                    />
                    <p className="mt-1 break-words text-xs text-muted">{foto.descricao}</p>
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => setRemovendo(foto)}
                      className="mt-1 min-h-11 rounded px-2 text-xs font-semibold text-danger hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      Remover foto
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {removendo && (
        <Confirmacao
          texto={removendo.tipo === "perfil" ? "Remover a foto do perfil? Ela sai do seu perfil público e do topo do site." : `Remover a foto “${removendo.descricao}” do seu perfil público?`}
          confirmar="Remover foto"
          onConfirmar={() => void removerFoto(removendo)}
          onCancelar={() => setRemovendo(null)}
        />
      )}
      {erro && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{erro}</p>}
    </section>
  );
}
