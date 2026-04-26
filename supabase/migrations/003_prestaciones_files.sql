-- =====================================================
-- Archivos adjuntos para prestaciones
-- =====================================================

create table public.prestaciones_files (
  id uuid default gen_random_uuid() primary key,
  prestacion_id uuid references public.prestaciones(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- File metadata
  filename text not null,
  file_type text not null,  -- MIME type (e.g., 'application/pdf', 'image/jpeg')
  file_size bigint not null,  -- Size in bytes
  storage_path text not null,  -- Path in storage (e.g., 'prestaciones-files/user-id/filename')

  created_at timestamptz default now()
);

alter table public.prestaciones_files enable row level security;
create policy "archivos propios" on public.prestaciones_files
  for all using (auth.uid() = user_id);

-- Index for faster queries
create index idx_prestaciones_files_prestacion on public.prestaciones_files(prestacion_id);
create index idx_prestaciones_files_user on public.prestaciones_files(user_id);
