-- Chat do chamado: só o ciclista e o mecânico daquele chamado leem e escrevem.

create table public.mensagens (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid not null references public.chamados (id) on delete cascade,
  autor_id uuid not null default auth.uid() references public.perfis (id),
  texto text not null check (texto = btrim(texto) and char_length(texto) between 1 and 500),
  criado_em timestamptz not null default now(),
  lida_em timestamptz
);

create index mensagens_por_chamado on public.mensagens (chamado_id, criado_em);

alter table public.mensagens enable row level security;
revoke all on public.mensagens from public, anon, authenticated;
grant select on public.mensagens to authenticated;
grant insert (chamado_id, texto) on public.mensagens to authenticated;

create policy "Participantes leem as mensagens"
  on public.mensagens for select to authenticated
  using (exists (
    select 1 from public.chamados c
    where c.id = chamado_id and (select auth.uid()) in (c.ciclista_id, c.mecanico_id)
  ));

-- A conversa abre no aceite e fecha com o atendimento; depois fica só para leitura.
create policy "Participantes escrevem durante o atendimento"
  on public.mensagens for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and exists (
      select 1 from public.chamados c
      where c.id = chamado_id
        and (select auth.uid()) in (c.ciclista_id, c.mecanico_id)
        and c.status in ('aceito', 'a_caminho', 'em_atendimento')
    )
  );

-- Marca como lidas as mensagens da outra pessoa (ninguém altera mensagens direto).
create function public.marcar_mensagens_lidas(chamado uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.mensagens m
  set lida_em = now()
  from public.chamados c
  where m.chamado_id = chamado
    and c.id = m.chamado_id
    and (select auth.uid()) in (c.ciclista_id, c.mecanico_id)
    and m.autor_id <> (select auth.uid())
    and m.lida_em is null;
$$;

revoke all on function public.marcar_mensagens_lidas(uuid) from public, anon;
grant execute on function public.marcar_mensagens_lidas(uuid) to authenticated;

alter publication supabase_realtime add table public.mensagens;
