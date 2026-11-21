-- Posição do mecânico só vale se for recente: o painel atualiza a cada ~4 min enquanto está
-- aberto. Mais velha que 30 min, o mecânico aparece sem distância e sem pin, em vez de num
-- lugar onde talvez não esteja mais.

create or replace function public.mecanicos_disponiveis(lat double precision default null, lng double precision default null)
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
  left join public.localizacoes_mecanicos l
    on l.mecanico_id = p.id and l.atualizado_em > now() - interval '30 minutes'
  left join public.chamados c on c.mecanico_id = p.id
  left join public.avaliacoes a on a.chamado_id = c.id
  where p.tipo = 'mecanico'
    and p.disponivel
    and p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
  group by p.id, l.latitude, l.longitude
  order by distancia_km asc nulls last, media desc nulls last, atendimentos desc, p.nome;
$$;

create or replace function public.localizacao_do_mecanico_do_chamado(chamado uuid)
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
    and c.status in ('aceito', 'a_caminho', 'em_atendimento')
    and l.atualizado_em > now() - interval '30 minutes';
$$;
