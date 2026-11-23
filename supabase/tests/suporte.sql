-- Exclusivo do teste isolado; nunca aplicar como migration remota.
create role anon;
create role authenticated;
create schema auth;
create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public,auth to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
alter default privileges in schema public grant all on tables to authenticated;
create publication supabase_realtime;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean default false,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text references storage.buckets,name text,owner uuid,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated,anon;
grant select,insert,update,delete on storage.objects to authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as
$$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
