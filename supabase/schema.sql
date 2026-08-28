-- ==============================================================================
-- B&B TRINKETS COMPLETE SUPABASE SETUP SCRIPT (DATABASE SCHEMA & STORAGE BUCKET)
-- ==============================================================================
-- Run this in your Supabase Project SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Buyer, Seller & Admin accounts linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('buyer', 'seller')) NOT NULL DEFAULT 'buyer',
  full_name TEXT,
  email TEXT,
  gcash_number TEXT,
  address TEXT,
  seller_status TEXT CHECK (seller_status IN ('approved', 'pending', 'rejected', 'none')) NOT NULL DEFAULT 'none',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  shop_name TEXT,
  craft_category TEXT,
  portfolio_url TEXT,
  bio TEXT,
  application_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.5 Helper function to check if current user is admin/founding seller without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_admin = true OR email = 'rhymnoorioque@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles." ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR public.is_admin() OR auth.jwt()->>'email' = 'rhymnoorioque@gmail.com'
);
DROP POLICY IF EXISTS "Users can delete own profile." ON public.profiles;
CREATE POLICY "Users can delete own profile." ON public.profiles FOR DELETE USING (
  auth.uid() = id OR public.is_admin() OR auth.jwt()->>'email' = 'rhymnoorioque@gmail.com'
);
CREATE POLICY "Admins can update all profiles." ON public.profiles FOR ALL USING (
  public.is_admin() OR auth.jwt()->>'email' = 'rhymnoorioque@gmail.com'
);

-- Trigger to automatically create a profile on new Supabase signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role TEXT;
  v_seller_status TEXT;
  v_is_admin BOOLEAN;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'buyer');
  
  -- The first/founding seller (rhymnoorioque@gmail.com) is automatically verified admin seller
  IF new.email = 'rhymnoorioque@gmail.com' OR (new.raw_user_meta_data->>'is_admin')::boolean = true THEN
    v_role := 'seller';
    v_seller_status := 'approved';
    v_is_admin := true;
  ELSIF v_role = 'seller' THEN
    -- All other new sellers start with pending application status until admin approves
    v_seller_status := 'pending';
    v_is_admin := false;
  ELSE
    v_seller_status := 'none';
    v_is_admin := false;
  END IF;

  INSERT INTO public.profiles (
    id, full_name, email, role, gcash_number, seller_status, is_admin, shop_name, craft_category, portfolio_url, bio
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    v_role,
    COALESCE(new.raw_user_meta_data->>'gcash_number', ''),
    v_seller_status,
    v_is_admin,
    COALESCE(new.raw_user_meta_data->>'shop_name', ''),
    COALESCE(new.raw_user_meta_data->>'craft_category', ''),
    COALESCE(new.raw_user_meta_data->>'portfolio_url', ''),
    COALESCE(new.raw_user_meta_data->>'bio', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

  -- If signing up as a seller and not founding admin, record in seller_applications table
  IF v_role = 'seller' AND NOT v_is_admin THEN
    INSERT INTO public.seller_applications (
      user_id, full_name, email, gcash_number, shop_name, craft_category, portfolio_url, bio_or_experience, status
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      new.email,
      COALESCE(new.raw_user_meta_data->>'gcash_number', ''),
      COALESCE(new.raw_user_meta_data->>'shop_name', ''),
      COALESCE(new.raw_user_meta_data->>'craft_category', 'Pins & Art'),
      COALESCE(new.raw_user_meta_data->>'portfolio_url', ''),
      COALESCE(new.raw_user_meta_data->>'bio', ''),
      'pending'
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2.5 Seller Applications Table (For Admin / Founding Seller to review and approve)
CREATE TABLE IF NOT EXISTS public.seller_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  gcash_number TEXT NOT NULL,
  shop_name TEXT,
  craft_category TEXT,
  portfolio_url TEXT,
  bio_or_experience TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending' NOT NULL,
  review_notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Applicants can view their own application." ON public.seller_applications;
DROP POLICY IF EXISTS "Applicants can create applications." ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can view and manage all applications." ON public.seller_applications;

CREATE POLICY "Applicants can view their own application." ON public.seller_applications FOR SELECT USING (
  auth.uid() = user_id OR public.is_admin() OR auth.jwt()->>'email' = 'rhymnoorioque@gmail.com'
);
CREATE POLICY "Applicants can create applications." ON public.seller_applications FOR INSERT WITH CHECK (
  auth.uid() = user_id OR public.is_admin() OR auth.jwt()->>'email' = 'rhymnoorioque@gmail.com'
);
CREATE POLICY "Admins can view and manage all applications." ON public.seller_applications FOR ALL USING (
  auth.uid() = user_id OR public.is_admin() OR auth.jwt()->>'email' = 'rhymnoorioque@gmail.com'
);

-- 3. Products Table (Artworks, Prints, Pins, Keychains, Stickers)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  weight_grams INTEGER DEFAULT 100,
  category TEXT CHECK (category IN ('Pins', 'Keychains', 'Artworks', 'Prints', 'Stickers')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: Since we are adding weight_grams, we run ALTER TABLE to safely add it if table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='weight_grams') THEN
    ALTER TABLE public.products ADD COLUMN weight_grams INTEGER DEFAULT 100;
  END IF;
END $$;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone." ON public.products;
DROP POLICY IF EXISTS "Sellers can insert their own products." ON public.products;
DROP POLICY IF EXISTS "Sellers can update their own products." ON public.products;
DROP POLICY IF EXISTS "Sellers can delete their own products." ON public.products;

CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Sellers can insert their own products." ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own products." ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their own products." ON public.products FOR DELETE USING (
  auth.uid() = seller_id OR public.is_admin() OR auth.jwt()->>'email' = 'rhymnoorioque@gmail.com'
);

-- 4. Orders Table (Full Shopee/Lazada Order Lifecycle)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'preparing', 'shipped', 'completed', 'cancelled', 'delivered')) DEFAULT 'pending',
  paymongo_checkout_id TEXT,
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  payment_method TEXT,
  courier TEXT,
  tracking_number TEXT,
  tracking_history JSONB DEFAULT '[]'::jsonb,
  seller_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure orders_status_check accepts all current statuses even if table was created in an earlier migration
DO $$
BEGIN
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
  ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'paid', 'preparing', 'shipped', 'completed', 'cancelled', 'delivered'));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Add tracking_history column safely if table already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='tracking_history') THEN
    ALTER TABLE public.orders ADD COLUMN tracking_history JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Buyers can view their own orders." ON public.orders;
DROP POLICY IF EXISTS "Buyers can create their own orders." ON public.orders;
DROP POLICY IF EXISTS "Buyers can update their own orders." ON public.orders;
DROP POLICY IF EXISTS "Sellers can view all orders." ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status." ON public.orders;

CREATE POLICY "Buyers can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can create their own orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can update their own orders." ON public.orders FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view all orders." ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'seller')
);
CREATE POLICY "Sellers can update order status." ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'seller')
);

-- 4.5 Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, order_id)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
DROP POLICY IF EXISTS "Sellers can insert notifications." ON public.notifications;
DROP POLICY IF EXISTS "Sellers can update notifications." ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications." ON public.notifications;

CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sellers can view notifications." ON public.notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'seller')
);
CREATE POLICY "Users can update their own notifications." ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Sellers can insert notifications." ON public.notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'seller')
);
CREATE POLICY "Sellers can update notifications." ON public.notifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'seller')
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_time DECIMAL(10, 2) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Buyers can view their own order items." ON public.order_items;
DROP POLICY IF EXISTS "Buyers can insert their own order items." ON public.order_items;
DROP POLICY IF EXISTS "Sellers can view order items." ON public.order_items;

CREATE POLICY "Buyers can view their own order items." ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
);
CREATE POLICY "Buyers can insert their own order items." ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
);
CREATE POLICY "Sellers can view order items." ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'seller')
);

-- 6. Reviews Table (1-5 Star ratings & comments)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews." ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews." ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews." ON public.reviews;

CREATE POLICY "Reviews are viewable by everyone." ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews." ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews." ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews." ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 7. SUPABASE STORAGE BUCKET FOR ARTWORKS & TRINKET IMAGES ('product-images')
-- ==============================================================================
-- Create the public bucket if not already present
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for 'product-images' bucket
DROP POLICY IF EXISTS "Product images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images." ON storage.objects;
DROP POLICY IF EXISTS "Sellers can delete and update product images." ON storage.objects;

CREATE POLICY "Product images are publicly accessible."
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images."
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Sellers can delete and update product images."
ON storage.objects FOR ALL
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ==============================================================================
-- 8. ACCOUNT DELETION STORED PROCEDURE (Deletes from public tables & auth.users)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  curr_uid UUID;
BEGIN
  curr_uid := auth.uid();
  IF curr_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Delete user reviews
  DELETE FROM public.reviews WHERE user_id = curr_uid;

  -- 2. Delete buyer orders and order items
  DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE buyer_id = curr_uid);
  DELETE FROM public.orders WHERE buyer_id = curr_uid;

  -- 3. Delete seller products if any
  DELETE FROM public.products WHERE seller_id = curr_uid;

  -- 4. Delete seller applications
  DELETE FROM public.seller_applications WHERE user_id = curr_uid;

  -- 5. Delete profile record
  DELETE FROM public.profiles WHERE id = curr_uid;

  -- 6. Delete the authentication user record
  DELETE FROM auth.users WHERE id = curr_uid;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ==============================================================================
-- DATABASE MIGRATIONS & FIXES (August 2026)
-- Run these statements in the Supabase SQL Editor if you are updating an existing database.
-- ==============================================================================

-- 1. Remove the restrictive CHECK constraint on the category column to allow 'Stickers'
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.products'::regclass AND contype = 'c' AND consrc ILIKE '%category%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.products DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

-- 2. Alter weight_grams to support decimals (FLOAT/DECIMAL)
ALTER TABLE public.products ALTER COLUMN weight_grams TYPE DECIMAL(10, 2);

-- 3. Add stock column for inventory management
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- 4. Update products RLS policy so any approved seller can edit any existing product
DROP POLICY IF EXISTS "Sellers can update their own products." ON public.products;
CREATE POLICY "Sellers can update any product." ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'seller')
);
