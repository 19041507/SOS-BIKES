export function Logo() {
  return (
    <span className="flex items-center gap-2 text-brand">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6h2l1.5 11.5" />
        <path d="M5.5 17.5 9 10h7l-4.5 7.5" />
        <path d="M9 10 8 7H6" />
      </svg>
      <span className="font-display text-xl font-extrabold tracking-wide">
        SOS <span className="text-ok">BIKES</span>
      </span>
    </span>
  );
}
