"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * - indisponivel: navegador sem push ou ambiente sem a chave pública (ex.: dev local)
 * - instalar: iPhone/iPad fora do app instalado (o iOS só faz push no app da tela inicial)
 * - bloqueadas: a pessoa negou no navegador; só ela libera nas configurações
 * - ativadas / desativadas
 */
export type EstadoDasNotificacoes = "indisponivel" | "instalar" | "bloqueadas" | "ativadas" | "desativadas";

const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function ehIosForaDoApp() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && navigator.maxTouchPoints > 1);
  return ios && !window.matchMedia("(display-mode: standalone)").matches;
}

function suportado() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** O service worker só é registrado em produção (RegistrarServiceWorker). */
async function registro() {
  return navigator.serviceWorker.getRegistration("/");
}

export async function estadoDasNotificacoes(): Promise<EstadoDasNotificacoes> {
  if (ehIosForaDoApp()) return "instalar";
  if (!suportado() || !CHAVE_PUBLICA) return "indisponivel";
  if (Notification.permission === "denied") return "bloqueadas";
  const inscricao = await (await registro())?.pushManager.getSubscription();
  if (!inscricao || Notification.permission !== "granted") return "desativadas";
  // Uma inscrição só recebe avisos se também pertencer à conta atual no servidor.
  // O SELECT usa o RLS existente; não revela inscrições de outras pessoas.
  const { data, error } = await createClient()
    .from("inscricoes_push")
    .select("id")
    .eq("endpoint", inscricao.endpoint)
    .maybeSingle();
  if (error) throw new Error("Não foi possível consultar as notificações.");
  return data ? "ativadas" : "desativadas";
}

/** A chave VAPID vem em base64url; o PushManager quer os bytes. */
function bytesDaChave(base64: string) {
  const preenchido = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(preenchido), (letra) => letra.charCodeAt(0));
}

function mesmaChave(atual: ArrayBuffer | null, esperada: Uint8Array) {
  if (!atual) return false;
  const bytes = new Uint8Array(atual);
  return bytes.length === esperada.length && bytes.every((byte, i) => byte === esperada[i]);
}

/** Pede a permissão (precisa vir de um toque), inscreve este navegador e salva no banco. */
export async function ativarNotificacoes(): Promise<EstadoDasNotificacoes> {
  const estado = await estadoDasNotificacoes();
  if (estado !== "desativadas" && estado !== "ativadas") return estado;

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return permissao === "denied" ? "bloqueadas" : "desativadas";

  const sw = (await registro()) ?? (await navigator.serviceWorker.ready);
  const chave = bytesDaChave(CHAVE_PUBLICA!);
  let inscricao = await sw.pushManager.getSubscription();
  // Inscrição feita com outra chave (as chaves VAPID mudaram) não recebe mais nada: refaz.
  if (inscricao && !mesmaChave(inscricao.options.applicationServerKey, chave)) {
    await inscricao.unsubscribe();
    inscricao = null;
  }
  inscricao ??= await sw.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chave });
  const { endpoint, keys } = inscricao.toJSON();
  if (!endpoint || !keys?.p256dh || !keys.auth) throw new Error("Não foi possível ativar as notificações.");

  const { error } = await createClient().rpc("salvar_inscricao_push", {
    endereco: endpoint,
    chave_p256dh: keys.p256dh,
    chave_auth: keys.auth,
  });
  if (error) throw new Error("Não foi possível ativar as notificações.");
  return "ativadas";
}

/** Cancela a inscrição deste navegador e apaga do banco. */
export async function desativarNotificacoes() {
  const inscricao = await (await registro())?.pushManager.getSubscription();
  if (!inscricao) return;
  const { error } = await createClient().from("inscricoes_push").delete().eq("endpoint", inscricao.endpoint);
  if (error) throw new Error("Não foi possível desativar as notificações.");
  const cancelada = await inscricao.unsubscribe();
  if (!cancelada) throw new Error("Não foi possível desativar as notificações.");
}
