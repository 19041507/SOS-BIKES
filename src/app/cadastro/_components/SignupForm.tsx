"use client";

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { cadastrar, type ResultadoDoCadastro } from "../../_actions/auth";
import { SENHA_MINIMA, emailValido, normalizarTelefone } from "@/lib/cadastro";

type Profile = "ciclista" | "mecanico";
type Campo = "nome" | "telefone" | "oficina" | "email" | "senha";
type Erros = Partial<Record<Campo | "geral", string>>;

const PROFILES: { id: Profile; label: string }[] = [
  { id: "ciclista", label: "Sou ciclista" },
  { id: "mecanico", label: "Sou mecânico" },
];

/** Digitação livre → "(81) 99999-0000". */
function formatarTelefone(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const inputClass =
  "h-12 w-full rounded-xl border border-field bg-white px-3.5 text-[15px] outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger";

export function SignupForm() {
  const [profile, setProfile] = useState<Profile>("ciclista");
  const [valores, setValores] = useState<Record<Campo, string>>({
    nome: "",
    telefone: "",
    oficina: "",
    email: "",
    senha: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [confirmarEmail, setConfirmarEmail] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function alterar(campo: Campo, valor: string) {
    setValores((atual) => ({ ...atual, [campo]: campo === "telefone" ? formatarTelefone(valor) : valor }));
    // O erro do campo some assim que a pessoa começa a corrigir.
    setErros((atual) => ({ ...atual, [campo]: undefined, geral: undefined }));
  }

  function validar(): Erros {
    const novos: Erros = {};
    if (valores.nome.trim().length < 3) novos.nome = "Informe seu nome.";
    if (!normalizarTelefone(valores.telefone)) novos.telefone = "Informe o WhatsApp com DDD.";
    if (!emailValido(valores.email)) novos.email = "Informe um e-mail válido.";
    if (valores.senha.length < SENHA_MINIMA) novos.senha = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
    return novos;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const novos = validar();
    setErros(novos);
    if (Object.keys(novos).length > 0) return;
    startTransition(async () => {
      // Se a conta já entra direto, a action redireciona para a área do perfil.
      const resultado: ResultadoDoCadastro = await cadastrar({ perfil: profile, ...valores });
      if ("confirmarEmail" in resultado) setConfirmarEmail(resultado.confirmarEmail);
      else setErros(resultado.erros);
    });
  }

  if (confirmarEmail) {
    return (
      <div role="status" className="flex flex-col gap-4 rounded-2xl border border-line bg-ok-soft p-6">
        <h2 className="font-display text-xl font-bold text-ok-dark">Confirme seu e-mail</h2>
        <p className="text-[15px] leading-relaxed text-ink">
          Enviamos um link de confirmação para <strong>{confirmarEmail}</strong>. Abra o e-mail e clique em
          “Confirmar meu e-mail”: você entra direto na sua conta.
        </p>
        <p className="text-sm text-muted">Não chegou? Confira a caixa de spam.</p>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-xl border border-field bg-white text-[15px] font-semibold text-ink hover:bg-surface"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  const campo = (id: Campo) => ({
    id,
    value: valores[id],
    onChange: (event: ChangeEvent<HTMLInputElement>) => alterar(id, event.target.value),
    "aria-invalid": Boolean(erros[id]),
    "aria-describedby": erros[id] ? `${id}-erro` : undefined,
  });

  const mensagem = (id: Campo) =>
    erros[id] && (
      <p id={`${id}-erro`} className="text-[13px] text-danger">
        {erros[id]}
      </p>
    );

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
        <label htmlFor="nome" className="text-sm font-semibold">Nome completo</label>
        <input {...campo("nome")} type="text" autoComplete="name" className={inputClass} />
        {mensagem("nome")}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="telefone" className="text-sm font-semibold">WhatsApp</label>
        <input
          {...campo("telefone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(81) 99999-0000"
          className={inputClass}
        />
        {mensagem("telefone")}
      </div>

      {profile === "mecanico" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="oficina" className="text-sm font-semibold">
            Oficina <span className="font-normal text-subtle">(opcional)</span>
          </label>
          <input {...campo("oficina")} type="text" autoComplete="organization" className={inputClass} />
          <p className="text-[13px] text-subtle">Deixe em branco se você atende como autônomo.</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold">E-mail</label>
        <input {...campo("email")} type="email" autoComplete="email" placeholder="voce@email.com" className={inputClass} />
        {mensagem("email")}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="text-sm font-semibold">Senha</label>
        <div className="relative">
          <input
            {...campo("senha")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className={`${inputClass} pr-12`}
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
        {erros.senha ? mensagem("senha") : <p className="text-[13px] text-subtle">Mínimo de {SENHA_MINIMA} caracteres.</p>}
      </div>

      {erros.geral && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-danger">
          {erros.geral}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-13 rounded-xl bg-brand text-base font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}
