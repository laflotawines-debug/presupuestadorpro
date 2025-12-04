import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, PriceListId } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { updateSingleProduct } from '../services/excelService';

interface InventoryContextType {
  products: Product[];
  refreshProducts: () => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  isLoading: boolean;
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, listId: PriceListId) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart still uses LocalStorage for session persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('alfonsa_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error fetching products from Supabase:', error.message || error);
          // If fetch fails, we might want to fail silently or fallback? 
          // For now, let's allow empty if error.
          setProducts([]); 
        } else {
          setProducts(data || []);
        }
      } else {
        // Fallback: Load from LocalStorage if Supabase is not set up
        const savedData = localStorage.getItem('alfonsa_products_backup');
        if (savedData) {
          setProducts(JSON.parse(savedData));
        } else {
          setProducts([]);
        }
      }
    } catch (err) {
      console.error("Unexpected error fetching products:", err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Persist cart when changed
  useEffect(() => {
    localStorage.setItem('alfonsa_cart', JSON.stringify(cart));
  }, [cart]);

  const refreshProducts = async () => {
    await fetchProducts();
  };

  const updateProduct = async (updatedProduct: Product) => {
    // Optimistic Update
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    
    try {
      await updateSingleProduct(updatedProduct);
    } catch (e) {
      console.error("Error updating product:", e);
      // Revert logic could go here, but keeping it simple for now
      alert("Error guardando el cambio en la base de datos.");
      await fetchProducts(); // Revert by refetching
    }
  };

  const addToCart = (product: Product, quantity: number, listId: PriceListId) => {
    // Determine price based on list
    let price = 0;
    switch(listId) {
      case 1: price = product.price_1; break;
      case 2: price = product.price_2; break;
      case 3: price = product.price_3; break;
      case 4: price = product.price_4; break;
      default: price = product.price_1;
    }

    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        // Enforce stock limit on update
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map(p => p.id === product.id ? { ...p, quantity: newQty } : p);
      } else {
        // Enforce stock limit on initial add
        const safeQty = Math.min(quantity, product.stock);
        if (safeQty <= 0) return prev;
        return [...prev, { ...product, quantity: safeQty, selectedPrice: price, selectedListId: listId }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(p => p.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        // Find original product to check stock again
        const originalProduct = products.find(p => p.id === productId);
        const maxStock = originalProduct ? originalProduct.stock : item.stock;
        return { ...item, quantity: Math.min(Math.max(0, quantity), maxStock) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.selectedPrice * item.quantity), 0);

  return (
    <InventoryContext.Provider value={{ 
      products, 
      refreshProducts,
      updateProduct,
      isLoading,
      cart, 
      addToCart, 
      removeFromCart, 
      updateCartQuantity,
      clearCart,
      cartTotal 
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};