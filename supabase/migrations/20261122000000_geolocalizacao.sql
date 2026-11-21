-- Geolocalização: local do chamado (GPS do ciclista) e posição dos mecânicos disponíveis.

-- Local do chamado ---------------------------------------------------------------

-- Opcional: sem GPS, o chamado continua só com o endereço digitado.
alter table public.chamados
  add column latitude double precision check (latitude between -90 and 90),
  add column longitude double precision check (longitude between -180 and 180),
  add constraint chamados_latitude_e_longitude_juntas check ((latitude is null) = (longitude is null));

create function public.impedir_mudanca_de_local()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null
    and (new.latitude is distinct from old.latitude or new.longitude is distinct from old.longitude) then
    raise exception 'O local do pedido não pode ser alterado depois de criado.';
  end if;
  return new;
end;
$$;

create trigger ao_alterar_local_do_chamado
  before update on public.chamados
  for each row execute function public.impedir_mudanca_de_local();

-- Posição dos mecânicos ----------------------------------------------------------

-- Ninguém lê esta tabela direto: a posição só sai arredondada pelas funções abaixo.
create table public.localizacoes_mecanicos (
  mecanico_id uuid primary key references public.perfis (id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  atualizado_em timestamptz not null default now()
);

alter table public.localizacoes_mecanicos enable row level security;
revoke all on public.localizacoes_mecanicos from public, anon, authenticated;

create function public.atualizar_minha_localizacao(lat double precision, lng double precision)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if privado.tipo_do_perfil((select auth.uid())) is distinct from 'mecanico' then
    raise exception 'Só mecânicos salvam a localização.';
  end if;
  insert into public.localizacoes_mecanicos (mecanico_id, latitude, longitude, atualizado_em)
  values ((select auth.uid()), lat, lng, now())
  on conflict (mecanico_id) do update
    set latitude = excluded.latitude, longitude = excluded.longitude, atualizado_em = excluded.atualizado_em;
end;
$$;

revoke all on function public.atualizar_minha_localizacao(double precision, double precision) from public, anon;
grant execute on function public.atualizar_minha_localizacao(double precision, double precision) to authenticated;

-- Para o ciclista animar o mecânico a caminho: posição aproximada (~100 m), só durante o chamado.
create function public.localizacao_do_mecanico_do_chamado(chamado uuid)
returns table (latitude double precision, longitude double precision)
language sql
stable
security definer
set search_path = ''
as $$
  select round(l.latitude::numeric, 3)::double precision, round(l.longitude::numeric, 3)::double precision
  from public.chamados c
  join public.localizacoes_mecanicos l on l.mecanico_id = c.mecanico_id
  where c.id = chamado
    and c.ciclista_id = (select auth.uid())
    and c.status in ('aceito', 'a_caminho', 'em_atendimento');
$$;

revoke all on function public.localizacao_do_mecanico_do_chamado(uuid) from public, anon;
grant execute on function public.localizacao_do_mecanico_do_chamado(uuid) to authenticated;

-- Lista de mecânicos com distância -----------------------------------------------

-- A assinatura muda (recebe a posição do ciclista), então a função é recriada.
drop function public.mecanicos_disponiveis();

-- Com a posição do ciclista, ordena pela distância em linha reta (haversine);
-- sem ela, mantém a ordem por nota. A posição do mecânico sai arredondada (~100 m).
create function public.mecanicos_disponiveis(lat double precision default null, lng double precision default null)
returns table (
  id uuid,
  nome text,
  oficina text,
  telefone text,
  media numeric,
  avaliacoes bigint,
  atendimentos bigint,
  latitude double precision,
  longitude double precision,
  distancia_km numeric
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
    p.telefone,
    round(avg(a.nota), 1) as media,
    count(a.nota) as avaliacoes,
    count(c.id) filter (where c.status = 'concluido') as atendimentos,
    round(l.latitude::numeric, 3)::double precision as latitude,
    round(l.longitude::numeric, 3)::double precision as longitude,
    round((6371 * 2 * asin(sqrt(
      power(sin(radians(l.latitude - lat) / 2), 2)
      + cos(radians(lat)) * cos(radians(l.latitude)) * power(sin(radians(l.longitude - lng) / 2), 2)
    )))::numeric, 1) as distancia_km
  from public.perfis p
  left join public.localizacoes_mecanicos l on l.mecanico_id = p.id
  left join public.chamados c on c.mecanico_id = p.id
  left join public.avaliacoes a on a.chamado_id = c.id
  where p.tipo = 'mecanico'
    and p.disponivel
    and p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
  group by p.id, l.latitude, l.longitude
  order by distancia_km asc nulls last, media desc nulls last, atendimentos desc, p.nome;
$$;

revoke all on function public.mecanicos_disponiveis(double precision, double precision) from public, anon;
grant execute on function public.mecanicos_disponiveis(double precision, double precision) to authenticated;
