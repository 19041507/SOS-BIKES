import Link from "next/link";

export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Informações legais" className={`flex flex-wrap items-center justify-center gap-x-4 text-xs text-subtle ${className}`}>
      <Link href="/termos" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded px-1 hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand sm:min-h-8">Termos de uso<span className="sr-only"> (abre em nova aba)</span></Link>
      <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded px-1 hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand sm:min-h-8">Política de privacidade<span className="sr-only"> (abre em nova aba)</span></Link>
    </nav>
  );
}
