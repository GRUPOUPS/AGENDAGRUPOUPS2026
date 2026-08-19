-- Ejecutar después de supabase-licitaciones-schema.sql
-- Genera notificaciones internas de 7, 3 y 1 día antes del cierre y de documentos por vencer.

create or replace function public.generate_licitacion_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
  d record;
  days_left integer;
begin
  for l in
    select id, code, name, deadline
    from public.licitaciones
    where deadline is not null
      and status not in ('Adjudicada','No adjudicada','Cancelada')
      and deadline > now()
  loop
    days_left := floor(extract(epoch from (l.deadline-now()))/86400);
    if days_left in (7,3,1) then
      if not exists (
        select 1 from public.licitacion_notifications
        where licitacion_id=l.id
          and kind='deadline_'||days_left
      ) then
        insert into public.licitacion_notifications(licitacion_id,kind,title,body,due_at)
        values(l.id,'deadline_'||days_left,
          'Licitación próxima a cerrar',
          coalesce(l.name,l.code)||' cierra en '||days_left||' día(s). Revisa documentos, firmas y requisitos críticos.',
          now());
      end if;
    end if;
  end loop;

  for d in
    select id,name,expires_at
    from public.company_documents
    where expires_at is not null
      and expires_at >= current_date
      and expires_at <= current_date + 30
  loop
    days_left := d.expires_at-current_date;
    if days_left in (30,15,7,3,1) then
      if not exists (
        select 1 from public.licitacion_notifications
        where kind='company_doc_'||d.id::text||'_'||days_left
      ) then
        insert into public.licitacion_notifications(kind,title,body,due_at)
        values('company_doc_'||d.id::text||'_'||days_left,
          'Documento de empresa por vencer',
          d.name||' vence en '||days_left||' día(s).',
          now());
      end if;
    end if;
  end loop;
end;
$$;

-- Si el proyecto tiene pg_cron habilitado, se puede programar así:
-- select cron.schedule('licitaciones-alertas-diarias','0 8 * * *','select public.generate_licitacion_notifications();');