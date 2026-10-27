-- Portfólio da Heloisa: tabelas, regras de acesso e armazenamento de imagens.
-- Já aplicado no projeto Supabase "portfolio-heloisa". Guardado aqui para poder refazer do zero.

-- ---------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------

-- Quem pode editar o portfólio. Só entra aqui quem for cadastrado à mão (veja 002_seed.sql).
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.categories (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label_pt text not null,
  label_en text,
  description_pt text,
  description_en text,
  cover_path text,
  max_cols int check (max_cols between 1 and 4),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.works (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.categories (id) on update cascade on delete cascade,
  title_pt text not null,
  title_en text,
  description_pt text,
  description_en text,
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index works_category_position_idx on public.works (category_id, position);

create table public.work_images (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works (id) on delete cascade,
  path text not null,
  ratio numeric(6, 3) check (ratio > 0),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index work_images_work_position_idx on public.work_images (work_id, position);

-- Uma única linha (id = 1) com nome, "sobre mim", contatos e foto.
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Atualiza "updated_at" sozinho.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger works_set_updated_at before update on public.works
  for each row execute function public.set_updated_at();
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- Permissões das tabelas (defesa extra além das regras por linha)
-- ---------------------------------------------------------------
revoke all on public.admins, public.categories, public.works, public.work_images, public.site_settings
  from anon, authenticated;

grant select on public.categories, public.works, public.work_images, public.site_settings
  to anon, authenticated;
grant insert, update, delete on public.categories, public.works, public.work_images
  to authenticated;
grant update on public.site_settings to authenticated;
grant select on public.admins to authenticated;

-- ---------------------------------------------------------------
-- Regras por linha (RLS)
-- ---------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.works enable row level security;
alter table public.work_images enable row level security;
alter table public.site_settings enable row level security;

-- Cada pessoa logada só enxerga a própria linha em "admins".
-- É isso que permite as regras abaixo perguntarem "esta pessoa é administradora?".
create policy admins_read_own on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Leitura pública.
create policy categories_read on public.categories
  for select to anon, authenticated using (true);

create policy site_settings_read on public.site_settings
  for select to anon, authenticated using (true);

-- Projetos: o visitante vê só os publicados; a administradora vê também os rascunhos.
create policy works_read on public.works
  for select to anon, authenticated
  using (
    published
    or exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  );

-- Imagens: seguem a regra do projeto a que pertencem.
create policy work_images_read on public.work_images
  for select to anon, authenticated
  using (exists (select 1 from public.works w where w.id = work_images.work_id));

-- Escrita: só administradora.
create policy categories_insert on public.categories
  for insert to authenticated
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy categories_update on public.categories
  for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy categories_delete on public.categories
  for delete to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy works_insert on public.works
  for insert to authenticated
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy works_update on public.works
  for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy works_delete on public.works
  for delete to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy work_images_insert on public.work_images
  for insert to authenticated
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy work_images_update on public.work_images
  for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy work_images_delete on public.work_images
  for delete to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy site_settings_update on public.site_settings
  for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- ---------------------------------------------------------------
-- Armazenamento das imagens
-- Bucket público: qualquer visitante vê as imagens pelo endereço delas,
-- mas só a administradora consegue enviar, trocar ou apagar arquivos.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  5242880, -- 5 MB por arquivo (o painel envia WebP de ~300 KB)
  array['image/webp', 'image/jpeg', 'image/png', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy portfolio_files_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'portfolio'
    and exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  );
create policy portfolio_files_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'portfolio'
    and exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  );
create policy portfolio_files_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'portfolio'
    and exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  )
  with check (
    bucket_id = 'portfolio'
    and exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  );
create policy portfolio_files_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'portfolio'
    and exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  );
