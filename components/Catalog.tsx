import React, { useState, useMemo } from 'react';
import { useInventory } from '../store/InventoryContext';
import { PriceListId } from '../types';
import { Search, Plus, AlertCircle, ShoppingCart, Check, Loader2 } from 'lucide-react';
import CartSidebar from './CartSidebar';

interface CatalogProps {
  isSpecialList?: boolean;
}

const Catalog: React.FC<CatalogProps> = ({ isSpecialList = false }) => {
  const { products, addToCart, cart, isLoading } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedList, setSelectedList] = useState<PriceListId>(isSpecialList ? 4 : 1);
  
  // State for inputs: keys are product IDs, values are strings to allow empty state while typing
  const [localQuantities, setLocalQuantities] = useState<Record<string, string>>({});
  
  // State for "Added" feedback: stores the ID of the product recently added
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // FILTRO DE STOCK: Si no hay stock, no se muestra en la web.
      if (p.stock <= 0) return false;

      // Filter by search
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.subfamily.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [products, searchTerm]);

  const getPrice = (product: any, listId: PriceListId) => {
    switch(listId) {
      case 1: return product.price_1;
      case 2: return product.price_2;
      case 3: return product.price_3;
      case 4: return product.price_4;
      default: return product.price_1;
    }
  };

  const handleQuantityChange = (id: string, val: string, max: number) => {
    // Allow empty string to let user delete content
    if (val === '') {
      setLocalQuantities(prev => ({ ...prev, [id]: '' }));
      return;
    }

    let num = parseInt(val);
    
    if (isNaN(num)) return; // Ignore non-numeric inputs
    
    // Validate range
    if (num < 0) num = 1;
    if (num > max) num = max;
    
    setLocalQuantities(prev => ({ ...prev, [id]: String(num) }));
  };

  const handleAdd = (product: any) => {
    // Default to 1 if empty or undefined
    const rawQty = localQuantities[product.id];
    const qty = rawQty && rawQty !== '' ? parseInt(rawQty) : 1;

    if (qty > 0 && qty <= product.stock) {
      addToCart(product, qty, selectedList);
      
      // Reset input to 1 for convenience
      setLocalQuantities(prev => ({ ...prev, [product.id]: '1' })); 
      
      // Trigger visual feedback
      setAddedFeedback(product.id);
      setTimeout(() => setAddedFeedback(null), 1500);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top Bar */}
      <div className={`shadow-sm p-4 z-20 ${isSpecialList ? 'bg-red-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Price List Selector (Hidden if Special) */}
          {!isSpecialList ? (
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {[1, 2, 3].map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedList(id as PriceListId)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                    selectedList === id 
                      ? 'bg-white text-alfonsa shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Lista {id}
                </button>
              ))}
            </div>
          ) : (
             <div className="text-white font-bold text-lg flex items-center">
               <span className="bg-red-600 px-3 py-1 rounded text-sm uppercase tracking-wider">Catálogo Exclusivo</span>
             </div>
          )}

          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-sm
                ${isSpecialList 
                  ? 'bg-red-800 border-red-700 text-white placeholder-red-300 focus:ring-red-400' 
                  : 'bg-white border-gray-300 focus:ring-alfonsa'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
               <Loader2 className="w-10 h-10 animate-spin text-alfonsa mb-3" />
               <p>Cargando productos...</p>
            </div>
          ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const price = getPrice(product, selectedList);
              const inputValue = localQuantities[product.id] ?? '1';
              const isAdded = addedFeedback === product.id;

              return (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                  {/* Card Header */}
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-mono text-gray-400">{product.subfamily}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 leading-tight mb-2 h-10 overflow-hidden line-clamp-2">
                      {product.name}
                    </h3>
                    <div className={`text-2xl font-bold ${isSpecialList ? 'text-red-600' : 'text-alfonsa'}`}>
                      ${price.toLocaleString('es-AR')}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={inputValue}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value, product.stock)}
                        onClick={(e) => (e.target as HTMLInputElement).select()} 
                        className="w-20 border border-gray-300 bg-white text-gray-900 rounded px-2 py-2 text-center text-lg font-medium focus:ring-2 focus:ring-alfonsa outline-none shadow-sm"
                      />
                      <button 
                        onClick={() => handleAdd(product)}
                        disabled={isAdded}
                        className={`flex-1 flex items-center justify-center text-sm font-bold text-white py-2 rounded transition-all duration-200 shadow-sm
                            ${isAdded 
                              ? 'bg-green-500 scale-105' 
                              : isSpecialList 
                                ? 'bg-gray-800 hover:bg-black' 
                                : 'bg-alfonsa hover:bg-alfonsa-dark'}`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-5 h-5 mr-1" /> ¡Agregado!
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5 mr-1" /> Agregar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-400">
                <p>No se encontraron productos disponibles con ese criterio.</p>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <CartSidebar 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          isSpecial={isSpecialList}
        />

      </div>

      {/* Mobile Cart Floating Button */}
      {!isCartOpen && cart.length > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl text-white z-50 flex items-center transform transition-transform hover:scale-110
             ${isSpecialList ? 'bg-red-700' : 'bg-alfonsa'}`}
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {cart.length}
          </span>
          <span className="ml-2 font-bold hidden md:inline">Ver Presupuesto</span>
        </button>
      )}
    </div>
  );
};

export default Catalog;
