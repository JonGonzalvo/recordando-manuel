-- Memories of Manuel, posted by anyone with the link (no accounts).
-- Readers see every memory that isn't hidden. To moderate, set `hidden` to true
-- (or delete the row) in the Supabase table editor.

create extension if not exists pgcrypto with schema extensions;

create table public.memories (
  id                uuid primary key,
  created_at        timestamptz not null default now(),
  signature         text not null check (char_length(signature) between 1 and 120),
  context           text not null default '' check (char_length(context) <= 200),
  original          text not null check (char_length(original) between 1 and 8000),
  source            text not null check (source in ('en', 'es')),
  -- { "es": { "story": "...", "context": "..." }, "en": {...} }, written only by the translate function
  translations      jsonb not null default '{}'::jsonb,
  hidden            boolean not null default false,
  -- sha256 (hex) of a random token kept in the poster's browser, so they can remove their own memory
  delete_token_hash text not null check (delete_token_hash ~ '^[0-9a-f]{64}$')
);

alter table public.memories enable row level security;

-- Visitors may read and insert only these columns; nobody but the service role updates.
revoke all on public.memories from anon, authenticated;
grant select (id, created_at, signature, context, original, source, translations) on public.memories to anon, authenticated;
grant insert (id, signature, context, original, source, delete_token_hash) on public.memories to anon, authenticated;

create policy "Visible memories are readable"
  on public.memories for select to anon, authenticated
  using (not hidden);

create policy "Anyone can post a memory"
  on public.memories for insert to anon, authenticated
  with check (not hidden and translations = '{}'::jsonb);

-- Remove your own memory with the token your browser kept when you posted it.
create or replace function public.delete_memory(p_id uuid, p_token text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with removed as (
    delete from public.memories
    where id = p_id
      and delete_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    returning 1
  )
  select exists (select 1 from removed);
$$;

revoke all on function public.delete_memory(uuid, text) from public;
grant execute on function public.delete_memory(uuid, text) to anon, authenticated;
