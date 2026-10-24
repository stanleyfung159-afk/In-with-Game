-- ============================================================================
-- Preposition Game — Supabase schema
-- Run this once in your Supabase project: SQL Editor → paste → Run.
-- It creates the two shared tables that make the app multi-device.
-- ============================================================================

-- Student submissions (teacher sees all; each student sees their own).
create table if not exists public.submissions (
  id           text primary key,
  student_name text not null,
  class_name   text not null default '',
  sentence     text not null,
  correct      boolean not null default false,
  score        integer not null default 0,
  attrs        jsonb not null,
  issues       jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists submissions_created_idx on public.submissions (created_at desc);
create index if not exists submissions_class_idx   on public.submissions (class_name);

-- Teacher question bank (feeds the whole-class guessing game).
create table if not exists public.questions (
  id         text primary key,
  prompt     text not null,
  attrs      jsonb not null,
  created_by text not null default 'teacher',
  created_at timestamptz not null default now()
);
create index if not exists questions_created_idx on public.questions (created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
-- SIMPLE CLASSROOM SETUP (no login): allow the anon key to read/write both
-- tables. Fine for a trusted classroom / single school. If you later add
-- Supabase Auth (teacher login), tighten these policies accordingly.
-- ----------------------------------------------------------------------------
alter table public.submissions enable row level security;
alter table public.questions   enable row level security;

create policy "anon all on submissions"
  on public.submissions for all
  to anon
  using (true) with check (true);

create policy "anon all on questions"
  on public.questions for all
  to anon
  using (true) with check (true);
