import { supabase } from '../lib/supabase';
import type { Product } from '../types';

// Placeholder products have been removed from the repository.
// Products are now managed dynamically through Supabase storage bucket & database.
export const INITIAL_PRODUCTS: Product[] = [];

// Global cache for product fetching to improve loading times across pages
let cachedProductsPromise: Promise<Product[]> | null = null;
let cachedProductsData: Product[] | null = null;

export const fetchGlobalProducts = async (forceRefresh = false): Promise<Product[]> => {
  if (cachedProductsData && !forceRefresh) {
    return cachedProductsData;
  }
  
  if (cachedProductsPromise && !forceRefresh) {
    return cachedProductsPromise;
  }

  cachedProductsPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        cachedProductsData = data;
        return data;
      }
      return [];
    } catch (err) {
      console.warn('Supabase fetch failed:', err);
      return [];
    }
  })();

  return cachedProductsPromise;
};

