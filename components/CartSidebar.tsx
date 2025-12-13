import React, { useState } from 'react';
import { useInventory } from '../store/InventoryContext';
import { Trash2, X, FileText, Send, ShoppingCart, ArrowLeft } from 'lucide-react';
import { generatePDF, generateWhatsAppLink } from '../services/pdfService';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isSpecial?: boolean;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, isSpecial }) => {
  const { cart, removeFromCart, updateCartQuantity, cartTotal, clearCart } = useInventory();
  const cartToRender = isSpecial 
    ? cart.filter(item => item.selectedListId === 4)
    : cart.filter(item => item.selectedListId !== 4);

  const currentCartTotal = cartToRender.reduce((sum, item) => sum + (item.selectedPrice * item.quantity), 0);

  const [clientName, setClientName] = useState('');

  const handleExportPDF = () => {
    if (cartToRender.length === 0) return;
    const name = clientName || window.prompt('Ingrese nombre del cliente (opcional):');
    if (name !== null) {
      setClientName(name);
      generatePDF(cartToRender, name, currentCartTotal);
    }
  };

  const handleWhatsApp = () => {
    if (cartToRender.length === 0) return;
    const url = generateWhatsAppLink(cartToRender, currentCartTotal);
    window.open(url, '_blank');
  };

  const handleInputChange = (id: string, value: string) => {
    // Si el usuario borra todo, no hacemos nada (esperamos un número)
    if (value === '') return;
    
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      updateCartQuantity(id, num);
    }
  };

  return (
    <div 
      className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:static md:shadow-none md:border-l border-gray-200 flex flex-col`}
    >
      {/* Header */}
      <div className={`p-4 flex justify-between items-center text-white ${isSpecial ? 'bg-gray-900' : 'bg-chalkboard'}`}>
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-5 h-5 text-alfonsa" />
          <h2 className="font-bold text-lg">Presupuesto {isSpecial && '(Esp)'}</h2>
        </div>
        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cartToRender.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <p>El presupuesto está vacío.</p>
            <p className="text-sm">Agregá productos del catálogo.</p>
          </div>
        ) : (
          cartToRender.map((item) => (
            <div key={item.id} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg border border-gray-100 group">
              <div className="flex-1 pr-2">
                <p className="text-sm font-semibold text-gray-800 line-clamp-2">{item.name}</p>
                <p className="text-xs text-gray-500 font-mono mb-1">{item.id}</p>
                <div className={`font-bold text-sm ${isSpecial ? 'text-red-600' : 'text-alfonsa'}`}>
                  ${(item.selectedPrice * item.quantity).toLocaleString('es-AR')}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center border bg-white rounded overflow-hidden">
                  <button 
                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    className="px-2 py-1 text-gray-500 hover:bg-gray-100 border-r"
                  >-</button>
                  
                  <input 
                    type="number" 
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleInputChange(item.id, e.target.value)}
                    className="w-12 text-center text-sm font-medium bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-alfonsa/50 py-1"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />

                  <button 
                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    className="px-2 py-1 text-gray-500 hover:bg-gray-100 border-l"
                  >+</button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Totals */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex justify-between items-end mb-4">
          <span className="text-gray-500 font-medium">Total Estimado</span>
          <span className="text-2xl font-bold text-gray-900">${currentCartTotal.toLocaleString('es-AR')}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
           <input 
             type="text" 
             placeholder="Nombre Cliente (Opc)"
             className="col-span-2 border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-alfonsa outline-none"
             value={clientName}
             onChange={(e) => setClientName(e.target.value)}
           />
           <button 
             onClick={handleExportPDF}
             disabled={cartToRender.length === 0}
             className="flex items-center justify-center px-4 py-2 bg-gray-800 text-white rounded hover:bg-black transition-colors disabled:opacity-50 text-sm font-medium"
           >
             <FileText className="w-4 h-4 mr-2" /> PDF
           </button>
           <button 
             onClick={handleWhatsApp}
             disabled={cartToRender.length === 0}
             className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
           >
             <Send className="w-4 h-4 mr-2" /> WhatsApp
           </button>
        </div>
        
        <div className="flex justify-between items-center mt-2 border-t pt-2">
            {/* Mobile Back Button - Only visible on small screens when sidebar is open/modal */}
           <button 
             onClick={onClose} 
             className="md:hidden flex items-center text-gray-500 hover:text-gray-700 py-2 px-2"
           >
              <ArrowLeft className="w-5 h-5" />
           </button>
           
           <button 
             onClick={() => clearCart(isSpecial)}
             disabled={cartToRender.length === 0}
             className="text-xs text-red-500 hover:underline py-1 ml-auto"
           >
             Vaciar Presupuesto
           </button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;