-- Execute somente em um banco de teste com as migrations aplicadas.
-- Os dados e as alterações de sessão são desfeitos no final.
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000101', 'favoritos-c1@example.test', '{"nome":"Ciclista um","tipo":"ciclista"}'),
  ('00000000-0000-4000-8000-000000000102', 'favoritos-c2@example.test', '{"nome":"Ciclista dois","tipo":"ciclista"}'),
  ('00000000-0000-4000-8000-000000000201', 'favoritos-m1@example.test', '{"nome":"Mecânico um","tipo":"mecanico"}'),
  ('00000000-0000-4000-8000-000000000202', 'favoritos-m2@example.test', '{"nome":"Mecânico dois","tipo":"mecanico"}');
update public.perfis set disponivel = true where id = '00000000-0000-4000-8000-000000000201';

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
set local role authenticated;
insert into public.mecanicos_favoritos (ciclista_id, mecanico_id) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201'),
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000202');
-- A gravação repetida usada pelo cliente não duplica o favorito.
insert into public.mecanicos_favoritos (ciclista_id, mecanico_id) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201')
  on conflict (ciclista_id, mecanico_id) do nothing;
do $$ begin
  assert (select count(*) = 2 from public.meus_mecanicos_favoritos()), 'Favoritos duplicados ou ausentes';
  assert (select count(*) = 1 from public.meus_mecanicos_favoritos() where not disponivel), 'Indisponível deve continuar na lista';
  begin
    insert into public.mecanicos_favoritos (ciclista_id, mecanico_id) values
      ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000102');
    raise exception 'Não deveria salvar um ciclista como mecânico';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.chamados (ciclista_id, mecanico_id, categoria, endereco) values
      ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000202', 'pneu', 'Rua de teste, Recife');
    raise exception 'Mecânico indisponível não deveria receber novo pedido';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000102', true);
set local role authenticated;
do $$ declare removidos integer; begin
  assert (select count(*) = 0 from public.mecanicos_favoritos), 'Vazamento de favoritos entre usuários';
  assert (select count(*) = 0 from public.meus_mecanicos_favoritos()), 'RPC vazou favoritos de outro ciclista';
  delete from public.mecanicos_favoritos where ciclista_id = '00000000-0000-4000-8000-000000000101';
  get diagnostics removidos = row_count;
  assert removidos = 0, 'Ciclista removeu favoritos de outra conta';
  begin
    insert into public.mecanicos_favoritos (ciclista_id, mecanico_id) values
      ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201');
    raise exception 'Ciclista salvou favorito para outra conta';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000201', true);
set local role authenticated;
do $$ begin
  begin
    insert into public.mecanicos_favoritos (ciclista_id, mecanico_id) values
      ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000202');
    raise exception 'Conta de mecânico não deveria salvar favoritos';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
set local role authenticated;
delete from public.mecanicos_favoritos where mecanico_id = '00000000-0000-4000-8000-000000000202';
do $$ begin
  assert (select count(*) = 1 from public.meus_mecanicos_favoritos()), 'Remoção não persistiu';
end $$;
insert into public.chamados (id, ciclista_id, mecanico_id, categoria, endereco) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201', 'pneu', 'Rua de teste, Recife');

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000201', true);
set local role authenticated;
update public.chamados set status = 'aceito', estimativa = 25, tempo_chegada_min = 6
where id = '00000000-0000-4000-8000-000000000301';

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
set local role authenticated;
update public.chamados set status = 'a_caminho' where id = '00000000-0000-4000-8000-000000000301';
do $$ begin
  assert (select status = 'a_caminho' and estimativa = 25 and confirmado_em is not null from public.chamados where id = '00000000-0000-4000-8000-000000000301'), 'Nova chamada deve seguir aceite, estimativa e confirmação';
end $$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
do $$ begin
  begin
    perform * from public.meus_mecanicos_favoritos();
    raise exception 'Anônimo não deveria acessar favoritos';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
