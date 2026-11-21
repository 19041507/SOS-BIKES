-- Somente em banco de teste com as migrations aplicadas. Nada é mantido após rollback.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000401', 'avaliacao-c1@example.test', '{"nome":"Ciclista um","tipo":"ciclista"}'),
  ('00000000-0000-4000-8000-000000000402', 'avaliacao-c2@example.test', '{"nome":"Ciclista dois","tipo":"ciclista"}'),
  ('00000000-0000-4000-8000-000000000501', 'avaliacao-m1@example.test', '{"nome":"Mecânico um","tipo":"mecanico"}'),
  ('00000000-0000-4000-8000-000000000502', 'avaliacao-m2@example.test', '{"nome":"Mecânico dois","tipo":"mecanico"}');
insert into public.chamados (id, ciclista_id, mecanico_id, categoria, endereco, status, estimativa, tempo_chegada_min, valor_final) values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000501', 'pneu', 'Rua de teste', 'concluido', 25, 6, 25),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000501', 'pneu', 'Rua de teste', 'aguardando', null, null, null),
  ('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000501', 'freio', 'Rua de teste', 'concluido', 30, 6, 30);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000501', true);
set local role authenticated;
do $$ begin
  begin
    insert into public.avaliacoes_ciclistas (chamado_id, nota) values ('00000000-0000-4000-8000-000000000602', 5);
    raise exception 'Atendimento aberto não deveria aceitar avaliação';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.avaliacoes_ciclistas (chamado_id, nota) values ('00000000-0000-4000-8000-000000000601', 0);
    raise exception 'Nota zero não deveria ser aceita';
  exception when check_violation then null; end;
  begin
    insert into public.avaliacoes_ciclistas (chamado_id, nota) values ('00000000-0000-4000-8000-000000000601', 6);
    raise exception 'Nota seis não deveria ser aceita';
  exception when check_violation then null; end;
end $$;
insert into public.avaliacoes_ciclistas (chamado_id, nota) values ('00000000-0000-4000-8000-000000000601', 5);
do $$ begin
  assert (select nota = 5 and comentario is null from public.avaliacoes_ciclistas), 'Comentário deve ser opcional';
  begin
    insert into public.avaliacoes_ciclistas (chamado_id, nota) values ('00000000-0000-4000-8000-000000000601', 4);
    raise exception 'Avaliação duplicada não deveria ser aceita';
  exception when unique_violation then null; end;
  begin
    update public.avaliacoes_ciclistas set nota = 1;
    raise exception 'Avaliação enviada não deveria ser editável';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000401', true);
set local role authenticated;
do $$ begin
  assert (select count(*) = 1 from public.avaliacoes_ciclistas), 'Ciclista deve ver a avaliação recebida';
  begin
    insert into public.avaliacoes_ciclistas (chamado_id, nota) values ('00000000-0000-4000-8000-000000000603', 5);
    raise exception 'Ciclista não deveria avaliar a si próprio';
  exception when insufficient_privilege then null; end;
end $$;
-- A avaliação inversa continua independente e pode ser enviada depois.
insert into public.avaliacoes (chamado_id, nota) values ('00000000-0000-4000-8000-000000000601', 4);
do $$ begin
  assert (select nota = 4 from public.avaliacoes), 'Avaliação do mecânico deve continuar funcionando';
  assert (select nota = 5 from public.avaliacoes_ciclistas), 'Uma avaliação não deve sobrescrever a outra';
end $$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000502', true);
set local role authenticated;
do $$ begin
  assert (select count(*) = 0 from public.avaliacoes_ciclistas), 'Outro mecânico não deve ler a avaliação';
  begin
    insert into public.avaliacoes_ciclistas (chamado_id, nota) values ('00000000-0000-4000-8000-000000000603', 5);
    raise exception 'Outro mecânico não deveria enviar avaliação';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000402', true);
set local role authenticated;
do $$ begin
  assert (select count(*) = 0 from public.avaliacoes_ciclistas), 'Outro ciclista não deve ler a avaliação';
end $$;
reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
do $$ begin
  begin
    perform * from public.avaliacoes_ciclistas;
    raise exception 'Anônimo não deveria ler avaliações';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
