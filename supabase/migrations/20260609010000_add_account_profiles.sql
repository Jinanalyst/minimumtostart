create table if not exists public.account_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_id text not null unique,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_profiles_account_id_format check (account_id ~ '^MTS-[A-F0-9]{32}$')
);

drop trigger if exists create_profile_after_signup on auth.users;
drop function if exists public.create_profile_for_user();

alter table public.account_profiles enable row level security;

drop policy if exists "Users can view their account profile" on public.account_profiles;

create policy "Users can view their account profile"
on public.account_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.create_account_profile_for_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.account_profiles (
    user_id,
    account_id,
    email,
    full_name,
    avatar_url
  )
  values (
    new.id,
    'MTS-' || upper(replace(gen_random_uuid()::text, '-', '')),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.account_profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.account_profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists create_account_profile_after_signup on auth.users;

create trigger create_account_profile_after_signup
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.create_account_profile_for_user();

insert into public.account_profiles (
  user_id,
  account_id,
  email,
  full_name,
  avatar_url
)
select
  users.id,
  'MTS-' || upper(replace(gen_random_uuid()::text, '-', '')),
  users.email,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name'),
  coalesce(users.raw_user_meta_data ->> 'avatar_url', users.raw_user_meta_data ->> 'picture')
from auth.users as users
on conflict (user_id) do update set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.account_profiles.full_name),
  avatar_url = coalesce(excluded.avatar_url, public.account_profiles.avatar_url),
  updated_at = now();

create index if not exists account_profiles_account_id_idx
on public.account_profiles(account_id);
