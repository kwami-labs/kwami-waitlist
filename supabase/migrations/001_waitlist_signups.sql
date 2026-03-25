-- Waitlist signups for kwami.io launch landing (inserts via @nuxtjs/supabase + publishable key + RLS)

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_signups_email_lower_key on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;

-- Allow anyone to join the waitlist (insert only)
drop policy if exists "waitlist_anon_insert" on public.waitlist_signups;
create policy "waitlist_anon_insert"
  on public.waitlist_signups
  for insert
  to anon
  with check (true);

-- Do not expose rows to anonymous clients
drop policy if exists "waitlist_anon_no_select" on public.waitlist_signups;
create policy "waitlist_anon_no_select"
  on public.waitlist_signups
  for select
  to anon
  using (false);

-- Same rules for authenticated role (publishable key with a session)
drop policy if exists "waitlist_authenticated_insert" on public.waitlist_signups;
create policy "waitlist_authenticated_insert"
  on public.waitlist_signups
  for insert
  to authenticated
  with check (true);

drop policy if exists "waitlist_authenticated_no_select" on public.waitlist_signups;
create policy "waitlist_authenticated_no_select"
  on public.waitlist_signups
  for select
  to authenticated
  using (false);

comment on table public.waitlist_signups is 'Email waitlist for kwami.io; inserts via publishable key; RLS allows insert, blocks select for anon/authenticated.';
