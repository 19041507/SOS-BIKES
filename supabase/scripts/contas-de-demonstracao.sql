-- SOS Bikes: prepara as duas contas de demonstração e um histórico fictício entre elas.
--
-- Antes de rodar:
--   1. Aplicar a migration de supabase/migrations.
--   2. Criar as duas contas em Authentication → Users → Add user → Create new user,
--      com "Auto Confirm User" marcado.
--   3. Trocar os dois e-mails abaixo pelos que foram usados.
--
-- Rodar no SQL Editor do painel. Pode rodar mais de uma vez: o histórico só é criado
-- se as contas ainda não tiverem chamados.

do $$
declare
  email_ciclista constant text := 'ciclista@sosbikes.app';
  email_mecanico constant text := 'mecanico@sosbikes.app';
  ciclista uuid;
  mecanico uuid;
  chamado uuid;
begin
  select id into ciclista from auth.users where email = email_ciclista;
  select id into mecanico from auth.users where email = email_mecanico;

  if ciclista is null then
    raise exception 'Conta de ciclista não encontrada: %. Crie em Authentication → Users.', email_ciclista;
  end if;
  if mecanico is null then
    raise exception 'Conta de mecânico não encontrada: %. Crie em Authentication → Users.', email_mecanico;
  end if;

  -- A conta criada pelo painel nasce como ciclista; aqui cada uma recebe o perfil certo.
  update public.perfis
     set tipo = 'ciclista', nome = 'Ana Souza'
   where id = ciclista;

  update public.perfis
     set tipo = 'mecanico', nome = 'Lucas Ferreira', oficina = 'Oficina BikeFast', disponivel = false
   where id = mecanico;

  if exists (select 1 from public.chamados where ciclista_id = ciclista or mecanico_id = mecanico) then
    raise notice 'As contas já têm chamados; o histórico fictício não foi recriado.';
    return;
  end if;

  -- Concluído sem variação de preço, avaliado com 5 estrelas e gorjeta.
  insert into public.chamados (
    ciclista_id, mecanico_id, categoria, detalhes, endereco, status,
    estimativa, tempo_chegada_min, valor_final,
    criado_em, aceito_em, confirmado_em, chegada_em, concluido_em
  ) values (
    ciclista, mecanico, 'pneu', 'Pneu traseiro furou na ciclofaixa.', 'R. da Aurora, Boa Vista — Recife', 'concluido',
    25, 6, 25,
    now() - interval '6 days 2 hours', now() - interval '6 days 1 hour 59 minutes',
    now() - interval '6 days 1 hour 58 minutes', now() - interval '6 days 1 hour 51 minutes',
    now() - interval '6 days 1 hour 35 minutes'
  ) returning id into chamado;
  insert into public.avaliacoes (chamado_id, nota, comentario, gorjeta, criado_em)
  values (chamado, 5, 'Chegou rápido e resolveu na hora.', 5, now() - interval '6 days 1 hour 34 minutes');

  -- Concluído com valor final acima da estimativa.
  insert into public.chamados (
    ciclista_id, mecanico_id, categoria, detalhes, endereco, status,
    estimativa, tempo_chegada_min, valor_final, motivo_variacao,
    criado_em, aceito_em, confirmado_em, chegada_em, concluido_em
  ) values (
    ciclista, mecanico, 'corrente', 'A corrente saiu e travou.', 'Av. Conde da Boa Vista, Boa Vista — Recife', 'concluido',
    20, 8, 28, 'Foi preciso trocar um elo da corrente.',
    now() - interval '3 days 5 hours', now() - interval '3 days 4 hours 58 minutes',
    now() - interval '3 days 4 hours 57 minutes', now() - interval '3 days 4 hours 48 minutes',
    now() - interval '3 days 4 hours 30 minutes'
  ) returning id into chamado;
  insert into public.avaliacoes (chamado_id, nota, comentario, criado_em)
  values (chamado, 4, 'Bom atendimento, mas o valor subiu.', now() - interval '3 days 4 hours 29 minutes');

  -- Cancelado pelo ciclista depois de confirmar.
  insert into public.chamados (
    ciclista_id, mecanico_id, categoria, endereco, status,
    estimativa, tempo_chegada_min, motivo_cancelamento,
    criado_em, aceito_em, confirmado_em, encerrado_em
  ) values (
    ciclista, mecanico, 'freio', 'R. do Hospício, Boa Vista — Recife', 'cancelado',
    30, 12, 'Resolvi o problema sozinho',
    now() - interval '2 days 3 hours', now() - interval '2 days 2 hours 59 minutes',
    now() - interval '2 days 2 hours 58 minutes', now() - interval '2 days 2 hours 50 minutes'
  );

  -- Recusado pelo mecânico.
  insert into public.chamados (
    ciclista_id, mecanico_id, categoria, endereco, status, criado_em, encerrado_em
  ) values (
    ciclista, mecanico, 'roda', 'R. da Soledade, Boa Vista — Recife', 'recusado',
    now() - interval '1 day 6 hours', now() - interval '1 day 5 hours 59 minutes'
  );

  raise notice 'Contas prontas: % (ciclista) e % (mecânico), com 4 chamados no histórico.', email_ciclista, email_mecanico;
end;
$$;
