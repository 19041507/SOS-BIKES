-- Inscrições de Web Push: um registro por navegador/aparelho que ativou as notificações.
-- O envio é feito pelo servidor (/api/notificacoes) com a chave de serviço, que ignora o RLS.

create table public.inscricoes_push (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

create index inscricoes_push_por_perfil on public.inscricoes_push (perfil_id);

alter table public.inscricoes_push enable row level security;
revoke all on public.inscricoes_push from public, anon, authenticated;
grant select, delete on public.inscricoes_push to authenticated;

create policy "Cada um vê as próprias inscrições"
  on public.inscricoes_push for select to authenticated
  using (perfil_id = (select auth.uid()));

create policy "Cada um apaga as próprias inscrições"
  on public.inscricoes_push for delete to authenticated
  using (perfil_id = (select auth.uid()));

-- Salva a inscrição deste aparelho para quem está logado. Se outra conta usou o mesmo
-- navegador antes, a inscrição passa para a conta atual (o endpoint é do navegador).
create function public.salvar_inscricao_push(endereco text, chave_p256dh text, chave_auth text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.inscricoes_push where endpoint = endereco;
  insert into public.inscricoes_push (perfil_id, endpoint, p256dh, auth)
  select (select auth.uid()), endereco, chave_p256dh, chave_auth
  where (select auth.uid()) is not null;
$$;

revoke all on function public.salvar_inscricao_push(text, text, text) from public, anon;
grant execute on function public.salvar_inscricao_push(text, text, text) to authenticated;
