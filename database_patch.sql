-- =========================================================================
-- RockyShoes Database Patch: Return Requests & Support Tickets
-- Execute this script in the Supabase SQL Editor to update your tables.
-- =========================================================================

-- 1. CREATE SUPPORT TICKETS TABLE
create table if not exists public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  category text not null check (category in ('refund', 'return', 'delivery', 'payment', 'inquiry', 'other')),
  subject text not null,
  message text not null,
  status text default 'open' check (status in ('open', 'resolved', 'closed')),
  resolution_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.support_tickets enable row level security;

-- Policies for support_tickets
drop policy if exists "Users can insert their own support tickets" on public.support_tickets;
create policy "Users can insert their own support tickets"
  on public.support_tickets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own support tickets" on public.support_tickets;
create policy "Users can view their own support tickets"
  on public.support_tickets for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage all support tickets" on public.support_tickets;
create policy "Admins can manage all support tickets"
  on public.support_tickets for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );


-- 2. CREATE RETURN REQUESTS TABLE
create table if not exists public.return_requests (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade unique not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  items jsonb not null, -- Array of returned items: [{product_id, quantity, size}]
  reason text not null check (reason in ('size_issue', 'wrong_item', 'damaged', 'quality_issue', 'other')),
  comments text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.return_requests enable row level security;

-- Policies for return_requests
drop policy if exists "Users can manage their own return requests" on public.return_requests;
create policy "Users can manage their own return requests"
  on public.return_requests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins can manage all return requests" on public.return_requests;
create policy "Admins can manage all return requests"
  on public.return_requests for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
