-- BANK OF ARIEN Database Schema Setup
-- Run this script in the Supabase SQL Editor.

-- Enable pgcrypto extension for gen_random_uuid
create extension if not exists pgcrypto;

-- 1. users table
create table if  not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text unique not null,
  username text unique not null,
  usertag text unique not null,
  avatar_url text,
  plan text default 'free', -- free | premium | elite
  is_frozen boolean default false,
  pin_hash text, -- simple pin like hash for transaction validation
  created_at timestamp with time zone default now()
);

-- 2. accounts table
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  iban text unique not null,
  name text not null,
  type text not null, -- checking | savings | credit
  balance numeric(12,2) default 0.00,
  currency text default 'EUR',
  created_at timestamp with time zone default now()
);

-- 3. transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  sender_account_id uuid references public.accounts(id) on delete set null, -- null = BANK OF ARIEN (internal/system)
  receiver_account_id uuid references public.accounts(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  category text, -- general, salary, food, rent, entertainment, savings, loan, etc.
  type text default 'transfer', -- transfer | bank_credit | interest | loan_payout | loan_repayment
  status text default 'completed', -- completed | pending | failed
  created_at timestamp with time zone default now()
);

-- 4. standing_orders table
create table if not exists public.standing_orders (
  id uuid primary key default gen_random_uuid(),
  sender_account_id uuid references public.accounts(id) on delete cascade,
  receiver_account_id uuid references public.accounts(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  interval text not null, -- weekly | monthly
  next_execution date not null,
  end_date date,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- 5. loans table
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  interest_rate numeric(5,2) not null,
  term_months int not null check (term_months > 0),
  monthly_payment numeric(12,2) not null,
  status text default 'pending', -- pending | approved | rejected | active | paid_off
  created_at timestamp with time zone default now()
);

-- 6. cards table
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  card_number text not null unique,
  expiry text not null,
  cvv text not null,
  type text default 'debit', -- debit | credit
  is_locked boolean default false,
  daily_limit numeric(12,2),
  monthly_limit numeric(12,2),
  design text default 'standard', -- standard | gold | black-metal | midnight-neon
  created_at timestamp with time zone default now()
);

-- 7. support_tickets table
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  subject text not null,
  message text not null,
  status text default 'open', -- open | answered | closed
  admin_reply text,
  created_at timestamp with time zone default now()
);

-- 8. notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null, -- transfer | info | system | loan | support
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- 9. admin_users table (Completely separate from Clerk/normal users)
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamp with time zone default now()
);

-- 10. admin_audit_log table
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_users(id) on delete cascade,
  action text not null,
  target_user_id uuid references public.users(id) on delete set null,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- =========================================================================
-- DATABASE FUNCTIONS & ATOMIC RPC PROCEDURES
-- =========================================================================

-- P2P Transfer RPC
-- Atomic operation that locks the accounts, checks balance, limits, and executes.
create or replace function public.transfer_money(
  p_sender_account_id uuid,
  p_receiver_account_id uuid,
  p_amount numeric,
  p_note text,
  p_category text
)
returns jsonb
language plpgsql
security definer -- runs with owner privileges
as $$
declare
  v_sender_user_id uuid;
  v_sender_balance numeric;
  v_sender_frozen boolean;
  v_sender_plan text;
  v_today_transferred numeric;
  v_daily_limit numeric;
  v_receiver_user_id uuid;
  v_sender_iban text;
  v_receiver_iban text;
begin
  -- 1. Retrieve sender and recipient details & Lock rows
  select user_id, balance, iban into v_sender_user_id, v_sender_balance, v_sender_iban
  from public.accounts
  where id = p_sender_account_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Absenderkonto existiert nicht.');
  end if;

  select user_id, iban into v_receiver_user_id, v_receiver_iban
  from public.accounts
  where id = p_receiver_account_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Empfängerkonto existiert nicht.');
  end if;

  -- 2. Check if sender user is frozen
  select is_frozen, plan into v_sender_frozen, v_sender_plan
  from public.users
  where id = v_sender_user_id;

  if v_sender_frozen then
    return jsonb_build_object('success', false, 'message', 'Ihr Benutzerkonto ist gesperrt.');
  end if;

  -- 3. Check for sufficient balance
  if v_sender_balance < p_amount then
    return jsonb_build_object('success', false, 'message', 'Ungenügendes Guthaben.');
  end if;

  -- 4. Check transfer limits based on Plan
  if v_sender_plan = 'free' then
    v_daily_limit := 500.00;
  elsif v_sender_plan = 'premium' then
    v_daily_limit := 5000.00;
  else
    v_daily_limit := 1000000.00; -- elite: effectively unlimited
  end if;

  -- Calculate total amount transferred today by this sender_account_id
  select coalesce(sum(amount), 0) into v_today_transferred
  from public.transactions
  where sender_account_id = p_sender_account_id
    and created_at >= date_trunc('day', now())
    and status = 'completed';

  if (v_today_transferred + p_amount) > v_daily_limit then
    return jsonb_build_object('success', false, 'message', 'Tägliches Überweisungslimit überschritten für Ihren Plan.');
  end if;

  -- 5. Perform Balances Updates
  update public.accounts
  set balance = balance - p_amount
  where id = p_sender_account_id;

  update public.accounts
  set balance = balance + p_amount
  where id = p_receiver_account_id;

  -- 6. Insert Transaction Record
  insert into public.transactions (sender_account_id, receiver_account_id, amount, note, category, type, status)
  values (p_sender_account_id, p_receiver_account_id, p_amount, p_note, p_category, 'transfer', 'completed');

  -- 7. Add Notification for receiver
  insert into public.notifications (user_id, type, message)
  values (
    v_receiver_user_id,
    'transfer',
    'Zahlung erhalten: ' || to_char(p_amount, '999G999D99') || ' EUR von IBAN ' || v_sender_iban
  );

  return jsonb_build_object('success', true, 'message', 'Überweisung erfolgreich ausgeführt.');
end;
$$;


-- Admin money transfer RPC (sender_account_id is null / BANK OF ARIEN)
create or replace function public.admin_send_money(
  p_receiver_account_id uuid,
  p_amount numeric,
  p_note text,
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_receiver_user_id uuid;
begin
  -- Lock receiver account
  select user_id into v_receiver_user_id
  from public.accounts
  where id = p_receiver_account_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Empfängerkonto existiert nicht.');
  end if;

  -- Update receiver balance
  update public.accounts
  set balance = balance + p_amount
  where id = p_receiver_account_id;

  -- Create internal transaction
  insert into public.transactions (sender_account_id, receiver_account_id, amount, note, category, type, status)
  values (null, p_receiver_account_id, p_amount, p_note, 'system', 'bank_credit', 'completed');

  -- Log action in audit log
  insert into public.admin_audit_log (admin_id, action, target_user_id, details)
  values (
    p_admin_id,
    'send_money_from_bank',
    v_receiver_user_id,
    jsonb_build_object('amount', p_amount, 'receiver_account_id', p_receiver_account_id, 'note', p_note)
  );

  -- Notify user
  insert into public.notifications (user_id, type, message)
  values (
    v_receiver_user_id,
    'system',
    'Gutschrift von BANK OF ARIEN: ' || to_char(p_amount, '999G999D99') || ' EUR. Hinweis: ' || p_note
  );

  return jsonb_build_object('success', true, 'message', 'Zahlung von BANK OF ARIEN erfolgreich gesendet.');
end;
$$;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

alter table public.users enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.standing_orders enable row level security;
alter table public.loans enable row level security;
alter table public.cards enable row level security;
alter table public.support_tickets enable row level security;
alter table public.notifications enable row level security;

-- Admin tables should not allow any client RLS (completely restricted to service role)
alter table public.admin_users enable row level security;
alter table public.admin_audit_log enable row level security;

-- Policies for public.users
create policy "Users can view their own profile" on public.users
  for select using (auth.uid()::text = clerk_id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid()::text = clerk_id);

-- Policies for public.accounts
create policy "Users can view their own accounts" on public.accounts
  for select using (auth.uid() in (select id from public.users where clerk_id = auth.uid()::text));

-- Policies for public.transactions
create policy "Users can view their own transactions" on public.transactions
  for select using (
    sender_account_id in (select id from public.accounts where user_id in (select id from public.users where clerk_id = auth.uid()::text)) or
    receiver_account_id in (select id from public.accounts where user_id in (select id from public.users where clerk_id = auth.uid()::text))
  );

-- Policies for public.standing_orders
create policy "Users can view their own standing orders" on public.standing_orders
  for select using (sender_account_id in (select id from public.accounts where user_id in (select id from public.users where clerk_id = auth.uid()::text)));

create policy "Users can manage their own standing orders" on public.standing_orders
  for all using (sender_account_id in (select id from public.accounts where user_id in (select id from public.users where clerk_id = auth.uid()::text)));

-- Policies for public.loans
create policy "Users can view their own loans" on public.loans
  for select using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can apply for loans" on public.loans
  for insert with check (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Policies for public.cards
create policy "Users can view their own cards" on public.cards
  for select using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can manage their cards" on public.cards
  for update using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Policies for public.support_tickets
create policy "Users can view their own support tickets" on public.support_tickets
  for select using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can create support tickets" on public.support_tickets
  for insert with check (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Policies for public.notifications
create policy "Users can view their own notifications" on public.notifications
  for select using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

create policy "Users can update their notifications" on public.notifications
  for update using (user_id in (select id from public.users where clerk_id = auth.uid()::text));
