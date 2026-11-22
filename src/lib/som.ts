"use client";

/**
 * Som de aviso dentro do app (chamado novo, resposta, mensagem), gerado na hora com Web Audio:
 * não precisa de arquivo. O navegador só libera som depois de um toque na página, por isso
 * o contexto é criado/retomado no primeiro toque e reaproveitado.
 */

let contexto: AudioContext | null = null;

function obterContexto() {
  if (typeof window === "undefined") return null;
  if (!contexto) {
    const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexto) return null;
    contexto = new Contexto();
  }
  return contexto;
}

if (typeof window !== "undefined") {
  const liberar = () => {
    obterContexto()?.resume().catch(() => {});
  };
  window.addEventListener("pointerdown", liberar, { once: true, capture: true });
  window.addEventListener("keydown", liberar, { once: true, capture: true });
}

/** Duas notas curtas, como um "plim-plim". `forte` repete para chamado novo. */
export function tocarAviso(forte = false) {
  const ctx = obterContexto();
  if (!ctx) return;
  ctx.resume().catch(() => {});
  const notas = forte ? [880, 1175, 880, 1175] : [880, 1175];
  notas.forEach((frequencia, i) => {
    const inicio = ctx.currentTime + i * 0.18;
    const oscilador = ctx.createOscillator();
    const volume = ctx.createGain();
    oscilador.type = "sine";
    oscilador.frequency.value = frequencia;
    volume.gain.setValueAtTime(0.0001, inicio);
    volume.gain.exponentialRampToValueAtTime(0.25, inicio + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.16);
    oscilador.connect(volume).connect(ctx.destination);
    oscilador.start(inicio);
    oscilador.stop(inicio + 0.17);
  });
  navigator.vibrate?.(forte ? [200, 100, 200] : 120);
}
