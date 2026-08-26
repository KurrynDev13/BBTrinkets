export type Profile = {
  id: string;
  role: 'buyer' | 'seller';
  full_name: string;
  gcash_number?: string;
  created_at: string;
};

export type ProductCategory = 'Pins' | 'Keychains' | 'Artworks' | 'Prints' | 'Stickers';

export type Product = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  image_url: string;
  created_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
};

export type Order = {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  paymongo_checkout_id?: string;
  created_at: string;
};
