-- =========================================================================
-- RockyShoes Database Migration (Phase 3 Growth Features)
-- Execute this script in the Supabase SQL Editor to update your tables.
-- =========================================================================

-- 1. ADD ROLE TO PROFILES (default: customer, can be admin)
alter table public.profiles add column if not exists role text default 'customer' check (role in ('customer', 'admin'));

-- Elevate default user account to Admin (updates on match)
update public.profiles set role = 'admin' where email = 'prabhujsp1983@gmail.com';

-- 2. UPDATE ORDERS STATUS & TRACKING FIELDS
-- Drop the existing status check constraint if it exists to allow status expansion
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('pending', 'paid', 'failed', 'shipped', 'delivered', 'returning', 'returned', 'cancelled'));

-- Add shipping tracking fields
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists carrier text;
alter table public.orders add column if not exists estimated_delivery date;

-- 3. CREATE NEWSLETTER SUBSCRIBERS TABLE
create table if not exists public.newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on newsletter
alter table public.newsletter_subscribers enable row level security;

-- Policies for newsletter
drop policy if exists "Allow public insertion to newsletter" on public.newsletter_subscribers;
create policy "Allow public insertion to newsletter"
  on public.newsletter_subscribers for insert
  with check (true);

drop policy if exists "Allow admin read access to newsletter" on public.newsletter_subscribers;
create policy "Allow admin read access to newsletter"
  on public.newsletter_subscribers for select
  using (false); -- Admin reads will bypass using Service Role API key


-- 4. CREATE DATABASE CARTS & CART ITEMS (For Abandoned Cart Recovery)
create table if not exists public.carts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  cart_id uuid references public.carts(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null check (quantity > 0),
  size text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(cart_id, product_id, size)
);

-- Enable RLS on carts
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Policies for carts
drop policy if exists "Users can manage their own carts" on public.carts;
create policy "Users can manage their own carts"
  on public.carts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for cart_items
drop policy if exists "Users can manage their own cart items" on public.cart_items;
create policy "Users can manage their own cart items"
  on public.cart_items for all
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
      and carts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
      and carts.user_id = auth.uid()
    )
  );
