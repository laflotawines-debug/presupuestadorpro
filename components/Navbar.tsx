import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, UploadCloud } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';
  const isSpecial = location.pathname.includes('lista-china');

  return (
    <nav className="bg-chalkboard text-white shadow-lg sticky top-0 z-50 border-b-4 border-alfonsa">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <div className="bg-alfonsa p-2 rounded-lg transform rotate-3">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">ALFONSA</span>
            </Link>
            {!isAdmin && !isSpecial && (
               <span className="ml-4 text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 hidden sm:inline-block">Mayorista de Bebidas</span>
            )}
            {isSpecial && (
               <span className="ml-4 text-xs bg-red-800 px-2 py-1 rounded text-red-100 font-bold border border-red-500">LISTA 4 - ESPECIAL</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {!isAdmin ? (
               <Link to="/admin" className="flex items-center space-x-2 text-gray-300 hover:text-alfonsa transition-colors px-3 py-2 rounded-md hover:bg-white/5 group" title="Acceso Admin">
                 <UploadCloud className="h-5 w-5 group-hover:text-white" />
                 <span className="font-medium text-sm hidden sm:inline-block">Cargar Excel / Admin</span>
                 <span className="font-medium text-sm sm:hidden">Admin</span>
               </Link>
            ) : (
               <Link to="/" className="text-alfonsa font-semibold flex items-center space-x-1 hover:text-white transition-colors">
                 <ShieldCheck className="h-5 w-5" />
                 <span>Volver al Catálogo</span>
               </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;