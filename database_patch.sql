-- =========================================================================
-- RockyShoes Database Update & Patch Script
-- Execute this in the Supabase SQL Editor to apply policies, triggers, and
-- logic to existing tables without dropping/losing database tables or data.
-- =========================================================================

-- 1. PROFILE TRIGGERS & POLICIES
alter table public.profiles enable row level security;

drop policy if exists "Allow public read access to profiles" on public.profiles;
create policy "Allow public read access to profiles"
  on public.profiles for select
  using (true);

drop policy if exists "Allow users to update their own profile" on public.profiles;
create policy "Allow users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Allow users to insert their own profile" on public.profiles;
create policy "Allow users to insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger function for auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. ORDERS RLS POLICIES
alter table public.orders enable row level security;

drop policy if exists "Allow public to create orders (guest checkout)" on public.orders;
create policy "Allow public to create orders (guest checkout)"
  on public.orders for insert
  with check (true);

drop policy if exists "Allow users to view their own orders" on public.orders;
create policy "Allow users to view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Allow users to update their own pending orders" on public.orders;
create policy "Allow users to update their own pending orders"
  on public.orders for update
  using (auth.uid() = user_id);


-- 3. ORDER ITEMS RLS POLICIES
alter table public.order_items enable row level security;

drop policy if exists "Allow public to insert order items" on public.order_items;
create policy "Allow public to insert order items"
  on public.order_items for insert
  with check (true);

drop policy if exists "Allow users to view their own order items" on public.order_items;
create policy "Allow users to view their own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );


-- 4. INVENTORY STOCK DECREMENT TRIGGER
create or replace function public.handle_payment_success()
returns trigger as $$
declare
  item record;
begin
  if new.status = 'paid' and (old.status is null or old.status <> 'paid') then
    for item in 
      select product_id, quantity 
      from public.order_items 
      where order_id = new.id
    loop
      update public.products
      set stock = stock - item.quantity
      where id = item.product_id;
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_order_paid on public.orders;
create trigger on_order_paid
  after update on public.orders
  for each row execute procedure public.handle_payment_success();
