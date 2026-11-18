import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "success" | "secondary" | "danger" | "danger-link";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-[#a9bcd8]",
  success: "bg-ok text-white hover:bg-ok-dark disabled:bg-[#a9bcd8]",
  secondary: "border border-field bg-white text-ink hover:bg-surface disabled:opacity-60",
  danger: "bg-danger text-white hover:bg-red-800 disabled:bg-red-300",
  "danger-link": "text-danger hover:underline disabled:opacity-60",
};

const SIZES: Record<Size, string> = {
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-6 text-base",
};

type Common = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
};

function classes({ variant = "primary", size = "md", fullWidth, className = "" }: Common) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`;
}

type ButtonProps = Common &
  Omit<ComponentProps<"button">, "className"> & {
    /** Mostra o texto de carregamento e desabilita o botão */
    loading?: boolean;
    loadingText?: ReactNode;
  };

export function Button({ variant, size, fullWidth, className, loading, loadingText, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading && (
        <span className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" aria-hidden="true" />
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

type ButtonLinkProps = Common & Omit<ComponentProps<typeof Link>, "className">;

export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={classes({ variant, size, fullWidth, className })} {...props} />;
}
