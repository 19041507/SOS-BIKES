-- Dados sensíveis não entram em perfis, cujos dados são compartilhados em chamados.
create function public.documento_perfil_valido(valor text, especie text)
returns boolean language plpgsql immutable set search_path='' as $$
declare n integer; etapa integer; soma integer; peso integer; dv integer; i integer;
begin
  if valor is null then return true; end if;
  if especie='cpf' then
    if valor !~ '^[0-9]{11}$' or valor ~ '^([0-9])\1{10}$' then return false; end if;
    for etapa in 9..10 loop
      soma:=0;
      for i in 1..etapa loop soma:=soma+substring(valor,i,1)::integer*(etapa+2-i); end loop;
      dv:=(soma*10)%11; if dv=10 then dv:=0; end if;
      if dv<>substring(valor,etapa+1,1)::integer then return false; end if;
    end loop;
  elsif especie='cnpj' then
    if valor !~ '^[A-Z0-9]{12}[0-9]{2}$' or valor ~ '^([0-9])\1{13}$' then return false; end if;
    for etapa in 12..13 loop
      soma:=0; peso:=2;
      for i in reverse etapa..1 loop
        n:=ascii(substring(valor,i,1))-48;
        soma:=soma+n*peso; peso:=peso+1; if peso=10 then peso:=2; end if;
      end loop;
      dv:=soma%11; if dv<2 then dv:=0; else dv:=11-dv; end if;
      if dv<>substring(valor,etapa+1,1)::integer then return false; end if;
    end loop;
  else return false;
  end if;
  return true;
end $$;

create table public.perfil_privado (
  usuario_id uuid primary key references public.perfis(id) on delete cascade,
  cpf text check(public.documento_perfil_valido(cpf,'cpf')),
  idade smallint check(idade between 1 and 120),
  foto_caminho text,
  texto_ampliado boolean not null default false,
  alto_contraste boolean not null default false,
  reduzir_movimentos boolean not null default false
);
create table public.oficina_privada (
  usuario_id uuid primary key references public.perfis(id) on delete cascade,
  vinculado boolean not null default false,
  cnpj text check(public.documento_perfil_valido(cnpj,'cnpj')),
  endereco text check(char_length(endereco) between 5 and 200),
  foto_caminho text,
  check ((vinculado and cnpj is not null) or (not vinculado and cnpj is null and endereco is null and foto_caminho is null))
);
create table public.bicicletas_perfil (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  modelo text not null check(char_length(btrim(modelo)) between 1 and 100),
  apelido text check(char_length(apelido)<=80),
  cor text check(char_length(cor)<=40),
  foto_caminho text,
  criado_em timestamptz not null default now()
);
create table public.locais_perfil (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  nome text not null check(char_length(btrim(nome)) between 1 and 80),
  endereco text not null check(char_length(btrim(endereco)) between 5 and 200),
  criado_em timestamptz not null default now()
);
create table public.clientes_favoritos (
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  cliente_id uuid not null references public.perfis(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key(usuario_id,cliente_id)
);
create table public.atividade_perfil (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  tipo text not null,
  criado_em timestamptz not null default now()
);
create index bicicletas_perfil_dono on public.bicicletas_perfil(usuario_id,criado_em,id);
create index locais_perfil_dono on public.locais_perfil(usuario_id,criado_em,id);
create index atividade_perfil_dono on public.atividade_perfil(usuario_id,criado_em desc,id desc);

alter table public.perfil_privado enable row level security;
alter table public.oficina_privada enable row level security;
alter table public.bicicletas_perfil enable row level security;
alter table public.locais_perfil enable row level security;
alter table public.clientes_favoritos enable row level security;
alter table public.atividade_perfil enable row level security;
revoke all on public.perfil_privado,public.oficina_privada,public.bicicletas_perfil,public.locais_perfil,public.clientes_favoritos,public.atividade_perfil from public,anon,authenticated;
grant select on public.perfil_privado,public.oficina_privada,public.bicicletas_perfil,public.locais_perfil,public.clientes_favoritos,public.atividade_perfil to authenticated;
create policy "Dados privados do titular" on public.perfil_privado for select to authenticated using(usuario_id=(select auth.uid()));
create policy "Oficina privada do titular" on public.oficina_privada for select to authenticated using(usuario_id=(select auth.uid()));
create policy "Bicicletas do titular" on public.bicicletas_perfil for select to authenticated using(usuario_id=(select auth.uid()));
create policy "Locais do titular" on public.locais_perfil for select to authenticated using(usuario_id=(select auth.uid()));
create policy "Clientes favoritos do titular" on public.clientes_favoritos for select to authenticated using(usuario_id=(select auth.uid()));
create policy "Atividade do titular" on public.atividade_perfil for select to authenticated using(usuario_id=(select auth.uid()));

create function public.salvar_perfil_completo(operacao text,dados jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); papel public.tipo_perfil; item uuid; cpf_val text; idade_val smallint;
  vinculo boolean; cnpj_val text; atual public.oficina_privada; nome_oficina text;
begin
  if u is null then raise insufficient_privilege using message='Sessão expirada.'; end if;
  -- Serializa as mutações por titular; jamais usa ID de usuário enviado pelo cliente.
  select tipo into papel from public.perfis where id=u for update;
  if papel is null then raise insufficient_privilege using message='Perfil não encontrado.'; end if;
  if jsonb_typeof(dados)<>'object' then raise check_violation using message='Dados inválidos.'; end if;
  case operacao
  when 'dados' then
    if char_length(btrim(coalesce(dados->>'nome',''))) not between 3 and 120
       or coalesce(dados->>'telefone','') !~ '^[0-9]{10,11}$' then
      raise check_violation using message='Informe nome completo e WhatsApp com DDD.';
    end if;
    cpf_val:=nullif(dados->>'cpf','');
    if not public.documento_perfil_valido(cpf_val,'cpf') then raise check_violation using message='Informe um CPF válido.'; end if;
    if nullif(dados->>'idade','') is not null then
      if (dados->>'idade') !~ '^[0-9]{1,3}$' then raise check_violation using message='A idade deve ser entre 1 e 120.'; end if;
      idade_val:=(dados->>'idade')::smallint;
    end if;
    insert into public.perfil_privado(usuario_id,cpf,idade) values(u,cpf_val,idade_val)
      on conflict(usuario_id) do update set cpf=excluded.cpf,idade=excluded.idade;
    update public.perfis set nome=btrim(dados->>'nome'),telefone=dados->>'telefone' where id=u;
  when 'oficina' then
    if papel<>'mecanico' then raise insufficient_privilege using message='Somente mecânico.'; end if;
    if jsonb_typeof(dados->'vinculado') is distinct from 'boolean' then raise check_violation using message='Informe o vínculo.'; end if;
    vinculo:=(dados->>'vinculado')::boolean;
    cnpj_val:=case when vinculo then nullif(upper(regexp_replace(dados->>'cnpj','[. /-]','','g')),'') else null end;
    nome_oficina:=btrim(coalesce(dados->>'nome',''));
    if vinculo and (cnpj_val is null or not public.documento_perfil_valido(cnpj_val,'cnpj') or char_length(nome_oficina) not between 1 and 120) then
      raise check_violation using message='Informe nome da oficina e CNPJ válido.';
    end if;
    select * into atual from public.oficina_privada where usuario_id=u;
    if atual.vinculado and (not vinculo or atual.cnpj is distinct from cnpj_val) and coalesce(dados->>'confirmar','false')<>'true' then
      raise check_violation using message='Confirme a remoção dos dados da oficina anterior.';
    end if;
    insert into public.oficina_privada(usuario_id,vinculado,cnpj,endereco,foto_caminho)
      values(u,vinculo,cnpj_val,case when vinculo and (atual.cnpj is null or atual.cnpj=cnpj_val) then nullif(btrim(dados->>'endereco'),'') else null end,
        case when vinculo and atual.cnpj=cnpj_val then atual.foto_caminho else null end)
      on conflict(usuario_id) do update set vinculado=excluded.vinculado,cnpj=excluded.cnpj,endereco=excluded.endereco,foto_caminho=excluded.foto_caminho;
    update public.perfis set oficina=case when vinculo then nome_oficina else null end where id=u;
  when 'bicicleta' then
    if papel<>'ciclista' then raise insufficient_privilege; end if;
    item:=nullif(dados->>'id','')::uuid;
    if item is null then
      insert into public.bicicletas_perfil(usuario_id,modelo,apelido,cor) values(u,btrim(dados->>'modelo'),nullif(btrim(dados->>'apelido'),''),nullif(btrim(dados->>'cor'),''));
    else
      update public.bicicletas_perfil set modelo=btrim(dados->>'modelo'),apelido=nullif(btrim(dados->>'apelido'),''),cor=nullif(btrim(dados->>'cor'),'') where id=item and usuario_id=u;
      if not found then raise insufficient_privilege; end if;
    end if;
  when 'remover_bicicleta' then
    delete from public.bicicletas_perfil where id=(dados->>'id')::uuid and usuario_id=u;
    if not found then raise insufficient_privilege; end if;
  when 'local' then
    if papel<>'ciclista' then raise insufficient_privilege; end if;
    item:=nullif(dados->>'id','')::uuid;
    if item is null then
      insert into public.locais_perfil(usuario_id,nome,endereco) values(u,btrim(dados->>'nome'),btrim(dados->>'endereco'));
    else
      update public.locais_perfil set nome=btrim(dados->>'nome'),endereco=btrim(dados->>'endereco') where id=item and usuario_id=u;
      if not found then raise insufficient_privilege; end if;
    end if;
  when 'remover_local' then
    delete from public.locais_perfil where id=(dados->>'id')::uuid and usuario_id=u;
    if not found then raise insufficient_privilege; end if;
  when 'preferencias' then
    if jsonb_typeof(dados->'texto_ampliado') is distinct from 'boolean' or jsonb_typeof(dados->'alto_contraste') is distinct from 'boolean' or jsonb_typeof(dados->'reduzir_movimentos') is distinct from 'boolean' then raise check_violation; end if;
    insert into public.perfil_privado(usuario_id,texto_ampliado,alto_contraste,reduzir_movimentos)
      values(u,(dados->>'texto_ampliado')::boolean,(dados->>'alto_contraste')::boolean,(dados->>'reduzir_movimentos')::boolean)
      on conflict(usuario_id) do update set texto_ampliado=excluded.texto_ampliado,alto_contraste=excluded.alto_contraste,reduzir_movimentos=excluded.reduzir_movimentos;
  when 'cliente_favorito' then
    item:=(dados->>'id')::uuid;
    if papel<>'mecanico' then raise insufficient_privilege; end if;
    if dados->>'salvar'='true' then
      if not exists(select 1 from public.chamados where mecanico_id=u and ciclista_id=item) then raise insufficient_privilege; end if;
      insert into public.clientes_favoritos(usuario_id,cliente_id) values(u,item) on conflict do nothing;
    else delete from public.clientes_favoritos where usuario_id=u and cliente_id=item;
    end if;
  else raise check_violation using message='Operação inválida.';
  end case;
end $$;
revoke all on function public.salvar_perfil_completo(text,jsonb) from public,anon;
grant execute on function public.salvar_perfil_completo(text,jsonb) to authenticated;

-- Eventos não contêm CPF/CNPJ, endereços, imagens ou texto de mensagens.
create function privado.registrar_atividade_perfil() returns trigger language plpgsql security definer set search_path='' as $$
declare dono uuid; evento text;
begin
  if tg_op='UPDATE' and new is not distinct from old then return new; end if;
  if tg_table_name='perfis' then
    if tg_op='UPDATE' and new.nome is not distinct from old.nome and new.telefone is not distinct from old.telefone and new.oficina is not distinct from old.oficina then return new; end if;
    dono:=new.id;
  else dono:=case when tg_op='DELETE' then old.usuario_id else new.usuario_id end;
  end if;
  evento:=case tg_table_name when 'perfis' then 'Dados de contato atualizados' when 'perfil_privado' then 'Dados privados ou acessibilidade atualizados' when 'oficina_privada' then 'Oficina atualizada' when 'bicicletas_perfil' then 'Bicicleta ' when 'locais_perfil' then 'Local ' else 'Cliente favorito ' end;
  if tg_table_name in ('bicicletas_perfil','locais_perfil','clientes_favoritos') then evento:=evento||case tg_op when 'INSERT' then 'adicionado' when 'UPDATE' then 'atualizado' else 'removido' end; end if;
  insert into public.atividade_perfil(usuario_id,tipo) values(dono,evento);
  return case when tg_op='DELETE' then old else new end;
end $$;
create trigger perfil_evento after update on public.perfis for each row execute function privado.registrar_atividade_perfil();
create trigger privado_evento after insert or update on public.perfil_privado for each row execute function privado.registrar_atividade_perfil();
create trigger oficina_evento after insert or update on public.oficina_privada for each row execute function privado.registrar_atividade_perfil();
create trigger bicicleta_evento after insert or update or delete on public.bicicletas_perfil for each row execute function privado.registrar_atividade_perfil();
create trigger local_evento after insert or update or delete on public.locais_perfil for each row execute function privado.registrar_atividade_perfil();
create trigger cliente_evento after insert or delete on public.clientes_favoritos for each row execute function privado.registrar_atividade_perfil();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('fotos-perfil','fotos-perfil',false,5242880,array['image/jpeg','image/png','image/webp']);
create function privado.foto_perfil_em_uso(caminho text) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.perfil_privado where foto_caminho=caminho)
    or exists(select 1 from public.oficina_privada where foto_caminho=caminho)
    or exists(select 1 from public.bicicletas_perfil where foto_caminho=caminho);
$$;
revoke all on function privado.foto_perfil_em_uso(text) from public,anon;
grant execute on function privado.foto_perfil_em_uso(text) to authenticated;
create policy "Ler fotos privadas do titular" on storage.objects for select to authenticated
using(bucket_id='fotos-perfil' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Enviar fotos privadas do titular" on storage.objects for insert to authenticated
with check(bucket_id='fotos-perfil' and name ~ ('^'||(select auth.uid())::text||'/(avatar|fachada|bicicleta)/[0-9a-f-]{36}\.(jpg|png|webp)$'));
create policy "Remover somente fotos sem referencia" on storage.objects for delete to authenticated
using(bucket_id='fotos-perfil' and (storage.foldername(name))[1]=(select auth.uid())::text and not privado.foto_perfil_em_uso(name));

create function public.trocar_foto_perfil(destino text,item_id uuid,antiga text,nova text)
returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); atual text; papel public.tipo_perfil;
begin
  select tipo into papel from public.perfis where id=u for update;
  if u is null or papel is null then raise insufficient_privilege; end if;
  if nova is not null and (nova !~ ('^'||u::text||'/'||destino||'/[0-9a-f-]{36}\.(jpg|png|webp)$') or not exists(select 1 from storage.objects where bucket_id='fotos-perfil' and name=nova)) then raise insufficient_privilege; end if;
  if destino='avatar' then
    insert into public.perfil_privado(usuario_id) values(u) on conflict do nothing;
    select foto_caminho into atual from public.perfil_privado where usuario_id=u;
    if atual is distinct from antiga then return false; end if;
    update public.perfil_privado set foto_caminho=nova where usuario_id=u;
  elsif destino='fachada' and papel='mecanico' then
    select foto_caminho into atual from public.oficina_privada where usuario_id=u and vinculado;
    if not found then raise insufficient_privilege; end if;
    if atual is distinct from antiga then return false; end if;
    update public.oficina_privada set foto_caminho=nova where usuario_id=u;
  elsif destino='bicicleta' and papel='ciclista' then
    select foto_caminho into atual from public.bicicletas_perfil where id=item_id and usuario_id=u;
    if not found then raise insufficient_privilege; end if;
    if atual is distinct from antiga then return false; end if;
    update public.bicicletas_perfil set foto_caminho=nova where id=item_id and usuario_id=u;
  else raise insufficient_privilege;
  end if;
  return true;
end $$;
revoke all on function public.trocar_foto_perfil(text,uuid,text,text) from public,anon;
grant execute on function public.trocar_foto_perfil(text,uuid,text,text) to authenticated;

-- Paginação por data/ID evita saltos quando chegam novos registros.
create function public.listar_secao_perfil(secao text,antes timestamptz default null,antes_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); papel public.tipo_perfil; resultado jsonb;
begin
  select tipo into papel from public.perfis where id=u;
  if u is null or papel is null then raise insufficient_privilege; end if;
  if (antes is null) <> (antes_id is null) then raise check_violation; end if;
  case secao
  when 'bicicletas' then
    select coalesce(jsonb_agg(to_jsonb(t)),'[]') into resultado from (
      select id,modelo,apelido,cor,foto_caminho,criado_em from public.bicicletas_perfil
      where usuario_id=u and papel='ciclista' and (antes is null or (criado_em,id)<(antes,antes_id))
      order by criado_em desc,id desc limit 51
    ) t;
  when 'locais' then
    select coalesce(jsonb_agg(to_jsonb(t)),'[]') into resultado from (
      select id,nome,endereco,criado_em from public.locais_perfil
      where usuario_id=u and papel='ciclista' and (antes is null or (criado_em,id)<(antes,antes_id))
      order by criado_em desc,id desc limit 51
    ) t;
  when 'locais_usados' then
    select coalesce(jsonb_agg(to_jsonb(t)),'[]') into resultado from (
      select * from (select (min(id::text))::uuid id,endereco,max(criado_em) criado_em from public.chamados where ciclista_id=u and papel='ciclista' group by endereco) l
      where antes is null or (l.criado_em,l.id)<(antes,antes_id) order by l.criado_em desc,l.id desc limit 51
    ) t;
  when 'favoritos' then
    select coalesce(jsonb_agg(to_jsonb(t)),'[]') into resultado from (
      select p.id,p.nome,p.oficina,f.criado_em from public.mecanicos_favoritos f join public.perfis p on p.id=f.mecanico_id
      where papel='ciclista' and f.ciclista_id=u and (antes is null or (f.criado_em,p.id)<(antes,antes_id))
      union all
      select p.id,p.nome,p.oficina,f.criado_em from public.clientes_favoritos f join public.perfis p on p.id=f.cliente_id
      where papel='mecanico' and f.usuario_id=u and (antes is null or (f.criado_em,p.id)<(antes,antes_id))
      order by criado_em desc,id desc limit 51
    ) t;
  when 'clientes' then
    select coalesce(jsonb_agg(to_jsonb(t)),'[]') into resultado from (
      select * from (select p.id,p.nome,max(c.criado_em) criado_em from public.chamados c join public.perfis p on p.id=c.ciclista_id where c.mecanico_id=u and papel='mecanico' group by p.id,p.nome) l
      where antes is null or (l.criado_em,l.id)<(antes,antes_id) order by l.criado_em desc,l.id desc limit 51
    ) t;
  when 'avaliacao' then
    select coalesce(jsonb_agg(to_jsonb(t)),'[]') into resultado from (
      select a.chamado_id id,a.chamado_id,a.nota,a.comentario,a.criado_em from public.avaliacoes a join public.chamados c on c.id=a.chamado_id
      where papel='mecanico' and c.mecanico_id=u and c.status='concluido' and (antes is null or (a.criado_em,a.chamado_id)<(antes,antes_id))
      union all
      select a.chamado_id id,a.chamado_id,a.nota,a.comentario,a.criado_em from public.avaliacoes_ciclistas a join public.chamados c on c.id=a.chamado_id
      where papel='ciclista' and c.ciclista_id=u and c.status='concluido' and (antes is null or (a.criado_em,a.chamado_id)<(antes,antes_id))
      order by criado_em desc,id desc limit 51
    ) t;
  when 'mensagens' then
    select coalesce(jsonb_agg(to_jsonb(t)),'[]') into resultado from (
      select c.id,c.status,p.nome,c.criado_em from public.chamados c join public.perfis p on p.id=case when c.ciclista_id=u then c.mecanico_id else c.ciclista_id end
      where u in(c.ciclista_id,c.mecanico_id) and (antes is null or (c.criado_em,c.id)<(antes,antes_id))
      order by c.criado_em desc,c.id desc limit 51
    ) t;
  when 'atividade' then
    select coalesce(jsonb_agg(to_jsonb(t)),'[]') into resultado from (
      select id,tipo,criado_em from (
        select id,tipo,criado_em from public.atividade_perfil where usuario_id=u
        union all
        select id,'Chamado: '||status::text tipo,coalesce(concluido_em,encerrado_em,chegada_em,confirmado_em,aceito_em,criado_em) criado_em from public.chamados where u in(ciclista_id,mecanico_id)
      ) eventos where antes is null or (criado_em,id)<(antes,antes_id)
      order by criado_em desc,id desc limit 51
    ) t;
  else raise check_violation using message='Seção inválida.';
  end case;
  return resultado;
end $$;
revoke all on function public.listar_secao_perfil(text,timestamptz,uuid) from public,anon;
grant execute on function public.listar_secao_perfil(text,timestamptz,uuid) to authenticated;

create function public.resumo_avaliacao_perfil() returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('quantidade',count(*),'media',round(avg(nota),1)) from (
    select a.nota from public.avaliacoes a join public.chamados c on c.id=a.chamado_id where c.mecanico_id=auth.uid() and c.status='concluido'
    union all
    select a.nota from public.avaliacoes_ciclistas a join public.chamados c on c.id=a.chamado_id where c.ciclista_id=auth.uid() and c.status='concluido'
  ) notas;
$$;
revoke all on function public.resumo_avaliacao_perfil() from public,anon;
grant execute on function public.resumo_avaliacao_perfil() to authenticated;

create function public.marcar_mensagens_perfil_lidas(ids uuid[]) returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  if coalesce(cardinality(ids),0)>50 then raise check_violation; end if;
  update public.mensagens m set lida_em=now() from public.chamados c
    where m.id=any(ids) and c.id=m.chamado_id and auth.uid() in(c.ciclista_id,c.mecanico_id)
      and m.autor_id<>auth.uid() and m.lida_em is null;
end $$;
revoke all on function public.marcar_mensagens_perfil_lidas(uuid[]) from public,anon;
grant execute on function public.marcar_mensagens_perfil_lidas(uuid[]) to authenticated;
