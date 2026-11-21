-- Uma avaliação do mecânico sobre o ciclista, independente da avaliação inversa.
create table public.avaliacoes_ciclistas (
  chamado_id uuid primary key references public.chamados(id) on delete cascade,
  nota smallint not null check (nota between 1 and 5),
  comentario text,
  criado_em timestamptz not null default now()
);

alter table public.avaliacoes_ciclistas enable row level security;
revoke all on public.avaliacoes_ciclistas from public, anon, authenticated;
grant select on public.avaliacoes_ciclistas to authenticated;
grant insert (chamado_id, nota, comentario) on public.avaliacoes_ciclistas to authenticated;

create policy "Participantes veem avaliação do ciclista"
  on public.avaliacoes_ciclistas for select to authenticated
  using (exists (
    select 1 from public.chamados c
    where c.id = chamado_id and (select auth.uid()) in (c.ciclista_id, c.mecanico_id)
  ));

create policy "Mecânico avalia ciclista após concluir"
  on public.avaliacoes_ciclistas for insert to authenticated
  with check (exists (
    select 1 from public.chamados c
    where c.id = chamado_id and c.mecanico_id = (select auth.uid())
      and c.status = 'concluido'
      and privado.tipo_do_perfil((select auth.uid())) = 'mecanico'
  ));
