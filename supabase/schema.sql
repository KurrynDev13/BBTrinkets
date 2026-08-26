-- B&B Trinkets Database Schema

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('buyer', 'seller')) NOT NULL DEFAULT 'buyer',
  full_name TEXT,
  gcash_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Function & Trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, gcash_number)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'buyer'),
    COALESCE(new.raw_user_meta_data->>'gcash_number', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Products Table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT CHECK (category IN ('Pins', 'Keychains', 'Artworks', 'Prints')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone." ON products FOR SELECT USING (true);
CREATE POLICY "Sellers can insert their own products." ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own products." ON products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their own products." ON products FOR DELETE USING (auth.uid() = seller_id);

-- 3. Orders Table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'cancelled')) DEFAULT 'pending',
  paymongo_checkout_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers can view their own orders." ON orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can create their own orders." ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- 4. Order Items Table
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_time DECIMAL(10, 2) NOT NULL
);

-- Enable RLS for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers can view their own order items." ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
);
CREATE POLICY "Buyers can insert their own order items." ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
);

-- 5. Reviews Table
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone." ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews." ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews." ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews." ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Create a view for seller sales history
CREATE OR REPLACE VIEW seller_sales AS
SELECT 
  o.id AS order_id,
  o.status,
  o.created_at,
  oi.quantity,
  oi.price_at_time,
  p.title AS product_title,
  p.seller_id
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id;
