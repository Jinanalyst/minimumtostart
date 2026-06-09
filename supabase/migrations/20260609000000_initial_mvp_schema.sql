create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Untitled MVP',
  answers jsonb not null default '{}'::jsonb,
  generated jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  email text not null,
  source text not null default 'Landing page',
  created_at timestamptz not null default now(),
  unique nulls not distinct (project_id, email)
);

alter table public.projects enable row level security;
alter table public.leads enable row level security;

create policy "Users can view their projects"
on public.projects for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their projects"
on public.projects for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their projects"
on public.projects for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can view leads for their projects"
on public.leads for select
to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = leads.project_id
      and projects.user_id = (select auth.uid())
  )
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists leads_project_id_idx on public.leads(project_id);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
