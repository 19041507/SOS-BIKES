import type { ComponentProps } from "react";

/** Superfície branca padrão das telas. */
export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`rounded-2xl border border-line bg-white p-5 sm:p-6 ${className}`} {...props} />;
}
