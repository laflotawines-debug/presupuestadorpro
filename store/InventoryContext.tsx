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
  updateCartPrices: (newListId: PriceListId) => void;
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
      let all: Product[] = [];
      let from = 0;
      const size = 1000;

      while (true) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true })
          .range(from, from + size - 1);

        if (error) {
          console.error("Error fetching products page:", error);
          break;
        }

        if (!data || data.length === 0) {
          break; // no más filas
        }

        all = [...all, ...data];

        if (data.length < size) {
          break; // última página
        }

        from += size; // siguiente página
      }

      setProducts(all);
    } else {
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
      alert("Error guardando el cambio en la base de datos.");
      await fetchProducts(); // Revert by refetching
    }
  };

  const getPriceByList = (product: Product, listId: PriceListId): number => {
    switch(listId) {
      case 1: return product.price_1;
      case 2: return product.price_2;
      case 3: return product.price_3;
      case 4: return product.price_4;
      default: return product.price_1;
    }
  };

  const addToCart = (product: Product, quantity: number, listId: PriceListId) => {
    const price = getPriceByList(product, listId);

    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        // Enforce stock limit on update
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        // If we add to existing, we update the price to the CURRENT selection list too, or keep old?
        // Prompt says: "lists never mix". So if I add, I should probably enforce the new list on this item.
        return prev.map(p => p.id === product.id ? { ...p, quantity: newQty, selectedPrice: price, selectedListId: listId } : p);
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
        const originalProduct = products.find(p => p.id === productId);
        const maxStock = originalProduct ? originalProduct.stock : item.stock;
        return { ...item, quantity: Math.min(Math.max(0, quantity), maxStock) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // New function to update all prices in cart when list changes
  const updateCartPrices = (newListId: PriceListId) => {
    setCart(prev => prev.map(item => {
      const originalProduct = products.find(p => p.id === item.id);
      if (!originalProduct) return item; // Should not happen usually
      
      const newPrice = getPriceByList(originalProduct, newListId);
      
      return {
        ...item,
        selectedPrice: newPrice,
        selectedListId: newListId
      };
    }));
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
      updateCartPrices,
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