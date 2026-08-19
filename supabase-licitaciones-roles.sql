-- Ejecutar después de supabase-licitaciones-schema.sql
-- Todos ven el mismo Dashboard. Este archivo solo controla quién puede modificar datos.

create or replace function public.can_edit_licitaciones()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select access_role from public.profiles where id = auth.uid()), '') <> 'management_viewer';
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'licitaciones','licitacion_requirements','company_documents','company_document_versions',
    'licitacion_files','competitor_offers','opportunity_feedback','licitacion_activity',
    'licitacion_notifications','licitacion_app_state'
  ] loop
    execute format('drop policy if exists %L on public.%I', 'write '||replace(t,'_',' '), t);
    execute format('drop policy if exists auth_insert on public.%I', t);
    execute format('drop policy if exists auth_update on public.%I', t);
    execute format('drop policy if exists auth_delete on public.%I', t);
    execute format('create policy auth_insert on public.%I for insert to authenticated with check (public.can_edit_licitaciones())', t);
    execute format('create policy auth_update on public.%I for update to authenticated using (public.can_edit_licitaciones()) with check (public.can_edit_licitaciones())', t);
    execute format('create policy auth_delete on public.%I for delete to authenticated using (public.can_edit_licitaciones())', t);
  end loop;
end $$;