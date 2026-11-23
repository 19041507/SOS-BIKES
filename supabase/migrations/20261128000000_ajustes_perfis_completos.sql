-- Ajustes do Meu perfil completo (auditoria):
-- 1. Clientes favoritos: só ciclistas de atendimentos concluídos (lista e gravação).
-- 2. Atividade: mudar só a oficina não registra também "Dados de contato atualizados"
--    (o evento "Oficina atualizada" já vem de oficina_privada).
-- Só `create or replace`: grants e triggers existentes continuam valendo.

create or replace function public.salvar_perfil_completo(operacao text,dados jsonb)
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
    -- Nome e WhatsApp são salvos pelo formulário de perfil (atualizarPerfil), com as regras de sempre.
    cpf_val:=nullif(dados->>'cpf','');
    if not public.documento_perfil_valido(cpf_val,'cpf') then raise check_violation using message='Informe um CPF válido.'; end if;
    if nullif(dados->>'idade','') is not null then
      if (dados->>'idade') !~ '^[0-9]{1,3}$' then raise check_violation using message='A idade deve ser entre 1 e 120.'; end if;
      idade_val:=(dados->>'idade')::smallint;
    end if;
    insert into public.perfil_privado(usuario_id,cpf,idade) values(u,cpf_val,idade_val)
      on conflict(usuario_id) do update set cpf=excluded.cpf,idade=excluded.idade;
  when 'oficina' then
    if papel<>'mecanico' then raise insufficient_privilege using message='Somente mecânico.'; end if;
    if jsonb_typeof(dados->'vinculado') is distinct from 'boolean' then raise check_violation using message='Informe o vínculo.'; end if;
    vinculo:=(dados->>'vinculado')::boolean;
    cnpj_val:=case when vinculo then nullif(upper(regexp_replace(coalesce(dados->>'cnpj',''),'[. /-]','','g')),'') else null end;
    nome_oficina:=btrim(coalesce(dados->>'nome',''));
    if vinculo and (cnpj_val is null or not public.documento_perfil_valido(cnpj_val,'cnpj') or char_length(nome_oficina) not between 1 and 120) then
      raise check_violation using message='Informe nome da oficina e CNPJ válido.';
    end if;
    select * into atual from public.oficina_privada where usuario_id=u;
    -- Só pede confirmação quando há dados de uma oficina identificada (CNPJ) que serão descartados.
    if atual.vinculado and atual.cnpj is not null and (not vinculo or atual.cnpj is distinct from cnpj_val) and coalesce(dados->>'confirmar','false')<>'true' then
      raise check_violation using message='Confirme a remoção dos dados da oficina anterior.';
    end if;
    insert into public.oficina_privada(usuario_id,vinculado,cnpj,endereco,foto_caminho)
      values(u,vinculo,cnpj_val,case when vinculo and (atual.cnpj is null or atual.cnpj=cnpj_val) then nullif(btrim(dados->>'endereco'),'') else null end,
        case when vinculo and (atual.cnpj is null or atual.cnpj=cnpj_val) then atual.foto_caminho else null end)
      on conflict(usuario_id) do update set vinculado=excluded.vinculado,cnpj=excluded.cnpj,endereco=excluded.endereco,foto_caminho=excluded.foto_caminho;
    -- Autônomo aparece como "Mecânico autônomo" (oficina nula), como no cadastro.
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
      if not exists(select 1 from public.chamados where mecanico_id=u and ciclista_id=item and status='concluido') then raise insufficient_privilege; end if;
      insert into public.clientes_favoritos(usuario_id,cliente_id) values(u,item) on conflict do nothing;
    else delete from public.clientes_favoritos where usuario_id=u and cliente_id=item;
    end if;
  else raise check_violation using message='Operação inválida.';
  end case;
end $$;

create or replace function privado.registrar_atividade_perfil() returns trigger language plpgsql security definer set search_path='' as $$
declare dono uuid; evento text;
begin
  if tg_op='UPDATE' and new is not distinct from old then return new; end if;
  if tg_table_name='perfis' then
    if tg_op='UPDATE' and new.nome is not distinct from old.nome and new.telefone is not distinct from old.telefone then return new; end if;
    dono:=new.id;
  else dono:=case when tg_op='DELETE' then old.usuario_id else new.usuario_id end;
  end if;
  if tg_op='DELETE' and not exists(select 1 from public.perfis where id=dono) then return old; end if;
  evento:=case tg_table_name when 'perfis' then 'Dados de contato atualizados' when 'perfil_privado' then 'Dados privados ou acessibilidade atualizados' when 'oficina_privada' then 'Oficina atualizada' when 'bicicletas_perfil' then 'Bicicleta ' when 'locais_perfil' then 'Local ' else 'Cliente favorito ' end;
  if tg_table_name in ('bicicletas_perfil','locais_perfil','clientes_favoritos') then evento:=evento||case tg_op when 'INSERT' then 'adicionado' when 'UPDATE' then 'atualizado' else 'removido' end; end if;
  insert into public.atividade_perfil(usuario_id,tipo) values(dono,evento);
  return case when tg_op='DELETE' then old else new end;
end $$;

create or replace function public.listar_secao_perfil(secao text,antes timestamptz default null,antes_id uuid default null)
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
      select * from (select p.id,p.nome,max(c.criado_em) criado_em from public.chamados c join public.perfis p on p.id=c.ciclista_id where c.mecanico_id=u and papel='mecanico' and c.status='concluido'
        and not exists(select 1 from public.clientes_favoritos f where f.usuario_id=u and f.cliente_id=p.id) group by p.id,p.nome) l
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
