-- Favoritos pertencem ao ciclista e não dão acesso aos dados de outros usuários.
create table public.mecanicos_favoritos (
  ciclista_id uuid not null references public.perfis(id) on delete cascade,
  mecanico_id uuid not null references public.perfis(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (ciclista_id, mecanico_id),
  check (ciclista_id <> mecanico_id)
);

alter table public.mecanicos_favoritos enable row level security;
revoke all on public.mecanicos_favoritos from public, anon, authenticated;
grant select, delete on public.mecanicos_favoritos to authenticated;
grant insert (ciclista_id, mecanico_id) on public.mecanicos_favoritos to authenticated;

create policy "Ciclista vê seus favoritos"
  on public.mecanicos_favoritos for select to authenticated
  using (ciclista_id = (select auth.uid()));

create policy "Ciclista salva um mecânico"
  on public.mecanicos_favoritos for insert to authenticated
  with check (
    ciclista_id = (select auth.uid())
    and privado.tipo_do_perfil(ciclista_id) = 'ciclista'
    and privado.tipo_do_perfil(mecanico_id) = 'mecanico'
  );

create policy "Ciclista remove seus favoritos"
  on public.mecanicos_favoritos for delete to authenticated
  using (ciclista_id = (select auth.uid()));

-- Assim como mecanicos_disponiveis, expõe apenas os totais das avaliações.
-- Inclui indisponíveis para o favorito não desaparecer quando sair do plantão.
create function public.meus_mecanicos_favoritos()
returns table (
  id uuid, nome text, oficina text, disponivel boolean,
  media numeric, avaliacoes bigint, atendimentos bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.nome, p.oficina, p.disponivel,
    round(avg(a.nota), 1), count(a.nota),
    count(c.id) filter (where c.status = 'concluido')
  from public.mecanicos_favoritos f
  join public.perfis p on p.id = f.mecanico_id and p.tipo = 'mecanico'
  left join public.chamados c on c.mecanico_id = p.id
  left join public.avaliacoes a on a.chamado_id = c.id
  where f.ciclista_id = (select auth.uid())
    and privado.tipo_do_perfil((select auth.uid())) = 'ciclista'
  group by p.id
  order by p.disponivel desc, p.nome;
$$;

revoke all on function public.meus_mecanicos_favoritos() from public, anon;
grant execute on function public.meus_mecanicos_favoritos() to authenticated;

-- Confere a disponibilidade também no banco, inclusive se mudar após abrir a lista.
create policy "Novos chamados exigem mecânico disponível"
  on public.chamados as restrictive for insert to authenticated
  with check (exists (
    select 1 from public.perfis p where p.id = mecanico_id and p.disponivel
  ));
