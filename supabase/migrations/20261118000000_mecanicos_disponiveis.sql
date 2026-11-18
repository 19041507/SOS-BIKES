-- Lista de mecânicos disponíveis para o ciclista escolher, com a nota média e os totais.
-- É security definer porque o ciclista não pode ler as avaliações de chamados de outras
-- pessoas (RLS); a função expõe só o resumo, nunca as avaliações.

create function public.mecanicos_disponiveis()
returns table (
  id uuid,
  nome text,
  oficina text,
  telefone text,
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
    p.telefone,
    round(avg(a.nota), 1) as media,
    count(a.nota) as avaliacoes,
    count(c.id) filter (where c.status = 'concluido') as atendimentos
  from public.perfis p
  left join public.chamados c on c.mecanico_id = p.id
  left join public.avaliacoes a on a.chamado_id = c.id
  where p.tipo = 'mecanico'
    and p.disponivel
    and p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
  group by p.id
  order by media desc nulls last, atendimentos desc, p.nome;
$$;

revoke all on function public.mecanicos_disponiveis() from public, anon;
grant execute on function public.mecanicos_disponiveis() to authenticated;
