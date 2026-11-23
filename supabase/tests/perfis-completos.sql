begin;
insert into auth.users(id,email,raw_user_meta_data) values
('10000000-0000-0000-0000-000000000001','c1@example.test','{"nome":"Ciclista Um","tipo":"ciclista"}'),
('10000000-0000-0000-0000-000000000002','c2@example.test','{"nome":"Ciclista Dois","tipo":"ciclista"}'),
('20000000-0000-0000-0000-000000000001','m1@example.test','{"nome":"Mecanico Um","tipo":"mecanico","oficina":"Oficina antiga"}'),
('20000000-0000-0000-0000-000000000002','m2@example.test','{"nome":"Mecanico Dois","tipo":"mecanico"}');
create function pg_temp.exigir(condicao boolean, mensagem text) returns void language plpgsql as $$
begin if condicao is not true then raise exception '%',mensagem; end if; end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
set local role authenticated;
-- "dados" grava só CPF e idade: nome e WhatsApp são do formulário de perfil (atualizarPerfil).
select public.salvar_perfil_completo('dados','{"nome":"Nome Atualizado","telefone":"81999990000","cpf":"52998224725","idade":25}');
select pg_temp.exigir((select nome='Ciclista Um' from public.perfis where id=auth.uid()),'dados privados nao alteram o nome');
select pg_temp.exigir((select cpf='52998224725' from public.perfil_privado),'salva CPF privado');
select public.salvar_perfil_completo('bicicleta','{"modelo":"Caloi","apelido":"Azul","cor":"Azul"}');
select public.salvar_perfil_completo('local','{"nome":"Casa","endereco":"Rua de exemplo 123"}');
select pg_temp.exigir((select count(*)=1 from public.bicicletas_perfil),'bicicleta persistida');
select pg_temp.exigir(jsonb_array_length(public.listar_secao_perfil('bicicletas'))=1,'listagem real de bicicletas');
do $$ begin
  perform public.salvar_perfil_completo('oficina','{"vinculado":false}');
  raise exception 'ciclista editou oficina';
exception when insufficient_privilege then null; end $$;
do $$ begin
  perform public.salvar_perfil_completo('dados','{"nome":"Nao Gravar","telefone":"81999990000","cpf":"11111111111"}');
  raise exception 'CPF invalido aceito';
exception when check_violation then null; end $$;
select pg_temp.exigir((select cpf='52998224725' from public.perfil_privado),'erro preserva CPF anterior');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
select pg_temp.exigir((select count(*)=0 from public.perfil_privado),'terceiro nao le CPF');
select pg_temp.exigir((select count(*)=0 from public.bicicletas_perfil),'terceiro nao le bicicleta');
select pg_temp.exigir((select count(*)=0 from public.locais_perfil),'terceiro nao le local');
select pg_temp.exigir(jsonb_array_length(public.listar_secao_perfil('bicicletas'))=0,'RPC nao revela bicicleta alheia');
do $$ begin
  insert into storage.objects(bucket_id,name) values('fotos-perfil','10000000-0000-0000-0000-000000000001/avatar/00000000-0000-0000-0000-000000000001.png');
  raise exception 'upload para terceiro permitido';
exception when insufficient_privilege then null; end $$;
do $$ begin
  insert into public.perfil_privado(usuario_id,cpf) values(auth.uid(),'52998224725');
  raise exception 'escrita direta indevida';
exception when insufficient_privilege then null; end $$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',true);
select public.salvar_perfil_completo('dados','{"nome":"Mecanico Um","telefone":"81999990000","idade":40}');
-- Quem registra oficina informa nome e CNPJ válido; autônomo não precisa.
do $$ begin
  perform public.salvar_perfil_completo('oficina','{"vinculado":true,"nome":"Oficina teste","cnpj":""}');
  raise exception 'vinculado sem CNPJ aceito';
exception when check_violation then null; end $$;
do $$ begin
  perform public.salvar_perfil_completo('oficina','{"vinculado":true,"nome":"Oficina teste","cnpj":"11222333000180"}');
  raise exception 'CNPJ invalido aceito';
exception when check_violation then null; end $$;
select pg_temp.exigir((select oficina='Oficina antiga' from public.perfis where id=auth.uid()),'erro preserva o nome da oficina');
select public.salvar_perfil_completo('oficina','{"vinculado":true,"nome":"Oficina teste","cnpj":"11222333000181","endereco":"Rua oficina 123"}');
select pg_temp.exigir((select cnpj='11222333000181' from public.oficina_privada),'oficina salva');
select pg_temp.exigir((select oficina='Oficina teste' from public.perfis where id=auth.uid()),'nome da oficina salvo');
do $$ begin
  perform public.salvar_perfil_completo('oficina','{"vinculado":false}');
  raise exception 'removeu oficina sem confirmacao';
exception when check_violation then null; end $$;
select public.salvar_perfil_completo('oficina','{"vinculado":false,"confirmar":true}');
select pg_temp.exigir((select cnpj is null and not vinculado from public.oficina_privada),'autonomo sem CNPJ');
select pg_temp.exigir((select oficina is null from public.perfis where id=auth.uid()),'autonomo aparece sem oficina');
do $$ begin
  perform public.salvar_perfil_completo('cliente_favorito','{"id":"10000000-0000-0000-0000-000000000002","salvar":true}');
  raise exception 'cliente sem chamado favoritado';
exception when insufficient_privilege then null; end $$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',true);
select pg_temp.exigir((select count(*)=0 from public.oficina_privada),'outro mecanico nao le oficina');
select pg_temp.exigir((select count(*)=0 from public.atividade_perfil),'outro usuario nao le atividade');
reset role;
insert into public.chamados(id,ciclista_id,mecanico_id,categoria,endereco,status,estimativa,tempo_chegada_min,valor_final) values
('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','pneu','Endereco teste 123','concluido',30,10,30),
('30000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','pneu','Endereco teste 456','expirado',null,null,null);
set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',true);
select pg_temp.exigir(jsonb_array_length(public.listar_secao_perfil('clientes'))=1,'clientes: so atendimentos concluidos');
select public.salvar_perfil_completo('cliente_favorito','{"id":"10000000-0000-0000-0000-000000000001","salvar":true}');
select pg_temp.exigir(jsonb_array_length(public.listar_secao_perfil('favoritos'))=1,'favorito de chamado proprio salvo');
select pg_temp.exigir(jsonb_array_length(public.listar_secao_perfil('clientes'))=0,'cliente ja salvo sai da lista para adicionar');
do $$ begin
  perform public.salvar_perfil_completo('cliente_favorito','{"id":"10000000-0000-0000-0000-000000000002","salvar":true}');
  raise exception 'favoritou cliente de chamado expirado';
exception when insufficient_privilege then null; end $$;
do $$ begin
  insert into public.mensagens(chamado_id,texto) values('30000000-0000-0000-0000-000000000001','Mensagem indevida');
  raise exception 'favorito liberou mensagem em chamado concluido';
exception when insufficient_privilege then null; end $$;
select pg_temp.exigir((select count(*)=0 from public.perfil_privado where usuario_id='10000000-0000-0000-0000-000000000001'),'participante nao le CPF do outro');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
insert into storage.objects(bucket_id,name) values('fotos-perfil','10000000-0000-0000-0000-000000000001/avatar/00000000-0000-0000-0000-000000000001.png');
select pg_temp.exigir(public.trocar_foto_perfil('avatar',null,null,'10000000-0000-0000-0000-000000000001/avatar/00000000-0000-0000-0000-000000000001.png'),'vincula foto propria');
select pg_temp.exigir(not public.trocar_foto_perfil('avatar',null,null,null),'comparacao protege foto concorrente');
delete from storage.objects where bucket_id='fotos-perfil';
select pg_temp.exigir((select count(*)=1 from storage.objects),'foto referenciada nao removida');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
select pg_temp.exigir((select count(*)=0 from storage.objects),'foto alheia nao visivel');
do $$ begin
  perform public.trocar_foto_perfil('avatar',null,null,'10000000-0000-0000-0000-000000000001/avatar/00000000-0000-0000-0000-000000000001.png');
  raise exception 'foto alheia referenciada';
exception when insufficient_privilege then null; end $$;
reset role;
select pg_temp.exigir(public.resumo_avaliacao_perfil() is not null,'resumo real de notas');
insert into public.chamados(id,ciclista_id,mecanico_id,categoria,endereco,status,estimativa,tempo_chegada_min) values
('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','pneu','Outro endereco teste','aceito',30,10);
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
insert into public.mensagens(chamado_id,texto) values
('30000000-0000-0000-0000-000000000002','Primeira mensagem'),
('30000000-0000-0000-0000-000000000002','Segunda mensagem');
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',true);
select pg_temp.exigir((select count(*)=0 from public.mensagens),'terceiro nao le chat');
reset role;
select pg_temp.exigir(not (select public from storage.buckets where id='fotos-perfil'),'bucket privado');
select pg_temp.exigir(not public.documento_perfil_valido('11111111111','cpf'),'CPF repetido recusado');
select pg_temp.exigir(public.documento_perfil_valido('12ABC34501DE35','cnpj'),'CNPJ alfanumerico valido');
select pg_temp.exigir(not has_table_privilege('anon','public.perfil_privado','select'),'anonimo sem acesso');
select pg_temp.exigir(not has_function_privilege('anon','public.salvar_perfil_completo(text,jsonb)','execute'),'anonimo sem RPC');
insert into public.bicicletas_perfil(id,usuario_id,modelo)
select ('50000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001','Bicicleta teste '||i from generate_series(1,60) i;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select pg_temp.exigir(jsonb_array_length(public.listar_secao_perfil('bicicletas'))=51,'primeira pagina inclui sentinela');
select pg_temp.exigir(jsonb_array_length(public.listar_secao_perfil('bicicletas',
  (public.listar_secao_perfil('bicicletas')->49->>'criado_em')::timestamptz,
  (public.listar_secao_perfil('bicicletas')->49->>'id')::uuid))=11,'segunda pagina sem perda em datas iguais');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $$ begin
  perform public.salvar_perfil_completo('remover_bicicleta','{"id":"50000000-0000-0000-0000-000000000001"}');
  raise exception 'terceiro removeu bicicleta por ID';
exception when insufficient_privilege then null; end $$;
reset role;
select pg_temp.exigir((select count(*)=1 from public.bicicletas_perfil where id='50000000-0000-0000-0000-000000000001'),'bicicleta alheia preservada');
rollback;

-- A ampliação não pode impedir a exclusão administrativa de conta sem chamados.
begin;
insert into auth.users(id,email,raw_user_meta_data) values('60000000-0000-0000-0000-000000000001','excluir@example.test','{"nome":"Conta para excluir","tipo":"ciclista"}');
select set_config('request.jwt.claim.sub','60000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select public.salvar_perfil_completo('bicicleta','{"modelo":"Teste de cascata"}');
reset role;
delete from auth.users where id='60000000-0000-0000-0000-000000000001';
do $$ begin
  if exists(select 1 from public.bicicletas_perfil where usuario_id='60000000-0000-0000-0000-000000000001') then raise exception 'cascata nao removeu bicicletas'; end if;
end $$;
rollback;
