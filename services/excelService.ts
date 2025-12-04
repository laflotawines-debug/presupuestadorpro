import * as XLSX from 'xlsx';
import { Product, ExcelArticleRow, ExcelStockRow } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const parseArticlesExcel = async (file: File): Promise<Partial<Product>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Read file holding raw data
        const jsonData = XLSX.utils.sheet_to_json<ExcelArticleRow>(sheet);

        const products: Partial<Product>[] = jsonData.map((row) => ({
          id: String(row.codart || '').trim(),
          name: row.desart || 'Sin Nombre',
          family: row.familia || 'General',
          subfamily: row.subfamily || '',
          price_1: Number(row.pventa_1) || 0,
          price_2: Number(row.pventa_2) || 0,
          price_3: Number(row.pventa_3) || 0,
          price_4: Number(row.pventa_4) || 0,
          stock: 0, // Default stock 0 until merged
        })).filter(p => p.id !== ''); // Filter out empty rows

        resolve(products);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const parseStockExcel = async (file: File): Promise<{id: string, stock: number}[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Stock file starts at row 8 (index 7)
        const jsonData = XLSX.utils.sheet_to_json<ExcelStockRow>(sheet, { range: 7 });

        const stockItems = jsonData.map(row => ({
          id: String(row['Código'] || '').trim(),
          stock: Number(row['Stock']) || 0
        })).filter(item => item.id !== '');

        resolve(stockItems);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const consolidateData = (articles: Partial<Product>[], stocks: {id: string, stock: number}[]): Product[] => {
  // Create a map of articles for O(1) access
  const productMap = new Map<string, Product>();

  // 1. Load articles
  articles.forEach(art => {
    if (art.id) {
      productMap.set(art.id, art as Product);
    }
  });

  // 2. Update stock
  stocks.forEach(stk => {
    const product = productMap.get(stk.id);
    if (product) {
      product.stock = stk.stock;
    } 
  });

  return Array.from(productMap.values());
};

export const deleteAllProducts = async () => {
  if (isSupabaseConfigured()) {
    // Delete all rows where id is not empty (effectively all)
    const { error } = await supabase
      .from('products')
      .delete()
      .neq('id', '______placeholder'); 
    
    if (error) {
      throw new Error(`Error borrando datos antiguos: ${error.message}`);
    }
  } else {
    // Fallback LocalStorage
    localStorage.removeItem('alfonsa_products_backup');
  }
};

// Function to upload to Supabase in batches
export const bulkUpsertProducts = async (products: Product[]) => {
  if (isSupabaseConfigured()) {
    const BATCH_SIZE = 500;
    
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      
      const { error } = await supabase
        .from('products')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        throw new Error(`Error subiendo lote ${i}: ${error.message}`);
      }
    }
  } else {
    // Fallback LocalStorage
    console.warn("Supabase no configurado. Guardando en LocalStorage.");
    localStorage.setItem('alfonsa_products_backup', JSON.stringify(products));
  }
};

export const updateSingleProduct = async (product: Product) => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('products')
      .update(product)
      .eq('id', product.id);
    
    if (error) {
      throw new Error(`Error actualizando producto: ${error.message}`);
    }
  } else {
    // Fallback LocalStorage
    const saved = localStorage.getItem('alfonsa_products_backup');
    if (saved) {
      let products = JSON.parse(saved) as Product[];
      products = products.map(p => p.id === product.id ? product : p);
      localStorage.setItem('alfonsa_products_backup', JSON.stringify(products));
    }
  }
};