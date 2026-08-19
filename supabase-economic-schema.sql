create table if not exists public.licitacion_economic (
  tender_code text primary key,
  quote_file_name text,
  form_file_name text,
  quote_tax numeric default 7,
  form_tax numeric default 7,
  form_complete boolean default false,
  signature_checked boolean default false,
  final_checked boolean default false,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.licitacion_economic enable row level security;

create policy "authenticated can read economic"
on public.licitacion_economic
for select
to authenticated
using (true);

create policy "authenticated can insert economic"
on public.licitacion_economic
for insert
to authenticated
with check (true);

create policy "authenticated can update economic"
on public.licitacion_economic
for update
to authenticated
using (true)
with check (true);
