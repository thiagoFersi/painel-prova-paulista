-- =====================================================================
-- 01 - TABELAS E SEGURANÇA (PASSO 1 de 3)
-- Onde rodar: Supabase > SQL Editor > New query > cole tudo > Run.
-- Pode rodar mais de uma vez sem estragar nada.
--
-- Como a segurança funciona:
--   * Qualquer visitante LÊ a versão publicada (precisa para o painel abrir).
--   * Só um administrador (usuário listado na tabela "admins") PUBLICA ou EXCLUI versões.
--   * A chave "anon public" usada no site não consegue escrever sem login de administrador.
-- =====================================================================

-- Administradores autorizados. Ninguém acessa esta tabela pela API: só a função is_admin().
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- Versões publicadas do painel. A mais recente (created_at) é a que aparece no site.
create table if not exists public.datasets (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  label      text not null check (char_length(label) between 1 and 80),
  file_name  text,
  nb         smallint not null check (nb between 1 and 12),
  payload    jsonb not null check (jsonb_typeof(payload -> 's') = 'array')
);
create index if not exists datasets_created_at_idx on public.datasets (created_at desc);
alter table public.datasets enable row level security;

-- Pergunta "o usuário logado é administrador?". Roda com permissão do dono para poder ler "admins".
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Permissões de tabela (as regras de linha abaixo continuam valendo por cima).
revoke all on public.datasets from anon, authenticated;
grant select on public.datasets to anon, authenticated;
grant insert, delete on public.datasets to authenticated;
grant usage, select on sequence public.datasets_id_seq to authenticated;

-- Regras de linha (RLS)
drop policy if exists "leitura publica" on public.datasets;
create policy "leitura publica" on public.datasets
  for select to anon, authenticated using (true);

drop policy if exists "admin publica" on public.datasets;
create policy "admin publica" on public.datasets
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin exclui" on public.datasets;
create policy "admin exclui" on public.datasets
  for delete to authenticated using (public.is_admin());
