-- Execute somente em um banco de teste com as migrations aplicadas.
-- A transação desfaz todos os dados ao final.
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000701', 'perfil-c1@example.test', '{"nome":"Ciclista um","tipo":"ciclista"}'),
  ('00000000-0000-4000-8000-000000000702', 'perfil-c2@example.test', '{"nome":"Ciclista dois","tipo":"ciclista"}'),
  ('00000000-0000-4000-8000-000000000801', 'perfil-m1@example.test', '{"nome":"Mecânico um","tipo":"mecanico"}'),
  ('00000000-0000-4000-8000-000000000802', 'perfil-m2@example.test', '{"nome":"Mecânico dois","tipo":"mecanico"}');

update public.perfis
set especialidades = array['pneu', 'freio']::public.categoria_defeito[],
    servicos = array['Revisão geral', 'Troca de câmara'],
    bairro_regiao = 'Boa Vista'
where id = '00000000-0000-4000-8000-000000000801';

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);
set local role authenticated;
do $$ begin
  begin
    update public.perfis set servicos = array['  ']
    where id = '00000000-0000-4000-8000-000000000801';
    raise exception 'Serviços vazios não deveriam ser aceitos';
  exception when check_violation then null; end;
  begin
    update public.perfis set servicos = array[repeat('a', 81)]
    where id = '00000000-0000-4000-8000-000000000801';
    raise exception 'Serviços com mais de 80 caracteres não deveriam ser aceitos';
  exception when check_violation then null; end;
end $$;
reset role;

insert into public.chamados (id, ciclista_id, mecanico_id, categoria, endereco, status, estimativa, tempo_chegada_min, valor_final) values
  ('00000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000801', 'pneu', 'Rua de teste', 'concluido', 25, 6, 25),
  ('00000000-0000-4000-8000-000000000902', '00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000801', 'freio', 'Rua de teste', 'concluido', 30, 8, 30);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);
set local role authenticated;
insert into public.avaliacoes (chamado_id, nota, comentario, comentario_publico) values
  ('00000000-0000-4000-8000-000000000901', 5, 'Atendimento rápido e cuidadoso.', true),
  ('00000000-0000-4000-8000-000000000902', 3, 'Comentário antigo sem autorização pública.', false);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000702', true);
set local role authenticated;
do $$ begin
  assert (
    select count(*) = 1
    from public.avaliacoes_publicas_do_mecanico('00000000-0000-4000-8000-000000000801')
  ), 'Somente o comentário autorizado deve aparecer';
  assert (
    select comentario = 'Atendimento rápido e cuidadoso.'
    from public.avaliacoes_publicas_do_mecanico('00000000-0000-4000-8000-000000000801')
  ), 'O comentário público deve ser retornado sem identidade do ciclista';
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);
set local role authenticated;
insert into public.perfil_mecanico_fotos (mecanico_id, caminho, tipo, descricao)
values ('00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801/perfil/teste.webp', 'perfil', 'Foto do mecânico');
do $$ begin
  begin
    insert into public.perfil_mecanico_fotos (mecanico_id, caminho, tipo, descricao)
    values ('00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000801/outro.webp', 'trabalho', 'Foto de trabalho');
    raise exception 'Um mecânico não deveria publicar fotos em outro perfil';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);
set local role authenticated;
-- Ocultar o comentário é a única mudança permitida: nota, comentário e gorjeta ficam como foram enviados.
do $$ begin
  begin
    update public.avaliacoes set nota = 1, comentario_publico = false
    where chamado_id = '00000000-0000-4000-8000-000000000901';
    raise exception 'O ciclista não deveria alterar a nota de uma avaliação enviada';
  exception when insufficient_privilege then null; end;
  begin
    update public.avaliacoes set comentario = 'Reescrito', gorjeta = 0
    where chamado_id = '00000000-0000-4000-8000-000000000901';
    raise exception 'O ciclista não deveria alterar comentário ou gorjeta de uma avaliação enviada';
  exception when insufficient_privilege then null; end;
end $$;
update public.avaliacoes
set comentario_publico = false
where chamado_id = '00000000-0000-4000-8000-000000000901';
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000702', true);
set local role authenticated;
do $$ declare perfil record; begin
  select * into perfil
  from public.perfil_publico_mecanico('00000000-0000-4000-8000-000000000801');
  assert perfil.nome = 'Mecânico um', 'O perfil público deve retornar o mecânico';
  assert perfil.bairro_regiao = 'Boa Vista', 'A região de atendimento deve aparecer';
  assert perfil.especialidades = array['pneu', 'freio']::public.categoria_defeito[], 'As especialidades devem aparecer';
  assert perfil.servicos = array['Revisão geral', 'Troca de câmara'], 'Os serviços devem aparecer';
  assert perfil.media = 4 and perfil.avaliacoes = 2 and perfil.atendimentos = 2, 'O resumo deve contar somente avaliações e atendimentos concluídos';
  assert (select count(*) = 0 from public.avaliacoes_publicas_do_mecanico('00000000-0000-4000-8000-000000000801')), 'Comentários ocultados não devem aparecer no perfil';
  assert (select count(*) = 0 from public.perfil_publico_mecanico('00000000-0000-4000-8000-000000000701')), 'Um perfil de ciclista não deve ser retornado como mecânico';
  assert (select count(*) = 1 from public.perfil_mecanico_fotos), 'Usuários autenticados podem ver as fotos selecionadas do mecânico';
  assert (select count(*) = 0 from public.avaliacoes), 'A leitura direta de avaliações de terceiros continua protegida';
  begin
    update public.perfis set bairro_regiao = 'Centro'
    where id = '00000000-0000-4000-8000-000000000702';
    raise exception 'Um ciclista não deveria editar campos específicos de mecânico';
  exception when check_violation then null; end;
end $$;
reset role;

select set_config('request.jwt.claim.sub', '', true);
set local role anon;
do $$ begin
  begin
    perform * from public.perfil_publico_mecanico('00000000-0000-4000-8000-000000000801');
    raise exception 'Anônimos não deveriam acessar perfis públicos';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.avaliacoes_publicas_do_mecanico('00000000-0000-4000-8000-000000000801');
    raise exception 'Anônimos não deveriam acessar comentários';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.perfil_mecanico_fotos;
    raise exception 'Anônimos não deveriam listar fotos';
  exception when insufficient_privilege then null; end;
end $$;

rollback;
