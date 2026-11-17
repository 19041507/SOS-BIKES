"use client";

import { useState, useTransition, type FormEvent } from "react";
import { entrar } from "../_actions/auth";

type Profile = "ciclista" | "mecanico";

const PROFILES: { id: Profile; label: string }[] = [
  { id: "ciclista", label: "Sou ciclista" },
  { id: "mecanico", label: "Sou mecânico" },
];

export function LoginForm() {
  const [profile, setProfile] = useState<Profile>("ciclista");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Informe um e-mail válido.";
    if (!password) nextErrors.password = "Informe sua senha.";
    setErrors(nextErrors);
    setLoginError(null);
    if (Object.keys(nextErrors).length > 0) return;
    startTransition(async () => {
      // Em caso de sucesso, a action redireciona para a área do perfil.
      const result = await entrar({ email, senha: password, perfil: profile });
      setLoginError(result.erro);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <fieldset className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        <legend className="sr-only">Perfil</legend>
        {PROFILES.map((option) => {
          const selected = profile === option.id;
          return (
            <label
              key={option.id}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-lg text-[15px] font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                selected ? "bg-white text-brand shadow-sm" : "text-subtle hover:text-ink"
              }`}
            >
              <input
                type="radio"
                name="profile"
                value={option.id}
                checked={selected}
                onChange={() => setProfile(option.id)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="h-12 rounded-xl border border-field bg-white px-3.5 text-[15px] outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger"
        />
        {errors.email && <p id="email-error" className="text-[13px] text-danger">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold">Senha</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="h-12 w-full rounded-xl border border-field bg-white pr-12 pl-3.5 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-subtle hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="m3 3 18 18" />}
            </svg>
          </button>
        </div>
        {errors.password && <p id="password-error" className="text-[13px] text-danger">{errors.password}</p>}
      </div>

      {loginError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-danger">
          {loginError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-13 rounded-xl bg-brand text-base font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
