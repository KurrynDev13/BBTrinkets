export type SellerStatus = 'approved' | 'pending' | 'rejected' | 'none';

export type Profile = {
  id: string;
  role: 'buyer' | 'seller';
  full_name: string;
  email?: string;
  gcash_number?: string; // Primarily for buyers paying for orders
  address?: string; // Delivery address
  seller_status?: SellerStatus;
  is_admin?: boolean;
  shop_name?: string;
  craft_category?: string;
  portfolio_url?: string;
  bio?: string;
  application_note?: string;
  created_at: string;
  updated_at?: string;
};

export type SellerApplication = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  gcash_number?: string;
  shop_name?: string;
  craft_category?: string;
  portfolio_url?: string;
  bio_or_experience?: string;
  status: 'pending' | 'approved' | 'rejected';
  review_notes?: string;
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
};

export type ProductCategory = 'Pins' | 'Keychains' | 'Artworks' | 'Prints' | 'Stickers';

export type Product = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  weight_grams?: number;
  category: ProductCategory;
  image_url: string;
  material?: string;
  dimensions?: string;
  protection?: string;
  origin?: string;
  created_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  order_id?: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
  products?: {
    title: string;
    image_url: string;
  };
};

export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'completed' | 'cancelled' | 'declined';

export type OrderItem = {
  id?: string;
  order_id: string;
  product_id?: string;
  product_title: string;
  product_image?: string;
  quantity: number;
  price_at_time: number;
};

export type TrackingStatus = 'Seller to Pack' | 'Packed and ready to pick up' | 'Picked up' | 'In Transit' | 'Out for Delivery' | 'Delivered';

export type TrackingEvent = {
  status: TrackingStatus;
  timestamp: string;
};

export type Notification = {
  id: string;
  user_id: string;
  order_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  order?: {
    id: string;
  };
};

export type Order = {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: OrderStatus;
  paymongo_checkout_id?: string;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  payment_method?: string;
  tracking_number?: string;
  courier?: string;
  tracking_history?: TrackingEvent[];
  seller_notes?: string;
  decline_reason?: string | null;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
  buyer_profile?: Profile;
  has_reviewed?: boolean;
};

