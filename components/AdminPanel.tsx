import React, { useState, useEffect } from 'react';
import { useInventory } from '../store/InventoryContext';
import FileUpload from './FileUpload';
import { parseArticlesExcel, parseStockExcel, consolidateData, bulkUpsertProducts, deleteAllProducts } from '../services/excelService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { Product } from '../types';
import { Download, Search, Share2, Link as LinkIcon, Lock, User, Key, LogOut, Loader2, Database, AlertTriangle, CheckCircle2, Edit2, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Inventory State
  const { products, refreshProducts, updateProduct } = useInventory();
  const [uploadedArticles, setUploadedArticles] = useState<Partial<Product>[]>([]);
  const [uploadedStocks, setUploadedStocks] = useState<{id: string, stock: number}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Product | null>(null);
  
  // Upload State
  const [isSaving, setIsSaving] = useState(false);
  const [dbMode, setDbMode] = useState<'cloud' | 'local'>('local');

  // Check for existing session on mount
  useEffect(() => {
    const session = sessionStorage.getItem('alfonsa_admin_session');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
    setDbMode(isSupabaseConfigured() ? 'cloud' : 'local');
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toLowerCase() === 'alfonsadistribuidora' && password === 'vinosesmas') {
      setIsAuthenticated(true);
      sessionStorage.setItem('alfonsa_admin_session', 'true');
      setAuthError('');
    } else {
      setAuthError('Usuario o contraseña incorrectos.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('alfonsa_admin_session');
    setUsername('');
    setPassword('');
  };

  const handleArticlesUpload = async (file: File) => {
    const data = await parseArticlesExcel(file);
    setUploadedArticles(data);
  };

  const handleStockUpload = async (file: File) => {
    const data = await parseStockExcel(file);
    setUploadedStocks(data);
  };

  const handleConsolidateAndSave = async () => {
    if (uploadedArticles.length === 0) {
      alert("Primero subí el archivo de Artículos");
      return;
    }

    try {
      setIsSaving(true);
      // 1. Consolidate locally
      const merged = consolidateData(uploadedArticles, uploadedStocks);
      
      // 2. Clear existing DB (Reemplazo total)
      await deleteAllProducts();

      // 3. Upload new data to Supabase (or Local)
      await bulkUpsertProducts(merged);
      
      // 4. Refresh Context
      await refreshProducts();

      alert(`¡Éxito! Base de datos actualizada con ${merged.length} productos.`);
      setUploadedArticles([]);
      setUploadedStocks([]);
    } catch (error: any) {
      console.error(error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copySpecialLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/lista-china`;
    navigator.clipboard.writeText(url);
    alert("Enlace copiado al portapapeles: " + url);
  };

  // Edit Handlers
  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (editForm) {
      await updateProduct(editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleEditChange = (field: keyof Product, value: any) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value
      });
    }
  };

  // --- LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-md w-full border border-gray-200">
          <div className="bg-alfonsa p-8 text-center">
            <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Acceso Administrativo</h2>
            <p className="text-orange-100 text-sm mt-1">Alfonsa Distribuidora</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-alfonsa focus:border-alfonsa sm:text-sm"
                    placeholder="Ingresá tu usuario"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-alfonsa focus:border-alfonsa sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {authError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-alfonsa hover:bg-alfonsa-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alfonsa transition-colors"
              >
                INGRESAR
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN PANEL VIEW ---
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 border-l-8 border-alfonsa pl-4">
            Panel Administrador
          </h1>
          <div className="mt-2 pl-6 flex items-center text-sm">
            {dbMode === 'cloud' ? (
              <span className="flex items-center text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Conectado a Supabase (Nube)
              </span>
            ) : (
              <span className="flex items-center text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">
                <AlertTriangle className="w-4 h-4 mr-1" /> Modo Local (Demo) - Supabase no configurado
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-alfonsa-dark">
          <Download className="mr-2 h-5 w-5" /> Importar y Reemplazar Inventario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUpload 
            label="1. Archivo de Artículos" 
            description="Columnas: codart, desart, familias, precios..."
            onFileSelect={handleArticlesUpload}
          />
          <FileUpload 
            label="2. Archivo de Stock" 
            description="Fila 8+. Columnas: Código, Stock..."
            onFileSelect={handleStockUpload}
          />
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleConsolidateAndSave}
            disabled={uploadedArticles.length === 0 || isSaving}
            className={`px-6 py-3 rounded-lg font-bold text-white transition-all flex items-center
              ${uploadedArticles.length > 0 && !isSaving
                ? 'bg-alfonsa hover:bg-alfonsa-dark shadow-md hover:shadow-lg' 
                : 'bg-gray-300 cursor-not-allowed'}`}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" /> Procesando...
              </>
            ) : (
              <>
                <Database className="h-5 w-5 mr-2" />
                {uploadedStocks.length > 0 ? 'BORRAR TODO y Guardar Nuevo' : 'Guardar Artículos (Stock 0)'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Special Access Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-md p-6 mb-8 text-white flex flex-col md:flex-row justify-between items-center">
        <div>
          <h2 className="text-lg font-bold flex items-center mb-1">
            <Share2 className="mr-2 h-5 w-5 text-alfonsa" /> Acceso Lista 4 (Especial)
          </h2>
          <p className="text-gray-400 text-sm">Compartí este enlace con clientes especiales.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Link to="/lista-china" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors">
            Abrir Vista
          </Link>
          <button onClick={copySpecialLink} className="px-4 py-2 bg-alfonsa hover:bg-alfonsa-dark rounded text-sm font-bold flex items-center transition-colors">
            <LinkIcon className="mr-2 h-4 w-4" /> Copiar Link
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-700">Inventario Actual ({products.length})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o código..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alfonsa focus:border-transparent text-sm w-64 bg-white text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-3">Cod</th>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3 w-24">Stock</th>
                <th className="px-6 py-3 text-right w-28">Lista 1</th>
                <th className="px-6 py-3 text-right w-28">Lista 2</th>
                <th className="px-6 py-3 text-right w-28">Lista 3</th>
                <th className="px-6 py-3 text-right w-28 text-red-600">Lista 4</th>
                <th className="px-6 py-3 text-center w-20">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.slice(0, 100).map((product) => {
                const isEditing = editingId === product.id;
                
                return (
                  <tr key={product.id} className={`transition-colors ${isEditing ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-3 font-mono text-xs">{product.id}</td>
                    
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {isEditing && editForm ? (
                         <input 
                           type="text" 
                           value={editForm.name}
                           onChange={(e) => handleEditChange('name', e.target.value)}
                           className="w-full border border-gray-300 p-1 rounded bg-white text-gray-900"
                         />
                      ) : product.name}
                    </td>

                    <td className="px-6 py-3">
                      {isEditing && editForm ? (
                         <input 
                           type="number" 
                           value={editForm.stock}
                           onChange={(e) => handleEditChange('stock', Number(e.target.value))}
                           className="w-20 border border-gray-300 p-1 rounded bg-white text-gray-900 text-center"
                         />
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.stock}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3 text-right">
                       {isEditing && editForm ? (
                         <input 
                           type="number" 
                           value={editForm.price_1}
                           onChange={(e) => handleEditChange('price_1', Number(e.target.value))}
                           className="w-full border border-gray-300 p-1 rounded bg-white text-gray-900 text-right"
                         />
                      ) : `$${product.price_1.toFixed(2)}`}
                    </td>
                    
                    <td className="px-6 py-3 text-right">
                       {isEditing && editForm ? (
                         <input 
                           type="number" 
                           value={editForm.price_2}
                           onChange={(e) => handleEditChange('price_2', Number(e.target.value))}
                           className="w-full border border-gray-300 p-1 rounded bg-white text-gray-900 text-right"
                         />
                      ) : `$${product.price_2.toFixed(2)}`}
                    </td>

                    <td className="px-6 py-3 text-right">
                       {isEditing && editForm ? (
                         <input 
                           type="number" 
                           value={editForm.price_3}
                           onChange={(e) => handleEditChange('price_3', Number(e.target.value))}
                           className="w-full border border-gray-300 p-1 rounded bg-white text-gray-900 text-right"
                         />
                      ) : `$${product.price_3.toFixed(2)}`}
                    </td>

                    <td className="px-6 py-3 text-right text-red-600 font-semibold">
                       {isEditing && editForm ? (
                         <input 
                           type="number" 
                           value={editForm.price_4}
                           onChange={(e) => handleEditChange('price_4', Number(e.target.value))}
                           className="w-full border border-gray-300 p-1 rounded bg-white text-gray-900 text-right"
                         />
                      ) : `$${product.price_4.toFixed(2)}`}
                    </td>

                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center space-x-2">
                        {isEditing ? (
                          <>
                            <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Guardar">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEditing} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Cancelar">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => startEditing(product)} className="p-1 text-gray-500 hover:text-alfonsa hover:bg-orange-50 rounded" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredProducts.length > 100 && (
          <div className="p-3 text-center text-xs text-gray-400 bg-gray-50 border-t">
            Mostrando primeros 100 resultados de {filteredProducts.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;