import React, { useState, useMemo } from 'react';
import { useInventory } from '../store/InventoryContext';
import { PriceListId } from '../types';
import { Search, Plus, ShoppingCart, Check, Loader2, Filter, ArrowUpDown } from 'lucide-react';
import CartSidebar from './CartSidebar';

interface CatalogProps {
  isSpecialList?: boolean;
}

const Catalog: React.FC<CatalogProps> = ({ isSpecialList = false }) => {
  const { products, addToCart, updateCartPrices, cart, isLoading } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedList, setSelectedList] = useState<PriceListId>(isSpecialList ? 4 : 1);
  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedSubfamily, setSelectedSubfamily] = useState('');
  const [sortOrder, setSortOrder] = useState<'name' | 'price_asc' | 'price_desc'>('name');
  
  // State for inputs: keys are product IDs, values are strings to allow empty state while typing
  const [localQuantities, setLocalQuantities] = useState<Record<string, string>>({});
  
  // State for "Added" feedback: stores the ID of the product recently added
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Extract unique families dynamically based on available stock
  const uniqueFamilies = useMemo(() => {
    const families = new Set(
      products
        .filter(p => p.stock > 0 && p.family) // Only consider products with stock
        .map(p => p.family)
    );
    return Array.from(families).sort();
  }, [products]);

  // Extract unique subfamilies based on selected Family
  const uniqueSubfamilies = useMemo(() => {
    const subfamilies = new Set(
      products
        .filter(p => {
           if (p.stock <= 0) return false;
           if (selectedFamily && p.family !== selectedFamily) return false;
           return !!p.subfamily;
        })
        .map(p => p.subfamily)
    );
    return Array.from(subfamilies).sort();
  }, [products, selectedFamily]);

  const getPrice = (product: any, listId: PriceListId) => {
    switch(listId) {
      case 1: return product.price_1;
      case 2: return product.price_2;
      case 3: return product.price_3;
      case 4: return product.price_4;
      default: return product.price_1;
    }
  };

  const handleListChange = (id: PriceListId) => {
    setSelectedList(id);
    // Automatically update prices of items already in cart
    updateCartPrices(id);
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      // FILTRO DE STOCK: Si no hay stock, no se muestra en la web.
      if (p.stock <= 0) return false;

      // Filter by Family
      if (selectedFamily && p.family !== selectedFamily) return false;

      // Filter by Subfamily
      if (selectedSubfamily && p.subfamily !== selectedSubfamily) return false;

      // Filter by search
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        p.name.toLowerCase().includes(term) || 
        p.subfamily.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term);
      
      return matchesSearch;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'price_asc') {
        return getPrice(a, selectedList) - getPrice(b, selectedList);
      }
      if (sortOrder === 'price_desc') {
        return getPrice(b, selectedList) - getPrice(a, selectedList);
      }
      // Default name A-Z
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [products, searchTerm, selectedFamily, selectedSubfamily, sortOrder, selectedList]);

  const handleFamilyChange = (val: string) => {
    setSelectedFamily(val);
    setSelectedSubfamily(''); // Reset subfamily when family changes
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

  // Determine theme colors
  const themeClass = isSpecialList 
    ? 'bg-red-800 border-red-700 text-white focus:ring-red-400 placeholder-red-300' 
    : 'bg-white border-gray-300 text-gray-700 focus:ring-alfonsa hover:border-alfonsa';
  
  const iconClass = isSpecialList ? 'text-red-300' : 'text-gray-400';

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top Bar */}
      <div className={`shadow-sm p-4 z-20 ${isSpecialList ? 'bg-red-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          
          {/* Group: List Selector + Title */}
          <div className="flex items-center w-full xl:w-auto justify-between xl:justify-start gap-4">
            {!isSpecialList ? (
              <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                {[1, 2, 3].map((id) => (
                  <button
                    key={id}
                    onClick={() => handleListChange(id as PriceListId)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all ${
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
               <div className="text-white font-bold text-lg flex items-center shrink-0">
                 <span className="bg-red-600 px-3 py-1 rounded text-sm uppercase tracking-wider shadow-lg border border-red-500">Catálogo Exclusivo</span>
               </div>
            )}
          </div>

          {/* Group: Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto flex-wrap items-center">
            
            {/* Sort Filter */}
            <div className="relative w-full sm:w-40">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ArrowUpDown className={`h-4 w-4 ${iconClass}`} />
              </div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className={`block w-full pl-10 pr-8 py-2 border rounded-lg appearance-none text-sm focus:ring-2 focus:outline-none cursor-pointer ${themeClass}`}
              >
                <option value="name" className="text-gray-900 bg-white">Nombre A-Z</option>
                <option value="price_asc" className="text-gray-900 bg-white">Menor Precio</option>
                <option value="price_desc" className="text-gray-900 bg-white">Mayor Precio</option>
              </select>
            </div>

            {/* Family Filter */}
            <div className="relative w-full sm:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className={`h-4 w-4 ${iconClass}`} />
              </div>
              <select
                value={selectedFamily}
                onChange={(e) => handleFamilyChange(e.target.value)}
                className={`block w-full pl-10 pr-8 py-2 border rounded-lg appearance-none text-sm focus:ring-2 focus:outline-none cursor-pointer ${themeClass}`}
              >
                <option value="" className="text-gray-500">Todas las Familias</option>
                {uniqueFamilies.map(f => (
                  <option key={f} value={f} className="text-gray-900 bg-white">{f}</option>
                ))}
              </select>
            </div>

            {/* SubFamily Filter (Conditional) */}
            {uniqueSubfamilies.length > 0 && (
              <div className="relative w-full sm:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className={`h-4 w-4 ${iconClass}`} />
                </div>
                <select
                  value={selectedSubfamily}
                  onChange={(e) => setSelectedSubfamily(e.target.value)}
                  className={`block w-full pl-10 pr-8 py-2 border rounded-lg appearance-none text-sm focus:ring-2 focus:outline-none cursor-pointer ${themeClass}`}
                >
                  <option value="" className="text-gray-500">Todas las Subfamilias</option>
                  {uniqueSubfamilies.map(f => (
                    <option key={f} value={f} className="text-gray-900 bg-white">{f}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${iconClass}`} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-sm ${themeClass}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
          <div className="max-w-7xl mx-auto">
            {/* Results Count */}
            <div className="mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center flex-wrap gap-2">
              <span>{filteredProducts.length} Productos</span>
              {selectedFamily && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded border border-orange-200">
                   F: {selectedFamily}
                </span>
              )}
              {selectedSubfamily && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">
                   S: {selectedSubfamily}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const price = getPrice(product, selectedList);
                const inputValue = localQuantities[product.id] ?? '1';
                const isAdded = addedFeedback === product.id;

                return (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    {/* Card Header */}
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 border border-gray-100 px-1 rounded truncate max-w-[70%]">
                           {product.family}
                         </span>
                      </div>
                      <h3 className="font-bold text-gray-800 leading-tight mb-2 min-h-[2.5rem] line-clamp-2" title={product.name}>
                        {product.name}
                      </h3>
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-gray-400 font-mono truncate max-w-[50%]" title={product.subfamily}>{product.subfamily}</span>
                        <div className={`text-2xl font-bold ${isSpecialList ? 'text-red-600' : 'text-alfonsa'}`}>
                          ${price.toLocaleString('es-AR')}
                        </div>
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
                          className="w-16 border border-gray-300 bg-white text-gray-900 rounded px-1 py-2 text-center text-lg font-medium focus:ring-2 focus:ring-alfonsa outline-none shadow-sm"
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
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-400 flex flex-col items-center">
                <Search className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-lg">No se encontraron productos.</p>
                <p className="text-sm">Intenta cambiar los filtros o la búsqueda.</p>
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