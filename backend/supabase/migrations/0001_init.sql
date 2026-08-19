-- AskFlow AI: initial schema
-- Conversations + messages, scoped to auth.users via Row Level Security.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- conversations
-- ─────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_idx on public.conversations (user_id);
create index if not exists conversations_updated_at_idx on public.conversations (updated_at desc);

-- ─────────────────────────────────────────────────────────────
-- messages
-- ─────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_created_at_idx on public.messages (created_at asc);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- The backend uses the Supabase service-role key, which bypasses RLS
-- entirely — these policies are the safety net in case a client ever
-- talks to Supabase directly with a user's JWT (e.g. future direct
-- reads), ensuring users can only ever see their own data.
-- ─────────────────────────────────────────────────────────────

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

create policy "Users can view own messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Users can insert own messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Users can delete own messages"
  on public.messages for delete
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );
