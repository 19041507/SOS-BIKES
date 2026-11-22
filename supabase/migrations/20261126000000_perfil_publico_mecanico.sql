-- Perfil público do mecânico: informações profissionais, fotos selecionadas e
-- comentários de clientes publicados com autorização explícita.

create type public.tipo_foto_mecanico as enum ('perfil', 'trabalho');

create function privado.servicos_do_perfil_validos(valores text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    pg_catalog.cardinality(valores) <= 8
    and pg_catalog.array_position(valores, null) is null
    and pg_catalog.length(pg_catalog.array_to_string(valores, '')) <= 640
    and not exists (
      select 1
      from pg_catalog.unnest(valores) as servico(valor)
      where pg_catalog.length(pg_catalog.btrim(valor)) not between 1 and 80
    );
$$;

revoke all on function privado.servicos_do_perfil_validos(text[]) from public, anon;
grant execute on function privado.servicos_do_perfil_validos(text[]) to authenticated;

alter table public.perfis
  add column especialidades public.categoria_defeito[] not null default '{}',
  add column servicos text[] not null default '{}',
  add column bairro_regiao text;

alter table public.perfis
  add constraint perfil_mecanico_campos_exclusivos check (
    tipo = 'mecanico'
    or (
      cardinality(especialidades) = 0
      and cardinality(servicos) = 0
      and bairro_regiao is null
    )
  ),
  add constraint perfil_mecanico_especialidades_limite check (
    cardinality(especialidades) <= 5
  ),
  add constraint perfil_mecanico_servicos_validos check (
    privado.servicos_do_perfil_validos(servicos)
  ),
  add constraint perfil_mecanico_regiao_valida check (
    bairro_regiao is null
    or length(btrim(bairro_regiao)) between 2 and 80
  );

revoke update on public.perfis from authenticated, anon;
grant update (
  nome, telefone, oficina, disponivel, especialidades, servicos, bairro_regiao
) on public.perfis to authenticated;

create table public.perfil_mecanico_fotos (
  id uuid primary key default gen_random_uuid(),
  mecanico_id uuid not null references public.perfis(id) on delete cascade,
  caminho text not null unique,
  tipo public.tipo_foto_mecanico not null,
  descricao text not null check (length(btrim(descricao)) between 1 and 140),
  criado_em timestamptz not null default now(),
  constraint perfil_mecanico_foto_no_diretorio_proprio check (
    split_part(caminho, '/', 1) = mecanico_id::text
  )
);

create unique index perfil_mecanico_uma_foto_de_perfil
  on public.perfil_mecanico_fotos (mecanico_id)
  where tipo = 'perfil';

alter table public.perfil_mecanico_fotos enable row level security;
revoke all on public.perfil_mecanico_fotos from public, anon, authenticated;
grant select, insert, delete on public.perfil_mecanico_fotos to authenticated;
grant update (caminho, descricao) on public.perfil_mecanico_fotos to authenticated;

create policy "Usuários autenticados veem fotos de mecânicos"
  on public.perfil_mecanico_fotos for select to authenticated
  using (privado.tipo_do_perfil(mecanico_id) = 'mecanico');

create policy "Mecânico adiciona fotos ao próprio perfil"
  on public.perfil_mecanico_fotos for insert to authenticated
  with check (
    mecanico_id = (select auth.uid())
    and privado.tipo_do_perfil((select auth.uid())) = 'mecanico'
  );

create policy "Mecânico remove fotos do próprio perfil"
  on public.perfil_mecanico_fotos for delete to authenticated
  using (
    mecanico_id = (select auth.uid())
    and privado.tipo_do_perfil((select auth.uid())) = 'mecanico'
  );

create policy "Mecânico atualiza as próprias fotos"
  on public.perfil_mecanico_fotos for update to authenticated
  using (
    mecanico_id = (select auth.uid())
    and privado.tipo_do_perfil((select auth.uid())) = 'mecanico'
  )
  with check (
    mecanico_id = (select auth.uid())
    and privado.tipo_do_perfil((select auth.uid())) = 'mecanico'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sos-bikes-perfis-mecanicos',
  'sos-bikes-perfis-mecanicos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Mecânico envia fotos ao próprio diretório"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'sos-bikes-perfis-mecanicos'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and privado.tipo_do_perfil((select auth.uid())) = 'mecanico'
  );

create policy "Mecânico remove fotos do próprio diretório"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'sos-bikes-perfis-mecanicos'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and privado.tipo_do_perfil((select auth.uid())) = 'mecanico'
  );

alter table public.avaliacoes
  add column comentario_publico boolean not null default false,
  add constraint avaliacao_publica_exige_comentario check (
    not comentario_publico
    or length(btrim(coalesce(comentario, ''))) > 0
  );

grant insert (comentario_publico) on public.avaliacoes to authenticated;
grant update (comentario_publico) on public.avaliacoes to authenticated;

create policy "Ciclista controla a publicação do próprio comentário"
  on public.avaliacoes for update to authenticated
  using (comentario_publico and exists (
    select 1 from public.chamados c
    where c.id = chamado_id
      and c.ciclista_id = (select auth.uid())
      and c.status = 'concluido'
  ))
  with check (not comentario_publico and exists (
    select 1 from public.chamados c
    where c.id = chamado_id
      and c.ciclista_id = (select auth.uid())
      and c.status = 'concluido'
  ));

create function public.perfil_publico_mecanico(mecanico uuid)
returns table (
  id uuid,
  nome text,
  oficina text,
  bairro_regiao text,
  especialidades public.categoria_defeito[],
  servicos text[],
  media numeric,
  avaliacoes bigint,
  atendimentos bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.nome,
    p.oficina,
    p.bairro_regiao,
    p.especialidades,
    p.servicos,
    round(avg(a.nota), 1),
    count(a.nota),
    count(distinct c.id)
  from public.perfis p
  left join public.chamados c
    on c.mecanico_id = p.id and c.status = 'concluido'
  left join public.avaliacoes a on a.chamado_id = c.id
  where p.id = mecanico
    and p.tipo = 'mecanico'
    and (select auth.uid()) is not null
  group by p.id;
$$;

revoke all on function public.perfil_publico_mecanico(uuid) from public, anon;
grant execute on function public.perfil_publico_mecanico(uuid) to authenticated;

create function public.avaliacoes_publicas_do_mecanico(mecanico uuid)
returns table (
  nota smallint,
  comentario text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.nota, a.comentario
  from public.avaliacoes a
  join public.chamados c on c.id = a.chamado_id
  where c.mecanico_id = mecanico
    and c.status = 'concluido'
    and a.comentario_publico
    and length(btrim(coalesce(a.comentario, ''))) > 0
    and (select auth.uid()) is not null
  order by a.criado_em desc
  limit 30;
$$;

revoke all on function public.avaliacoes_publicas_do_mecanico(uuid) from public, anon;
grant execute on function public.avaliacoes_publicas_do_mecanico(uuid) to authenticated;
