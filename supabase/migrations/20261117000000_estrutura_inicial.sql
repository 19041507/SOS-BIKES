-- SOS Bikes: estrutura inicial do banco.
-- Perfis ligados ao Supabase Auth, chamados com regras de transição de status e avaliações.

-- Tipos -----------------------------------------------------------------------

create type public.tipo_perfil as enum ('ciclista', 'mecanico');

create type public.categoria_defeito as enum ('pneu', 'corrente', 'freio', 'roda', 'selim');

-- Fluxo: aguardando → aceito → a_caminho → em_atendimento → concluido
-- Encerramentos antecipados: recusado (mecânico), cancelado (ciclista), expirado (sem resposta).
create type public.status_chamado as enum (
  'aguardando',
  'aceito',
  'a_caminho',
  'em_atendimento',
  'concluido',
  'recusado',
  'cancelado',
  'expirado'
);

-- Perfis ----------------------------------------------------------------------

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  tipo public.tipo_perfil not null default 'ciclista',
  nome text not null check (length(trim(nome)) > 0),
  telefone text,
  -- Só para mecânico: nome da oficina; vazio = mecânico autônomo.
  oficina text,
  disponivel boolean not null default false,
  criado_em timestamptz not null default now()
);

comment on table public.perfis is 'Dados públicos de ciclistas e mecânicos, um por usuário do Auth.';

-- Cria o perfil automaticamente quando um usuário se cadastra.
-- Os dados vêm de options.data no signUp: { nome, tipo, telefone, oficina }.
create function public.criar_perfil_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, tipo, telefone, oficina)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'tipo')::public.tipo_perfil, 'ciclista'),
    new.raw_user_meta_data ->> 'telefone',
    new.raw_user_meta_data ->> 'oficina'
  );
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_do_usuario();

-- Chamados --------------------------------------------------------------------

create table public.chamados (
  id uuid primary key default gen_random_uuid(),
  ciclista_id uuid not null references public.perfis (id),
  mecanico_id uuid not null references public.perfis (id),
  categoria public.categoria_defeito not null,
  detalhes text,
  endereco text not null,
  status public.status_chamado not null default 'aguardando',

  -- Informados pelo mecânico ao aceitar.
  estimativa numeric(10, 2) check (estimativa > 0),
  tempo_chegada_min integer check (tempo_chegada_min > 0),

  -- Informados pelo mecânico ao concluir. A comissão da plataforma é 10% do valor final.
  valor_final numeric(10, 2) check (valor_final > 0),
  comissao numeric(10, 2) generated always as (round(valor_final * 0.10, 2)) stored,
  motivo_variacao text,

  motivo_cancelamento text,

  criado_em timestamptz not null default now(),
  aceito_em timestamptz,
  confirmado_em timestamptz,
  chegada_em timestamptz,
  concluido_em timestamptz,
  encerrado_em timestamptz,

  constraint chamado_entre_pessoas_diferentes check (ciclista_id <> mecanico_id),
  constraint aceito_com_estimativa check (
    status in ('aguardando', 'recusado', 'expirado')
    or (status = 'cancelado' and aceito_em is null)
    or (estimativa is not null and tempo_chegada_min is not null)
  ),
  constraint concluido_com_valor_final check (status <> 'concluido' or valor_final is not null),
  constraint variacao_com_motivo check (
    valor_final is null
    or valor_final = estimativa
    or length(trim(coalesce(motivo_variacao, ''))) > 0
  ),
  constraint cancelado_com_motivo check (
    status <> 'cancelado' or length(trim(coalesce(motivo_cancelamento, ''))) > 0
  )
);

comment on table public.chamados is 'Pedidos de socorro do ciclista para um mecânico escolhido por ele.';

create index chamados_ciclista_idx on public.chamados (ciclista_id, criado_em desc);
create index chamados_mecanico_idx on public.chamados (mecanico_id, criado_em desc);

-- Um ciclista só pode ter um chamado em andamento por vez.
create unique index chamados_um_ativo_por_ciclista
  on public.chamados (ciclista_id)
  where status in ('aguardando', 'aceito', 'a_caminho', 'em_atendimento');

-- Valida quem pode mudar o status e para qual, e preenche os horários.
-- Só vale para usuários logados: o SQL Editor do painel (sem auth.uid()) não passa por aqui.
create function public.validar_mudanca_de_chamado()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
  de text := old.status::text;
  para text := new.status::text;
begin
  if usuario is null then
    return new;
  end if;

  if new.ciclista_id <> old.ciclista_id
    or new.mecanico_id <> old.mecanico_id
    or new.categoria <> old.categoria
    or new.endereco <> old.endereco
    or new.detalhes is distinct from old.detalhes
    or new.criado_em <> old.criado_em then
    raise exception 'Os dados do pedido não podem ser alterados depois de criado.';
  end if;

  if de = para then
    raise exception 'O chamado já está como %.', de;
  end if;

  if usuario = old.ciclista_id then
    if not (
      (de = 'aguardando' and para in ('cancelado', 'expirado'))
      or (de = 'aceito' and para in ('a_caminho', 'cancelado'))
      or (de in ('a_caminho', 'em_atendimento') and para = 'cancelado')
    ) then
      raise exception 'O ciclista não pode mudar o chamado de % para %.', de, para;
    end if;
    if new.estimativa is distinct from old.estimativa
      or new.tempo_chegada_min is distinct from old.tempo_chegada_min
      or new.valor_final is distinct from old.valor_final
      or new.motivo_variacao is distinct from old.motivo_variacao then
      raise exception 'Só o mecânico informa preço, tempo e valor final.';
    end if;
  elsif usuario = old.mecanico_id then
    if not (
      (de = 'aguardando' and para in ('aceito', 'recusado', 'expirado'))
      or (de = 'a_caminho' and para = 'em_atendimento')
      or (de = 'em_atendimento' and para = 'concluido')
    ) then
      raise exception 'O mecânico não pode mudar o chamado de % para %.', de, para;
    end if;
    if new.motivo_cancelamento is distinct from old.motivo_cancelamento then
      raise exception 'Só o ciclista informa o motivo do cancelamento.';
    end if;
    if para <> 'aceito' and (
      new.estimativa is distinct from old.estimativa
      or new.tempo_chegada_min is distinct from old.tempo_chegada_min
    ) then
      raise exception 'A estimativa só pode ser informada ao aceitar o chamado.';
    end if;
    if para <> 'concluido' and (
      new.valor_final is distinct from old.valor_final
      or new.motivo_variacao is distinct from old.motivo_variacao
    ) then
      raise exception 'O valor final só pode ser informado ao concluir o chamado.';
    end if;
  else
    raise exception 'Somente o ciclista e o mecânico do chamado podem alterá-lo.';
  end if;

  case para
    when 'aceito' then new.aceito_em := now();
    when 'a_caminho' then new.confirmado_em := now();
    when 'em_atendimento' then new.chegada_em := now();
    when 'concluido' then new.concluido_em := now();
    else new.encerrado_em := now();
  end case;

  return new;
end;
$$;

create trigger ao_alterar_chamado
  before update on public.chamados
  for each row execute function public.validar_mudanca_de_chamado();

-- Avaliações ------------------------------------------------------------------

create table public.avaliacoes (
  chamado_id uuid primary key references public.chamados (id) on delete cascade,
  nota smallint not null check (nota between 1 and 5),
  comentario text,
  -- Só registrada: a gorjeta é paga diretamente ao mecânico.
  gorjeta numeric(10, 2) check (gorjeta >= 0),
  criado_em timestamptz not null default now()
);

comment on table public.avaliacoes is 'Avaliação do ciclista sobre um chamado concluído (uma por chamado).';

-- Segurança (RLS) -------------------------------------------------------------

-- Funções usadas pelas políticas. Ficam no schema "privado", que a API não expõe,
-- e rodam como security definer: perfis e chamados se consultam nas políticas, e sem
-- isso o Postgres entra em recursão infinita.
create schema privado;
grant usage on schema privado to authenticated;

create function privado.tipo_do_perfil(perfil uuid)
returns public.tipo_perfil
language sql
stable
security definer
set search_path = ''
as $$
  select tipo from public.perfis where id = perfil;
$$;

-- O usuário logado tem algum chamado com essa pessoa?
create function privado.tem_chamado_com(perfil uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.chamados c
    where (c.ciclista_id = auth.uid() and c.mecanico_id = perfil)
       or (c.mecanico_id = auth.uid() and c.ciclista_id = perfil)
  );
$$;

revoke all on all functions in schema privado from public;
grant execute on all functions in schema privado to authenticated;

alter table public.perfis enable row level security;
alter table public.chamados enable row level security;
alter table public.avaliacoes enable row level security;

-- Perfis: cada um vê o próprio; todos os logados veem os mecânicos (para escolher);
-- e quem participa de um chamado vê o perfil da outra pessoa (nome e telefone para contato).
create policy "Ver perfis permitidos"
  on public.perfis for select to authenticated
  using (
    id = (select auth.uid())
    or tipo = 'mecanico'
    or privado.tem_chamado_com(id)
  );

create policy "Editar o próprio perfil"
  on public.perfis for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- O tipo do perfil não pode ser trocado pelo próprio usuário.
revoke update on public.perfis from authenticated, anon;
grant update (nome, telefone, oficina, disponivel) on public.perfis to authenticated;

-- Chamados: só o ciclista e o mecânico do chamado veem e alteram.
create policy "Ver os próprios chamados"
  on public.chamados for select to authenticated
  using ((select auth.uid()) in (ciclista_id, mecanico_id));

create policy "Ciclista abre chamado para um mecânico"
  on public.chamados for insert to authenticated
  with check (
    ciclista_id = (select auth.uid())
    and status = 'aguardando'
    and estimativa is null
    and valor_final is null
    and privado.tipo_do_perfil(ciclista_id) = 'ciclista'
    and privado.tipo_do_perfil(mecanico_id) = 'mecanico'
  );

create policy "Participantes atualizam o chamado"
  on public.chamados for update to authenticated
  using ((select auth.uid()) in (ciclista_id, mecanico_id))
  with check ((select auth.uid()) in (ciclista_id, mecanico_id));

-- Avaliações: o ciclista avalia o próprio chamado concluído; os dois participantes veem.
create policy "Ver avaliações dos próprios chamados"
  on public.avaliacoes for select to authenticated
  using (
    exists (
      select 1 from public.chamados c
      where c.id = chamado_id and (select auth.uid()) in (c.ciclista_id, c.mecanico_id)
    )
  );

create policy "Ciclista avalia chamado concluído"
  on public.avaliacoes for insert to authenticated
  with check (
    exists (
      select 1 from public.chamados c
      where c.id = chamado_id and c.ciclista_id = (select auth.uid()) and c.status = 'concluido'
    )
  );

-- Tempo real ------------------------------------------------------------------

-- O ciclista e o mecânico recebem as mudanças de status ao vivo (respeitando o RLS).
alter publication supabase_realtime add table public.chamados;
