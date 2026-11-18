const CORES = ["#1d5fbf", "#178045", "#e5a50a", "#5fd08f", "#dce8f8"];

// Posições fixas (sem aleatoriedade) para o resultado ser igual no servidor e no navegador.
const PECAS = Array.from({ length: 18 }, (_, i) => ({
  esquerda: 6 + ((i * 37) % 88),
  atraso: (i % 6) * 70,
  giro: (i * 47) % 360,
  cor: CORES[i % CORES.length],
  largura: i % 3 === 0 ? 10 : 7,
}));

/** Confetes nas cores da marca, uma vez só. Some com "reduzir movimento". */
export function Confetes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-2 h-40 overflow-hidden motion-reduce:hidden">
      {PECAS.map((peca, i) => (
        <span
          key={i}
          className="confete absolute top-0 block h-2.5 rounded-sm"
          style={{
            left: `${peca.esquerda}%`,
            width: peca.largura,
            backgroundColor: peca.cor,
            animationDelay: `${peca.atraso}ms`,
            rotate: `${peca.giro}deg`,
          }}
        />
      ))}
    </div>
  );
}
