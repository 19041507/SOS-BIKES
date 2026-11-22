import type { KeyboardEvent } from "react";

const ELEMENTOS_FOCAVEIS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function conterTabNoDialogo(event: KeyboardEvent<HTMLElement>, dialogo: HTMLElement | null) {
  if (event.key !== "Tab" || !dialogo) return;

  const elementos = Array.from(dialogo.querySelectorAll<HTMLElement>(ELEMENTOS_FOCAVEIS));
  const primeiro = elementos[0];
  const ultimo = elementos[elementos.length - 1];

  if (!primeiro || !ultimo) {
    event.preventDefault();
    dialogo.focus();
    return;
  }

  if (event.shiftKey && (document.activeElement === primeiro || !dialogo.contains(document.activeElement))) {
    event.preventDefault();
    ultimo.focus();
  } else if (!event.shiftKey && (document.activeElement === ultimo || !dialogo.contains(document.activeElement))) {
    event.preventDefault();
    primeiro.focus();
  }
}
