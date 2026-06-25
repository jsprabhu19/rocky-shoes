-- =======================================================
-- RockyShoes Supabase Schema & Seed Script
-- Execute this script in the Supabase SQL Editor
-- =======================================================

-- 1. DROP EXISTING TABLES (If any, for fresh setup)
drop table if exists public.order_items;
drop table if exists public.orders;
drop table if exists public.products;
drop table if exists public.profiles;

-- 2. CREATE PROFILES TABLE (Linked to Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  full_name text,
  email text,
  phone text,
  address text
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

create policy "Allow public read access to profiles"
  on public.profiles for select
  using (true);

create policy "Allow users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow users to insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3. CREATE PRODUCTS TABLE
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  category text not null check (category in ('sneakers', 'running_shoes', 'boots')),
  image_url text,
  stock integer default 10 check (stock >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Products
alter table public.products enable row level security;

create policy "Allow public read access to products"
  on public.products for select
  using (true);

create policy "Allow admins to modify products"
  on public.products for all
  using (false) -- Overridden by service role API key on server
  with check (false);

-- 4. CREATE ORDERS TABLE
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  full_name text not null,
  phone text,
  shipping_address text not null,
  total_amount numeric not null check (total_amount >= 0),
  status text default 'pending' check (status in ('pending', 'paid', 'failed', 'shipped', 'cancelled')),
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Orders
alter table public.orders enable row level security;

create policy "Allow public to create orders (guest checkout)"
  on public.orders for insert
  with check (true);

create policy "Allow users to view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Allow users to update their own pending orders"
  on public.orders for update
  using (auth.uid() = user_id);

-- 5. CREATE ORDER ITEMS TABLE
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  price numeric not null check (price >= 0)
);

-- Enable RLS on Order Items
alter table public.order_items enable row level security;

create policy "Allow public to insert order items"
  on public.order_items for insert
  with check (true);

create policy "Allow users to view their own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- 6. PROFILE CREATION TRIGGER FOR AUTH USER SIGNUP
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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6.5. STOCK DECREMENT RPC FUNCTION
create or replace function public.decrement_product_stock(product_id_param uuid, qty_param integer)
returns void as $$
begin
  update public.products
  set stock = stock - qty_param
  where id = product_id_param;
end;
$$ language plpgsql security definer;

-- 7. SEED DATA FOR PRODUCTS
insert into public.products (name, description, price, category, image_url, stock) values
-- Sneakers (10 shoes)
('Rocky RetroClassic', 'Vintage design crafted with premium leather upper, cushioned midsole, and durable rubber outsole for timeless style and comfort.', 3499, 'sneakers', '/images/sneakers/img-1.jpg', 15),
('Rocky StreetPulse', 'Chunky retro silhouette featuring layered mesh and suede overlays. Designed for modern street style and all-day cushioning.', 4299, 'sneakers', '/images/sneakers/img-2.jpg', 12),
('Rocky NeonFlux', 'Futuristic sneakers with bold accents, breathable knit upper, and semi-translucent air-sole unit for unmatched energy return.', 4999, 'sneakers', '/images/sneakers/img-3.jpg', 8),
('Rocky CourtKing', 'Low-profile court classic in durable canvas, clean minimal stitching, and signature vulcanized vulcan sole.', 2999, 'sneakers', '/images/sneakers/img-4.jpg', 20),
('Rocky Driftwood', 'Eco-friendly and sustainable woven knit sneaker. Ultra-breathable design made with 100% recycled materials.', 3899, 'sneakers', '/images/sneakers/img-5.jpg', 14),
('Rocky AirLift', 'Iconic lifestyle sneaker featuring signature max-air cushioning, breathable mesh panels, and robust heel support.', 5299, 'sneakers', '/images/sneakers/img-6.jpg', 10),
('Rocky UrbanGlide', 'Sleek, slip-on sneaker design with responsive knit and elastic strap support. Ideal for light running and urban commutes.', 3799, 'sneakers', '/images/sneakers/img-7.jpg', 18),
('Rocky PrimeCruiser', 'Luxurious sneaker crafted with supple calfskin leather, metal eyelets, and memory foam insoles.', 5999, 'sneakers', '/images/sneakers/img-8.jpg', 6),
('Rocky StealthWalk', 'Monochromatic black-out design with reflective safety accents and dynamic traction outsole pattern.', 4499, 'sneakers', '/images/sneakers/img-9.jpg', 15),
('Rocky AeroLite', 'Super-lightweight breathable summer sneaker with flexible slip-resistant EVA sole unit.', 3199, 'sneakers', '/images/sneakers/img-10.jpg', 22),

-- Running Shoes (7 shoes)
('Rocky AeroStride', 'Designed for speed. Engineered knit upper with responsive foam midsole that propels you forward on daily road runs.', 4999, 'running_shoes', '/images/running-shoes/img-1.jpg', 12),
('Rocky TrailBlazer', 'Rugged trail running shoe with deep lugs, mudguard, and rock plate for aggressive off-road performance.', 5499, 'running_shoes', '/images/running-shoes/img-2.jpg', 10),
('Rocky PaceMaker', 'High-performance marathon shoe featuring a carbon-fiber plate and ultra-cushioned responsive foam.', 6299, 'running_shoes', '/images/running-shoes/img-3.jpg', 5),
('Rocky CloudBurst', 'Fully waterproof running shoe with breathable membrane to keep your feet dry in rainy running conditions.', 5999, 'running_shoes', '/images/running-shoes/img-4.jpg', 8),
('Rocky Velocity-X', 'Elite trainer designed for high mileage. Seamless engineered mesh upper combined with durable rubber traction pads.', 7499, 'running_shoes', '/images/running-shoes/img-5.jpg', 7),
('Rocky FlexCore', 'Minimalist, low drop training shoe that supports natural foot mechanics and flexibility.', 3999, 'running_shoes', '/images/running-shoes/img-6.jpg', 15),
('Rocky SwiftStream', 'Highly ventilated running shoe with mesh grid patterns. Perfect for hot summer training runs.', 4599, 'running_shoes', '/images/running-shoes/img-7.jpg', 11),

-- Boots (10 shoes)
('Rocky IronClad', 'Legendary 6-inch work boot built with water-resistant oiled leather, Goodyear welt construction, and lugged sole.', 8999, 'boots', '/images/boots/boot_1_1782232192741.png', 10),
('Rocky SummitPro', 'Heavy-duty insulated mountaineering boot with protective rubber rand, crampon compatibility, and GORE-TEX lining.', 11999, 'boots', '/images/boots/boot_2_1782232205099.png', 4),
('Rocky UrbanTrek', 'Sleek suede Chelsea boots with flexible elastic side panels and lightweight crepe sole. Merges style and versatility.', 7499, 'boots', '/images/boots/boot_3_1782232215729.png', 12),
('Rocky DesertStorm', 'Lightweight, breathable tactical boot in coyote tan. Engineered with high-traction slip-resistant sole.', 8499, 'boots', '/images/boots/boot_4_1782232228908.png', 8),
('Rocky WinterShield', 'Fully waterproof winter boot lined with 200g insulation. Rated to keep feet warm down to -20°C.', 9999, 'boots', '/images/boots/boot_5_1782232238692.png', 6),
('Rocky Nomad', 'Classic Moc-Toe wedge boot crafted with soft full-grain leather. Combines comfort and rugged appeal.', 6999, 'boots', '/images/boots/boot_6_1782232249140.png', 15),
('Rocky RidgeLine', 'Premium hiking boot with nubuck leather upper and Vibram outsoles for exceptional stability on rugged terrains.', 8299, 'boots', '/images/boots/boot_7_1782232262109.png', 9),
('Rocky StealthBoot', 'Matte black tactical boot featuring side-zip entry, composite safety toe, and oil-resistant outsole.', 8799, 'boots', '/images/boots/boot_8_1782232270790.png', 11),
('Rocky TimberTrek', 'Vintage styled heritage boots with triple-stitched details and padded collar for all-day ankle comfort.', 9499, 'boots', '/images/boots/boot_9_1782232281904.png', 7),
('Rocky ApexHiker', 'Modern hybrid boot combining the lightweight feel of a sneaker with the ankle support of a hiking boot.', 10499, 'boots', '/images/boots/boot_10_1782232293780.png', 8);
