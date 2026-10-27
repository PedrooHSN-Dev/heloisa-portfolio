-- Correção: a regra de leitura de "works" consultava "admins", mas o visitante (anon)
-- não tem permissão nessa tabela, então a leitura dos projetos falhava para ele.
-- Agora o visitante tem a própria regra (só projetos publicados) e a regra que
-- olha a lista de administradores vale só para quem está logado.

drop policy works_read on public.works;

create policy works_read_anon on public.works
  for select to anon
  using (published);

create policy works_read_authenticated on public.works
  for select to authenticated
  using (
    published
    or exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  );
