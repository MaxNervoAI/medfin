-- Migration: Create tax_settings table for dynamic retention rate
-- This eliminates the hardcoded 14.5% (0.145) from the codebase

create table if not exists tax_settings (
  id uuid primary key default gen_random_uuid(),
  current_rate numeric(5,4) not null default 0.1450,
  valid_from date not null default current_date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert default Chilean retention rate (14.5% = 0.145)
-- Only insert if table is empty
insert into tax_settings (current_rate, valid_from)
select 0.1450, current_date
where not exists (select 1 from tax_settings);

-- Enable RLS
alter table tax_settings enable row level security;

-- Global read-only config: all authenticated users can read
-- Only service_role or admin should write

create policy "Allow authenticated read tax_settings"
  on tax_settings
  for select
  to authenticated
  using (true);

-- Trigger to auto-update updated_at

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tax_settings_updated_at
  before update on tax_settings
  for each row
  execute function handle_updated_at();

-- Add comment for documentation
comment on table tax_settings is 'Stores the dynamic tax retention rate. Default is 0.145 (14.5%) for Chilean honorarios.';
