# Flowmapr — Supabase Database Schema

## Tables

### users (managed by Supabase Auth)
Extended via `profiles` table.

---

### profiles
```sql
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);
```

---

### subscriptions
```sql
create table subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  plan                text not null default 'free_trial',
                      -- values: 'free_trial' | 'basic' | 'pro'
  status              text not null default 'active',
                      -- values: 'active' | 'canceled' | 'past_due'
  polar_subscription_id text unique,
  monthly_limit       int not null default 2,
                      -- free_trial: 2 (lifetime), basic: 100, pro: 500
  generations_used    int not null default 0,
  period_start        timestamptz,
  period_end          timestamptz,
  cancel_at_period_end boolean default false,
  updated_at          timestamptz default now()
);
```

**Notes:**
- For `free_trial`, `monthly_limit = 2` is a lifetime cap, not monthly. `period_start/end` are null.
- Counter reset logic: on Polar webhook `subscription.created` / renewal event, set `generations_used = 0` and update `period_start/end`.
- Decrement atomically: `UPDATE subscriptions SET generations_used = generations_used + 1 WHERE user_id = $1 AND generations_used < monthly_limit RETURNING *` — if 0 rows returned, quota exceeded.

---

### diagrams
```sql
create table diagrams (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  title         text not null default 'Untitled diagram',
  diagram_type  text not null,
                -- values: 'bpmn' | 'user_flow'
  flow_data     jsonb not null default '{"nodes":[],"edges":[]}',
                -- React Flow nodes + edges JSON
  is_public     boolean default false,
  public_slug   text unique,
                -- short ID for share links: /share/[public_slug]
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Index for workspace list query
create index diagrams_user_id_updated_at on diagrams(user_id, updated_at desc);
```

---

### generation_log
```sql
create table generation_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  diagram_id    uuid references diagrams(id) on delete set null,
  prompt        text,
  diagram_type  text,
  success       boolean default true,
  tokens_used   int,
  created_at    timestamptz default now()
);
```

Used for debugging, cost monitoring, and future prompt improvement.

---

## Row Level Security (RLS)

Enable RLS on all tables. Key policies:

```sql
-- profiles: users can only read/update their own profile
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- subscriptions: users can only read their own
alter table subscriptions enable row level security;
create policy "Users can view own subscription" on subscriptions
  for select using (auth.uid() = user_id);
-- Updates to subscriptions happen via service role only (webhooks)

-- diagrams: users can CRUD own; public diagrams readable by anyone
alter table diagrams enable row level security;
create policy "Users can manage own diagrams" on diagrams
  for all using (auth.uid() = user_id);
create policy "Public diagrams readable by anyone" on diagrams
  for select using (is_public = true);

-- generation_log: users can view own, insert own
alter table generation_log enable row level security;
create policy "Users can view own logs" on generation_log
  for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on generation_log
  for insert with check (auth.uid() = user_id);
```

---

## Supabase Triggers

```sql
-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.subscriptions (user_id, plan, monthly_limit)
  values (new.id, 'free_trial', 2);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at on diagrams
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger diagrams_updated_at
  before update on diagrams
  for each row execute procedure update_updated_at();
```

---

## Diagram Count Limits by Plan

| Plan | Max Diagrams |
|---|---|
| free_trial | 5 |
| basic | 50 |
| pro | unlimited (null) |

Enforce in the `/api/diagrams` POST route before inserting.
